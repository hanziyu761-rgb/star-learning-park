"""
用开源语音模型 Kokoro-82M（Apache-2.0，可商用）把 APP 里固定的朗读内容提前录好（V2.16）。

输入：tools/voice/out/speakables.json（由 tools/voice/collect.review.ts 生成）
输出：assets/voice/<f|m>/<编号>.mp3、src/speech/voiceClips.native.ts（声音清单，供安卓/苹果 APP 播放；网页版用 voiceClips.ts 空清单）

用法：
  python tools/voice/generate.py --models <模型目录> --zh-female zf_xiaoyi --zh-male zm_yunxi \
         --en-female af_heart --en-male am_puck [--limit 20]

中文：课程里人工填写的拼音优先（避免多音字读错），没有拼音的字按词语自动注音；词内连续两个三声，前一个读二声。
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time

import soundfile as sf
from kokoro_onnx import Kokoro
from misaki.zh import ZHG2P
from pypinyin import Style, lazy_pinyin
from pypinyin.contrib.tone_convert import to_tone3
import cn2an
import jieba

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPEED = 0.88  # 录得稍慢一点；APP 里“正常语速”再加快播放


def clip_id(lang: str, text: str) -> str:
    """与 src/speech/clips.ts 的 clipId 相同：FNV-1a 32 位，按 UTF-16 编码单元计算"""
    h = 0x811C9DC5
    data = f"{lang}|{text}".encode("utf-16-le")
    for i in range(0, len(data), 2):
        h ^= data[i] | (data[i + 1] << 8)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return format(h, "08x")


HAN = re.compile(r"[一-鿿]")
PUNCT = {"，": ",", "。": ".", "！": "!", "？": "?", "、": ",", "：": ",", "；": ",", "…": "…", "—": ",",
         ",": ",", ".": ".", "!": "!", "?": "?", ":": ",", ";": ","}
OPS = {"+": "加", "-": "减", "−": "减", "×": "乘", "÷": "除以", "=": "等于", "＝": "等于", ">": "大于", "<": "小于", "%": "百分之"}


def tone3(py: str) -> str:
    t = to_tone3(py, neutral_tone_with_five=True)
    return t if t[-1].isdigit() else t + "5"


def sandhi(syls):
    """词内三声连读：前一个三声读二声"""
    out = list(syls)
    for i in range(len(out) - 1):
        if out[i].endswith("3") and out[i + 1].endswith("3"):
            out[i] = out[i][:-1] + "2"
    return out


def zh_phonemes(text: str, py=None) -> str:
    # 运算符、数字换成汉字读法（这些字没有人工拼音，交给自动注音）
    s = text
    for k, v in OPS.items():
        s = s.replace(k, v)
    s = re.sub(r"\d+(\.\d+)?", lambda m: cn2an.an2cn(m.group(0)), s)
    # 原文里每个汉字对应的人工拼音（运算符、数字换出来的字没有）
    han_py = []
    i_py = 0
    for ch in text:
        if HAN.match(ch):
            han_py.append((py[i_py] if py and i_py < len(py) else "") or "")
            i_py += 1
    # 把换写后的文本与原文汉字对齐：原文汉字按顺序出现在换写后的文本里
    orig_hans = [c for c in text if HAN.match(c)]
    aligned = []
    k = 0
    for ch in s:
        if HAN.match(ch):
            if k < len(orig_hans) and ch == orig_hans[k]:
                aligned.append(han_py[k]); k += 1
            else:
                aligned.append("")
    parts = []
    pos = 0
    for seg in re.findall(r"[一-鿿]+|[^一-鿿]+", s):
        if HAN.match(seg[0]):
            words = jieba.lcut(seg, cut_all=False)
            ipa_words = []
            for w in words:
                given = aligned[pos:pos + len(w)]
                pos += len(w)
                if all(given):
                    syls = sandhi([tone3(p) for p in given])
                    ipa_words.append("".join(ZHG2P.py2ipa(x) for x in syls))
                else:
                    auto = lazy_pinyin(w, style=Style.TONE3, neutral_tone_with_five=True)
                    syls = sandhi([g or (a if a[-1].isdigit() else a + "5") for g, a in zip([tone3(p) if p else "" for p in given], auto)])
                    ipa_words.append("".join(ZHG2P.py2ipa(x) for x in syls))
            parts.append(" ".join(ipa_words))
        else:
            parts.append("".join(PUNCT.get(c, " " if c.isspace() else "") for c in seg))
    out = "".join(parts)
    return re.sub(r"\s+", " ", out).replace(chr(815), "").strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", required=True)
    ap.add_argument("--zh-female", required=True)
    ap.add_argument("--zh-male", required=True)
    ap.add_argument("--en-female", required=True)
    ap.add_argument("--en-male", required=True)
    ap.add_argument("--zh-child", required=True, help="童声（只有中文；英语童声用英语女声）")
    ap.add_argument("--limit", type=int, default=0)
    a = ap.parse_args()
    items = json.load(open(os.path.join(ROOT, "tools/voice/out/speakables.json"), encoding="utf-8"))
    if a.limit:
        items = items[: a.limit]
    k = Kokoro(os.path.join(a.models, "kokoro-v1.0.onnx"), os.path.join(a.models, "voices-v1.0.bin"))
    voices = {("zh-CN", "f"): a.zh_female, ("zh-CN", "m"): a.zh_male, ("zh-CN", "c"): a.zh_child, ("en-US", "f"): a.en_female, ("en-US", "m"): a.en_male}
    made = {"f": [], "m": [], "c": []}
    seconds = 0.0
    t0 = time.time()
    for n, it in enumerate(items):
        cid = clip_id(it["lang"], it["text"])
        for g in ("f", "m", "c"):
            if (it["lang"], g) not in voices:
                continue
            out = os.path.join(ROOT, "assets/voice", g, cid + ".mp3")
            os.makedirs(os.path.dirname(out), exist_ok=True)
            if not os.path.exists(out):
                voice = voices[(it["lang"], g)]
                if it["lang"] == "zh-CN":
                    samples, sr = k.create(zh_phonemes(it["text"], it.get("py")), voice=voice, speed=SPEED, is_phonemes=True)
                else:
                    samples, sr = k.create(it["text"], voice=voice, speed=SPEED, lang="en-us")
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    sf.write(tmp.name, samples, sr)
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name, "-ac", "1", "-ar", "24000", "-b:a", "24k", out], check=True)
                os.remove(tmp.name)
                seconds += len(samples) / sr
            made[g].append(cid)
        if n % 25 == 0:
            print(f"{n + 1}/{len(items)} 已录 {seconds / 60:.1f} 分钟音频，用时 {(time.time() - t0) / 60:.1f} 分钟", flush=True)
    # 声音清单：Metro 打包需要每个文件写成 require()
    lines = [
        "// 自动生成：tools/voice/generate.py，请勿手改。预先录好的朗读（Kokoro-82M，Apache-2.0）。",
        f"// 声音：中文女声 {a.zh_female}、中文男声 {a.zh_male}、中文童声 {a.zh_child}、英语女声 {a.en_female}、英语男声 {a.en_male}（英语童声用英语女声）",
        "export const CLIP_VOICES = " + json.dumps({"zhF": a.zh_female, "zhM": a.zh_male, "zhC": a.zh_child, "enF": a.en_female, "enM": a.en_male}) + ";",
        "export const CLIPS: Record<'f' | 'm' | 'c', Record<string, number>> = {",
    ]
    for g in ("f", "m", "c"):
        lines.append(f"  {g}: {{")
        for cid in sorted(set(made[g])):
            lines.append(f"    '{cid}': require('../../assets/voice/{g}/{cid}.mp3'),")
        lines.append("  },")
    lines.append("};")
    open(os.path.join(ROOT, "src/speech/voiceClips.native.ts"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(f"完成：{len(items)} 句（中文 3 种声音、英语 2 种），新录 {seconds / 60:.1f} 分钟音频，用时 {(time.time() - t0) / 60:.1f} 分钟")


if __name__ == "__main__":
    sys.exit(main())
