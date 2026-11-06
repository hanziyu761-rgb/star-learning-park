package expo.modules.offlineasr

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.SystemClock
import androidx.core.content.ContextCompat
import com.k2fsa.sherpa.onnx.EndpointConfig
import com.k2fsa.sherpa.onnx.EndpointRule
import com.k2fsa.sherpa.onnx.FeatureConfig
import com.k2fsa.sherpa.onnx.OnlineModelConfig
import com.k2fsa.sherpa.onnx.OnlineRecognizer
import com.k2fsa.sherpa.onnx.OnlineRecognizerConfig
import com.k2fsa.sherpa.onnx.OnlineZipformer2CtcModelConfig
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * 离线语音识别（星星学习乐园 V2.17）。
 * 用 sherpa-onnx（Apache-2.0）和中文小模型在手机里识别：录音只在内存中处理，不保存、不上传。
 * 事件：onPartial { text }（边说边出字）、onFinal { text, reason }（说完：speech-end / no-speech / max-time / stopped）、onError { message }
 */
class OfflineAsrModule : Module() {
  private val sampleRate = 16000
  private var recognizer: OnlineRecognizer? = null
  private var worker: Thread? = null
  @Volatile private var stopRequested = false
  @Volatile private var cancelRequested = false

  override fun definition() = ModuleDefinition {
    Name("OfflineAsr")
    Events("onPartial", "onFinal", "onError")

    Function("isAvailable") { true }

    AsyncFunction("getPermission") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.RECORD_AUDIO)
    }
    AsyncFunction("requestPermission") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.RECORD_AUDIO)
    }

    /** 开始听：模型第一次加载约需 1 秒；返回时已经在录音 */
    AsyncFunction("start") { maxSeconds: Double ->
      val ctx = appContext.reactContext ?: throw CodedException("NO_CONTEXT", "应用还没准备好", null)
      if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
        throw CodedException("NO_PERMISSION", "没有麦克风权限", null)
      }
      if (worker?.isAlive == true) throw CodedException("BUSY", "正在听", null)
      val rec = recognizer ?: createRecognizer(ctx).also { recognizer = it }
      val audio = openMic()
      stopRequested = false
      cancelRequested = false
      audio.startRecording()
      worker = Thread({ listen(rec, audio, maxSeconds.coerceIn(3.0, 30.0)) }, "offline-asr").also { it.start() }
    }

    /** 孩子点“说完了”：识别剩下的声音，发出 onFinal */
    AsyncFunction("stop") {
      stopRequested = true
      worker?.join(3000)
    }

    /** 离开页面：直接丢弃，不发结果 */
    AsyncFunction("cancel") {
      cancelRequested = true
      worker?.join(3000)
    }

    OnDestroy {
      cancelRequested = true
      worker?.join(3000)
      recognizer?.release()
      recognizer = null
    }
  }

  private fun createRecognizer(ctx: android.content.Context): OnlineRecognizer {
    val model = OnlineModelConfig().apply {
      zipformer2Ctc = OnlineZipformer2CtcModelConfig().apply { model = "asr/model.int8.onnx" }
      tokens = "asr/tokens.txt"
      numThreads = 2
      provider = "cpu"
      debug = false
    }
    val config = OnlineRecognizerConfig().apply {
      featConfig = FeatureConfig().apply {
        sampleRate = this@OfflineAsrModule.sampleRate
        featureDim = 80
      }
      modelConfig = model
      enableEndpoint = true
      // 规则 1：一直没说话 3 秒就结束；规则 2：说完后停顿 1.2 秒就结束（小朋友说话会停顿，不能太短）；规则 3：最长 20 秒
      endpointConfig = EndpointConfig(
        EndpointRule(false, 3.0f, 0.0f),
        EndpointRule(true, 1.2f, 0.0f),
        EndpointRule(false, 0.0f, 20.0f),
      )
      decodingMethod = "greedy_search"
    }
    return OnlineRecognizer(ctx.assets, config)
  }

  @SuppressLint("MissingPermission") // 调用前已检查权限
  private fun openMic(): AudioRecord {
    val minBuf = AudioRecord.getMinBufferSize(sampleRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
    val audio = AudioRecord(
      MediaRecorder.AudioSource.VOICE_RECOGNITION,
      sampleRate,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
      maxOf(minBuf, sampleRate / 5 * 2),
    )
    if (audio.state != AudioRecord.STATE_INITIALIZED) {
      audio.release()
      throw CodedException("MIC_BUSY", "麦克风打不开，可能被别的应用占用", null)
    }
    return audio
  }

  private fun listen(rec: OnlineRecognizer, audio: AudioRecord, maxSeconds: Double) {
    val stream = rec.createStream("")
    val buf = ShortArray(sampleRate / 10) // 每次 0.1 秒
    val started = SystemClock.elapsedRealtime()
    var last = ""
    var reason = "stopped"
    try {
      while (true) {
        if (cancelRequested) {
          reason = "cancel"
          break
        }
        if (stopRequested) break
        val n = audio.read(buf, 0, buf.size)
        if (n < 0) {
          sendEvent("onError", mapOf("message" to "录音出错（$n）"))
          reason = "cancel"
          break
        }
        if (n == 0) continue
        stream.acceptWaveform(FloatArray(n) { buf[it] / 32768f }, sampleRate)
        while (rec.isReady(stream)) rec.decode(stream)
        val text = rec.getResult(stream).text.trim()
        if (text != last) {
          last = text
          sendEvent("onPartial", mapOf("text" to text))
        }
        if (rec.isEndpoint(stream)) {
          reason = if (text.isEmpty()) "no-speech" else "speech-end"
          break
        }
        if ((SystemClock.elapsedRealtime() - started) / 1000.0 > maxSeconds) {
          reason = "max-time"
          break
        }
      }
      try {
        audio.stop()
      } catch (_: IllegalStateException) {
      }
      if (reason != "cancel") {
        // 补一小段静音，让最后一个字也能识别出来
        stream.acceptWaveform(FloatArray(sampleRate * 3 / 10), sampleRate)
        stream.inputFinished()
        while (rec.isReady(stream)) rec.decode(stream)
        val text = rec.getResult(stream).text.trim()
        sendEvent("onFinal", mapOf("text" to text, "reason" to if (text.isEmpty() && reason == "speech-end") "no-speech" else reason))
      }
    } catch (e: Throwable) {
      sendEvent("onError", mapOf("message" to (e.message ?: "识别出错")))
    } finally {
      audio.release()
      stream.release()
    }
  }
}
