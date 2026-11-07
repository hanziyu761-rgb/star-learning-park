/**
 * 预先录好的朗读：V2.21 起全 APP 统一用“星星宝童声”（阿里云百炼 CosyVoice 龙呼呼，中英文同一个声音）。
 * 课程、讲解、短文、单词卡等固定内容提前录好放在 APP 里（没网也能听）；
 * 随机出的题（题库、口算、每日挑战等）联网时用同一个童声现念，念过的存在手机里（见 ttsCache）；没网又没存过时才用手机语音。
 * 单文件 HTML 版和网页版不带录音文件。
 */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import type { Speakable } from '@/lesson/types';
import { CLIPS } from './voiceClips';

/** 录音编号：FNV-1a 32 位（按 UTF-16 编码单元），与 tools/voice/generate.py 相同 */
export function clipId(lang: string, text: string): string {
  const s = `${lang}|${text}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function findClip(item: Speakable): number | undefined {
  return CLIPS.c?.[clipId(item.lang, item.text.trim())];
}

let player: AudioPlayer | null = null;
let webAudio: { pause(): void } | null = null;

export function stopClip() {
  if (webAudio) {
    try {
      webAudio.pause();
    } catch {
      // 忽略
    }
    webAudio = null;
  }
  if (!player) return;
  try {
    player.pause();
    player.remove();
  } catch {
    // 已经释放
  }
  player = null;
}

/** 有录音就播放并返回 true；没有录音（或网页版）返回 false，由调用方改用手机语音 */
export function playClip(item: Speakable, rate: number, onDone: () => void): boolean {
  if (Platform.OS === 'web') return false;
  const src = findClip(item);
  if (src === undefined) return false;
  stopClip();
  try {
    const p = createAudioPlayer(src);
    player = p;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (player === p) stopClip();
      onDone();
    };
    p.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish) finish();
    });
    if (rate !== 1) p.setPlaybackRate(rate);
    p.play();
    return true;
  } catch {
    stopClip();
    return false;
  }
}

/** 播放网络上的音频（星星宝的云端语音，V2.18）。成功开始播放返回 true */
export function playUri(uri: string, onDone: () => void, onFail: () => void, rate = 1): boolean {
  stopClip();
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    onDone();
  };
  try {
    if (Platform.OS === 'web') {
      const AudioCtor = (globalThis as { Audio?: new (src: string) => HTMLAudioElement }).Audio;
      if (!AudioCtor) return false;
      const a = new AudioCtor(uri);
      webAudio = a;
      a.playbackRate = rate;
      a.onended = finish;
      a.onerror = () => {
        if (!finished) {
          finished = true;
          onFail();
        }
      };
      a.play().catch(() => {
        if (!finished) {
          finished = true;
          onFail();
        }
      });
      return true;
    }
    const p = createAudioPlayer({ uri });
    player = p;
    if (rate !== 1) p.setPlaybackRate(rate);
    p.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish) {
        if (player === p) stopClip();
        finish();
      }
    });
    p.play();
    return true;
  } catch {
    stopClip();
    return false;
  }
}
