"""
V2.2 一～六年级知识图谱端到端验收（网页版 / 单文件 HTML 版）：

1. 家长把年级设为四年级 → 知识小地图默认显示四年级数学；可以切换学科（数学/语文/英语）和年级（1～6）；
   一、二年级英语给出说明（PEP 三年级起点）。
2. 四年级“除数是两位数的除法”练一练（原创题，答案由测试按题目独立计算），多数故意答错 → 出现“找找原因”。
3. 找原因：模拟孩子三年级“除数是一位数的除法”没学好、其它都会 → 结论回溯到三年级（跨年级根因）。
4. 语文、英语知识点的“练一练”从对应的题库单元出题（答案从题库数据文件中查），记录进入掌握度。
5. 家长中心：按学科切换，看到四年级的知识点数、推荐、找原因结论。
6. 重新打开后状态仍在。
"""
import json
import os
import re

from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RESULTS = []
def ok(m): RESULTS.append(m); print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first

SPY = """
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 30);
}
"""

_books = {}
def bank_answer(unit_id, qid):
    # 旧版单元 -u3；一年级新版单元 -n3 的题来自同册（数学下册笔算来自二上）的旧版单元
    book = re.sub(r"-[un]\d+$", "", unit_id)
    books = [book] + (["math-g2a"] if book == "math-g1b" else [])
    for b in books:
        if b not in _books:
            _books[b] = json.load(open(os.path.join(ROOT, "src/content/bank", f"{b}.json"), encoding="utf-8"))
        for u in _books[b]["units"]:
            if u["id"] == unit_id or "-n" in unit_id:
                for q in u["questions"]:
                    if q["id"] == qid: return q
    raise KeyError(qid)

def calc_answer(kp, sig):
    """由题目签名独立计算答案（只覆盖本测试用到的计算类知识点）"""
    m = re.match(r"^(\d+)([×÷])(\d+)$", sig)
    if m:
        a, b = int(m[1]), int(m[3]); return str(a * b if m[2] == "×" else a // b)
    if kp == "m2.remainder":
        a, d = map(int, sig.split(":")); return f"{a // d}……{a % d}"
    raise ValueError(kp + " " + sig)

def solve(page, ex_id, correct):
    _, kp, sig = ex_id.split(":", 2)
    if sig.startswith("b:"):
        _, unit, qid = sig.split(":")
        q = bank_answer(unit, qid)
        if q["t"] == "tf":
            want = "tf-true" if q["a"] else "tf-false"
            if not correct: tid(page, "tf-false" if q["a"] else "tf-true").click(); expect(tid(page, "feedback-wrong")).to_be_visible()
            tid(page, want).click()
        elif q["t"] == "order":
            # 排序题：按数据给出的顺序依次点（先故意点错一个）
            order = [str(x) for x in q["a"]]
            if not correct and len(order) > 1:
                tid(page, f"sort-{order[1]}").click(); expect(tid(page, "feedback-wrong")).to_be_visible()
            for idx in order: tid(page, f"sort-{idx}").click(); page.wait_for_timeout(60)
        else:
            ans = str(q["a"])
            if not correct:
                wrong = next(e.get_attribute("data-testid")[7:] for e in page.locator('[data-testid^="option-"]').all() if e.get_attribute("data-testid")[7:] != ans)
                tid(page, f"option-{wrong}").click(); expect(tid(page, "feedback-wrong")).to_be_visible()
            tid(page, f"option-{ans}").click()
    elif sig.endswith(":in"):
        ans = calc_answer(kp, sig[:-3])
        if not correct:
            type_in(page, "9999"); expect(tid(page, "feedback-wrong")).to_be_visible()
        type_in(page, ans)
    else:
        ans = calc_answer(kp, sig)
        if not correct:
            wrong = next(e.get_attribute("data-testid")[7:] for e in page.locator('[data-testid^="option-"]').all() if e.get_attribute("data-testid")[7:] != ans)
            tid(page, f"option-{wrong}").click(); expect(tid(page, "feedback-wrong")).to_be_visible()
        tid(page, f"option-{ans}").click()
    expect(tid(page, "feedback-correct")).to_be_visible()

def type_in(page, s):
    """自己填数题：按数字键输入，再点“确定”"""
    for ch in str(s).replace("……", "余"): tid(page, f"num-{ch}").click()
    tid(page, "num-ok").click()

def current_id(page, prefix):
    return page.locator(f'[data-testid^="{prefix}"]').last.get_attribute("data-testid")[len(prefix):]

def practice_round(page, correct_of):
    seen = []
    for i in range(20):
        page.wait_for_selector('[data-testid^="practice-exercise-"], [data-testid="practice-summary"]')
        page.wait_for_timeout(150)
        if page.locator('[data-testid="practice-summary"]').count(): break
        ex_id = current_id(page, "practice-exercise-")
        solve(page, ex_id, correct_of(i))
        seen.append(ex_id)
        tid(page, "practice-next").click()
    page.wait_for_selector('[data-testid="practice-summary"]')
    return seen

def parent(page):
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="knowledge-card"]')

