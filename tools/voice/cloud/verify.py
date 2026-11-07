"""
回听童声录音（V2.21）：用本机离线中文语音识别（sherpa-onnx paraformer，仅用于检查，不进 APP）把每句中文录音转成文字，
和原文比对，列出可能读错、漏读的句子。英文和单字词识别不可靠，只检查 3 个字以上的中文句子。
用法：python3 tools/voice/cloud/verify.py <录音目录> <paraformer 模型目录>
"""
import json, os, re, subprocess, sys
import numpy as np
import sherpa_onnx

d, model = sys.argv[1], sys.argv[2]
LIST = json.load(open(os.path.join(os.path.dirname(__file__), "list.json"), encoding="utf-8"))
rec = sherpa_onnx.OfflineRecognizer.from_paraformer(paraformer=f"{model}/model.int8.onnx", tokens=f"{model}/tokens.txt", num_threads=4)
han = lambda s: re.sub(r"[^一-鿿0-9]", "", s)
NUM = dict(zip("0123456789", "零一二三四五六七八九"))


def norm(s):
    return "".join(NUM.get(c, c) for c in han(s))


def dist(a, b):
    p = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        c = [i]
        for j, cb in enumerate(b, 1):
            c.append(min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (ca != cb)))
        p = c
    return p[-1]


bad, total, errs, chars = [], 0, 0, 0
for x in LIST:
    if x["lang"] != "zh-CN" or len(han(x["text"])) < 3:
        continue
    a = np.frombuffer(subprocess.run(["ffmpeg", "-loglevel", "error", "-i", os.path.join(d, x["id"] + ".mp3"), "-f", "f32le", "-ar", "16000", "-ac", "1", "-"], capture_output=True, check=True).stdout, dtype=np.float32)
    s = rec.create_stream()
    s.accept_waveform(16000, a)
    rec.decode_stream(s)
    ref, hyp = norm(x["text"]), norm(s.result.text)
    e = dist(ref, hyp)
    total += 1
    errs += e
    chars += len(ref)
    if len(ref) and e / len(ref) > 0.15:
        bad.append({"id": x["id"], "text": x["text"], "heard": s.result.text, "cer": round(e / len(ref), 2), "sec": round(len(a) / 16000, 1)})
print(json.dumps({"checked": total, "cer": round(errs / max(chars, 1), 4), "suspect": len(bad)}, ensure_ascii=False))
json.dump(bad, open("/tmp/claude-0/tongsheng-suspect.json", "w"), ensure_ascii=False, indent=1)
for b in bad[:40]:
    print(b)
