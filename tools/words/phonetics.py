"""
单词卡音标（V2.18）：用 CMU 发音词典（CMUdict，BSD 许可，美式发音）给所有单词自动注音，不手写。
输出 src/words/data/ipa.gen.ts：{ 单词: 美式音标 }。词典里没有的写在 MANUAL（同样按美式发音），仍查不到的报错。
用法：python tools/words/phonetics.py （需要 pip install cmudict）
"""
import json
import os
import re
import sys

import cmudict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = cmudict.dict()

V = {"AA": "ɑː", "AE": "æ", "AH": "ʌ", "AO": "ɔː", "AW": "aʊ", "AY": "aɪ", "EH": "ɛ", "ER": "ɝː", "EY": "eɪ",
     "IH": "ɪ", "IY": "iː", "OW": "oʊ", "OY": "ɔɪ", "UH": "ʊ", "UW": "uː"}
C = {"B": "b", "CH": "tʃ", "D": "d", "DH": "ð", "F": "f", "G": "ɡ", "HH": "h", "JH": "dʒ", "K": "k", "L": "l", "M": "m",
     "N": "n", "NG": "ŋ", "P": "p", "R": "r", "S": "s", "SH": "ʃ", "T": "t", "TH": "θ", "V": "v", "W": "w", "Y": "j",
     "Z": "z", "ZH": "ʒ"}
# 合法的词首辅音组合（重音符号放在这些辅音前面）
ONSETS = {("S", "T"), ("S", "P"), ("S", "K"), ("S", "M"), ("S", "N"), ("S", "L"), ("S", "W"), ("P", "R"), ("B", "R"),
          ("T", "R"), ("D", "R"), ("K", "R"), ("G", "R"), ("F", "R"), ("TH", "R"), ("P", "L"), ("B", "L"), ("K", "L"),
          ("G", "L"), ("F", "L"), ("S", "L"), ("K", "W"), ("T", "W"), ("D", "W"), ("S", "T", "R"), ("S", "K", "W"),
          ("S", "P", "R"), ("S", "K", "R"), ("SH", "R"), ("P", "Y"), ("B", "Y"), ("K", "Y"), ("M", "Y"), ("F", "Y"),
          ("V", "Y"), ("HH", "Y"), ("N", "Y")}

# 英式拼写 → 词典里的美式拼写（发音按美式）
SPELL = {"favourite": "favorite", "metre": "meter", "maths": "math", "labour": "labor", "colour": "color"}
# 词典里没有的（按美式读音手工注音，只限这几个）
MANUAL = {"turpan": "ˈtʊrpɑːn", "westray": "ˈwɛstreɪ", "a.m.": "ˌeɪ ˈɛm", "p.m.": "ˌpiː ˈɛm", "pe": "ˌpiː ˈiː",
          "gps": "ˌdʒiː piː ˈɛs", "uk": "ˌjuː ˈkeɪ", "usa": "ˌjuː ɛs ˈeɪ", "tv": "ˌtiː ˈviː", "ms": "mɪz",
          "kung": "kʊŋ", "fu": "fuː", "pipa": "ˈpiːpɑː", "schoolbag": "ˈskuːlbæɡ", "teacher's": "ˈtiːtʃɚz", "teachers'": "ˈtiːtʃɚz", "yo": "joʊ"}
# 词典第一个读音不是课本里的用法时，指定用第几个（例如 live 作动词读 /lɪv/）
VARIANT = {"read": 1, "live": 1, "use": 1, "and": 1, "ear": 1, "fourteen": 1, "hers": 1, "sometimes": 1, "thirty": 1,
           "yours": 1, "yourself": 1, "monday": 1, "friday": 1, "saturday": 1, "wednesday": 1, "tuesday": 1}
# 同形不同音：按单元选读音（例如六年级下册 read 是过去式）
UNIT_OVERRIDE = {("pep6b-2", "read"): "rɛd"}


