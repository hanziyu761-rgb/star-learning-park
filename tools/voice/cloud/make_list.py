"""
生成童声录音清单（V2.21）：先运行 npx jest --testMatch '<rootDir>/tools/voice/*.review.ts' 收集固定朗读内容，
再运行本脚本写出 tools/voice/cloud/list.json（编号与 src/speech/clips.ts 的 clipId 相同），交给 record.ps1 录音。
内容有增加时重新生成清单，record.ps1 会跳过已录好的、只录新增的句子。
"""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def clip_id(lang: str, text: str) -> str:
    h = 0x811C9DC5
    s = f"{lang}|{text}"
    units = []
    for ch in s:
        cp = ord(ch)
        if cp > 0xFFFF:
            cp -= 0x10000
            units += [0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF)]
        else:
            units.append(cp)
    for u in units:
        h ^= u
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f"{h:08x}"


d = json.load(open(os.path.join(ROOT, "tools/voice/out/speakables.json"), encoding="utf-8"))
out = [{"id": clip_id(x["lang"], x["text"]), "lang": x["lang"], "text": x["text"]} for x in d]
assert len({o["id"] for o in out}) == len(out), "编号重复"
json.dump(out, open(os.path.join(ROOT, "tools/voice/cloud/list.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(out), "句")
