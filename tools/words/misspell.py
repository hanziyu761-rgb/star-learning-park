"""
生成三～六年级单词卡的错拼写（V5.2.5），供“听音选拼写”“例句填空”出题用。
用法：python tools/words/misspell.py （需要 pip install cmudict）
错拼写由程序造（交换相邻字母、少一个字母、双写一个辅音、换一个元音），
再用 CMU 发音词典（约 13 万个英语单词）排除真实存在的单词，免得干扰项“也是个词”。
输出 src/words/data/misspell.gen.ts（生成文件，不手改）。
"""
import hashlib
import json
import os
import re

import cmudict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REAL = set(cmudict.dict().keys())
VOWELS = "aeiou"


def words():
    out = []
    for f in ("pep34.ts", "pep56.ts"):
        src = open(os.path.join(ROOT, "src/words/data", f), encoding="utf8").read()
        for line in src.splitlines():
            parts = line.strip().split("|")
            if len(parts) == 4 and re.match(r"^[A-Za-z]", parts[0]):
                out.append(parts[0])
    return sorted(set(out))


def h(s):
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)


def bad(word):
    parts = word.split(" ")
    k = max(range(len(parts)), key=lambda i: (len(parts[i]), -i))
    w = parts[k]
    cands = set()
    for i in range(1, len(w)):
        a, b = w[i - 1], w[i]
        if a.isalpha() and b.isalpha() and a != b and i > 1:
            cands.add(w[: i - 1] + b + a + w[i + 1 :])
        if b.isalpha():
            cands.add(w[:i] + w[i + 1 :])
        if b in "bcdfglmnprst":
            cands.add(w[:i] + b + w[i:])
        if b in VOWELS:
            for v in VOWELS:
                if v != b:
                    cands.add(w[:i] + v + w[i + 1 :])
    known = {x.lower() for x in words_all}
    ok = [c for c in cands if c != w and len(c) >= 2 and c.lower() not in REAL and c.lower() not in known]
    ok.sort(key=lambda c: h(word + "#" + c))
    picked = []
    for c in ok:
        if len(picked) >= 3:
            break
        if sum(1 for p in picked if len(p) == len(c)) < 2:
            picked.append(c)
    for c in ok:
        if len(picked) < 3 and c not in picked:
            picked.append(c)
    return [" ".join(parts[:k] + [c] + parts[k + 1 :]) for c in picked]


words_all = words()
res = {}
for w in words_all:
    if len(re.sub(r"[^A-Za-z]", "", w)) < 3:
        continue
    b = bad(w)
    if len(b) == 3:
        res[w] = b
with open(os.path.join(ROOT, "src/words/data/misspell.gen.ts"), "w", encoding="utf8") as f:
    f.write("/** 自动生成（tools/words/misspell.py）：单词 → 3 个错拼写，已用 CMU 词典排除真实单词。不要手改。 */\n")
    f.write("export const MISSPELL: Record<string, string[]> = " + json.dumps(res, ensure_ascii=False, indent=0) + ";\n")
print(len(words_all), "个单词，生成", len(res))