def arpa_to_ipa(ph):
    syl = []
    out = []
    # 找重音元音位置
    stress = [i for i, p in enumerate(ph) if p[-1] == "1"]
    multi = sum(1 for p in ph if p[-1].isdigit()) > 1
    mark_at = None
    if multi and stress:
        i = stress[0]
        j = i
        while j > 0 and not ph[j - 1][-1].isdigit():
            j -= 1
        cons = ph[j:i]
        # 从后往前取最长的合法词首辅音组合
        k = len(cons)
        best = k
        for start in range(k):
            tail = tuple(cons[start:])
            if len(tail) == 1 or tail in ONSETS:
                best = start
                break
        mark_at = j + best if cons else i
    for i, p in enumerate(ph):
        if i == mark_at:
            out.append("ˈ")
        base, st = (p[:-1], p[-1]) if p[-1].isdigit() else (p, None)
        if base in V:
            if base == "AH" and st == "0":
                out.append("ə")
            elif base == "ER" and st == "0":
                out.append("ɚ")
            elif base == "IY" and st == "0" and i == len(ph) - 1:
                out.append("i")  # happy 的结尾 /i/
            else:
                out.append(V[base])
        else:
            out.append(C[base])
    return "".join(out)


def word_ipa(w):
    key = w.lower()
    key = SPELL.get(key, key)
    if key in MANUAL:
        return MANUAL[key]
    if key in D:
        return arpa_to_ipa(D[key][VARIANT.get(key, 0)])
    return None


def phrase_ipa(text):
    parts = []
    for tok in re.split(r"[\s\-]+", text.strip()):
        if not tok:
            continue
        ipa = word_ipa(tok)
        if ipa is None and tok.lower().rstrip("'s") in D:
            ipa = word_ipa(tok.lower().rstrip("'s")) + "z"
        if ipa is None:
            return None
        parts.append(ipa)
    return " ".join(parts)


def collect():
    words = {}
    src = open(os.path.join(ROOT, "src/words/data/starter.ts"), encoding="utf-8").read()
    for line in re.search(r"STARTER_DICT = `(.*?)`", src, re.S).group(1).strip().splitlines():
        words.setdefault(line.split("|")[0], set()).add("starter")
    for f in ("pep34.ts", "pep56.ts"):
        s = open(os.path.join(ROOT, "src/words/data", f), encoding="utf-8").read()
        for unit_id, body in re.findall(r"id: '([^']+)'.*?lines: `(.*?)`", s, re.S):
            for line in body.strip().splitlines():
                words.setdefault(line.split("|")[0], set()).add(unit_id)
    return words


def main():
    words = collect()
    out, missing = {}, []
    if "--variants" in sys.argv:  # 列出有多个读音的词，人工确认用哪个
        for w in sorted(words):
            for tok in re.split(r"[\s\-]+", w):
                k = SPELL.get(tok.lower(), tok.lower())
                if k in D and len(D[k]) > 1 and k not in MANUAL:
                    print(k, "→", [arpa_to_ipa(x) for x in D[k]], "用", VARIANT.get(k, 0))
        return
    for w, units in sorted(words.items()):
        ipa = phrase_ipa(w)
        if ipa is None:
            missing.append(w)
            continue
        out[w] = ipa
        for u in units:
            if (u, w) in UNIT_OVERRIDE:
                out[f"{u}:{w}"] = UNIT_OVERRIDE[(u, w)]
    if missing:
        print("词典里查不到：", missing, file=sys.stderr)
        sys.exit(1)
    lines = ["// 自动生成：tools/words/phonetics.py（CMU 发音词典，美式发音），请勿手改。",
             "// 键为单词；“单元id:单词”表示该单元里读音不同（如过去式 read）。",
             "export const IPA: Record<string, string> = " + json.dumps(out, ensure_ascii=False, indent=1, sort_keys=True) + ";"]
    open(os.path.join(ROOT, "src/words/data/ipa.gen.ts"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(f"已注音 {len(out)} 条")


if __name__ == "__main__":
    main()