TONE = re.compile(r"[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]")
SEEN_TEACH = {}

def teach_then_skip(page, key):
    """V2.13：第一次练某个知识点先出现讲解；记录讲解内容，再点“我会了，直接练习”"""
    page.wait_for_selector('[data-testid="teach-panel"]')
    SEEN_TEACH[key] = tid(page, "teach-panel").inner_text()
    page.locator('[data-testid="teach-skip"]').first.click()
    page.wait_for_selector('[data-testid="teach-panel"]', state="detached")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    # 1. 家长设置四年级
    parent(page)
    tid(page, "grade-4").scroll_into_view_if_needed(); tid(page, "grade-4").click()
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
    expect(tid(page, "map-learned")).to_contain_text("四年级数学：学会了 0 /")
    page.screenshot(path=f"{OUT}/c-01-map-g4-math.png")
    totals = {}
    for subj, name in [("math", "数学"), ("chinese", "语文"), ("english", "英语")]:
        tid(page, f"map-subject-{subj}").click()
        txt = tid(page, "map-learned").inner_text()
        assert f"四年级{name}" in txt, txt
        totals[name] = int(re.search(r"/ (\d+)", txt)[1])
    page.screenshot(path=f"{OUT}/c-02-map-g4-english.png")
    ok("知识小地图默认四年级，学科切换：" + "、".join(f"{k} {v} 个本领" for k, v in totals.items()))
    for _ in range(3): tid(page, "map-grade-prev").click()
    expect(tid(page, "map-empty")).to_be_visible()
    tid(page, "map-subject-chinese").click()
    expect(tid(page, "map-learned")).to_contain_text("一年级语文")
    expect(tid(page, "kp-c1.a3")).to_be_visible()
    counts = []
    for g in range(1, 7):
        for subj, name in [("math", "数学"), ("chinese", "语文"), ("english", "英语")]:
            tid(page, f"map-subject-{subj}").click()
            counts.append(f"{g}年级{name}{re.search(r'/ (\d+)', tid(page, 'map-learned').inner_text())[1]}")
        if g < 6: tid(page, "map-grade-next").click()
    expect(tid(page, "map-learned")).to_contain_text("六年级英语")
    page.screenshot(path=f"{OUT}/c-03-map-g6-english.png")
    ok("年级切换 1～6：" + " ".join(counts) + "；一年级英语显示“PEP 三年级起点”说明")

    # 2. 四年级数学：除数是两位数的除法，多数答错
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
    tid(page, "kp-m4.div2d").scroll_into_view_if_needed(); tid(page, "kp-m4.div2d").click()
    page.wait_for_selector('[data-testid="kp-card"]')
    tid(page, "kp-practice").click(); page.wait_for_selector('[data-testid="practice-screen"]')
    teach_then_skip(page, "m4.div2d")
    assert "试商" in SEEN_TEACH["m4.div2d"] and not TONE.search(SEEN_TEACH["m4.div2d"]), SEEN_TEACH["m4.div2d"]
    ok("四年级“除数是两位数的除法”：练习前先出现讲解（试商方法），三年级起不注拼音，可以跳过")
    seen = practice_round(page, lambda i: i % 4 == 0)
    assert all(s.startswith("kp:m4.div2d:") and "÷" in s for s in seen), seen[:3]
    page.screenshot(path=f"{OUT}/c-04-practice-summary.png")
    ok(f"四年级“除数是两位数的除法”练一练 {len(seen)} 题（原创题，答案独立计算）：" + tid(page, "practice-score").inner_text())
    tid(page, "practice-home").click(); page.wait_for_selector('[data-testid="home"]')

    # 3. 找原因：三年级“除数是一位数的除法”不会，其余都会
    tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
    expect(tid(page, "todo-m4.div2d")).to_be_visible()
    tid(page, "todo-m4.div2d").click(); page.wait_for_selector('[data-testid="kp-card"]')
    tid(page, "kp-diagnose").click(); page.wait_for_selector('[data-testid="diagnose-intro"]')
    tid(page, "diagnose-start").click()
    asked = []
    for _ in range(20):
        page.wait_for_selector('[data-testid^="diag-exercise-"], [data-testid="diagnose-summary"]')
        page.wait_for_timeout(150)
        if page.locator('[data-testid="diagnose-summary"]').count(): break
        ex_id = current_id(page, "diag-exercise-"); kp = ex_id.split(":")[1]; asked.append(kp)
        if len(asked) == 3: page.screenshot(path=f"{OUT}/c-05-diagnose.png")
        solve(page, ex_id, correct=kp not in ("m4.div2d", "m3.div1d"))
        tid(page, "diagnose-next").click()
    page.wait_for_selector('[data-testid="diagnose-summary"]')
    root = tid(page, "diagnose-root").inner_text().replace("\n", " ")
    assert "除数是一位数" in root, root
    page.screenshot(path=f"{OUT}/c-06-diagnose-result.png")
    ok(f"找原因（跨年级）：依次检查 {' → '.join(dict.fromkeys(asked))}；找到三年级根因：{root[:40]}")
    tid(page, "diagnose-back").click()
    page.wait_for_selector('[data-testid="map-screen"]')

    # 4. 语文、英语：题库出题
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    for subj, kp in [("chinese", "c4.a2"), ("english", "e4.b2")]:
        tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
        tid(page, f"map-subject-{subj}").click()
        tid(page, f"kp-{kp}").scroll_into_view_if_needed(); tid(page, f"kp-{kp}").click()
        page.wait_for_selector('[data-testid="kp-card"]')
        expect(tid(page, "kp-card")).to_contain_text("题库")
        tid(page, "kp-practice").click(); page.wait_for_selector('[data-testid="practice-screen"]')
        teach_then_skip(page, kp)
        page.screenshot(path=f"{OUT}/c-07-{subj}-practice.png")
        seen = practice_round(page, lambda i: True)
        assert all(s.startswith(f"kp:{kp}:b:") for s in seen), seen[:2]
        unit = seen[0].split(":")[3]
        ok(f"{'语文' if subj == 'chinese' else '英语'}“{kp}”练一练：{len(seen)} 题全部来自题库单元 {unit}，" + tid(page, "practice-score").inner_text())
        tid(page, "practice-home").click(); page.wait_for_selector('[data-testid="home"]')
        tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
        tid(page, f"map-subject-{subj}").click()
        state_txt = tid(page, f"kp-{kp}").inner_text()
        assert "⚪" not in state_txt, state_txt
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    assert "提问" in SEEN_TEACH["c4.a2"], SEEN_TEACH["c4.a2"]
    assert "What time is it?" in SEEN_TEACH["e4.b2"], SEEN_TEACH["e4.b2"]
    ok("语文、英语知识点做题后小地图状态从“还没学”变化；练习前分别出现语文“学习方法”（提问策略）和英语“重点句型”讲解")

    # 5. 家长中心
    parent(page)
    card = tid(page, "knowledge-card"); card.scroll_into_view_if_needed()
    expect(card).to_contain_text("四年级数学")
    expect(tid(page, "diag-row")).to_contain_text("除数是一位数")
    recs = " / ".join(x.replace("\n", " ") for x in page.locator('[data-testid="kp-rec"]').all_inner_texts())
    card.screenshot(path=f"{OUT}/c-08-parent-math.png")
    ok("家长中心·四年级数学：" + tid(page, "pk-total").inner_text()[:20] + "；推荐：" + recs[:160])
    for subj, name in [("chinese", "语文"), ("english", "英语")]:
        tid(page, f"pk-subject-{subj}").click()
        expect(card).to_contain_text(f"四年级{name}")
        r2 = " / ".join(x.replace("\n", " ") for x in page.locator('[data-testid="kp-rec"]').all_inner_texts())
        ok(f"家长中心·四年级{name}：" + tid(page, "pk-total").inner_text()[:20] + "；推荐：" + r2[:120])
    card.screenshot(path=f"{OUT}/c-09-parent-english.png")

    # 6. 重新打开
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
    expect(tid(page, "map-learned")).to_contain_text("四年级数学")
    expect(tid(page, "todo-m3.div1d")).to_be_visible()
    ok("重新打开后：仍是四年级，“今天要复习的本领”里有三年级的“除数是一位数的除法”")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
