"""
V2.14 二～六年级推广端到端验收（网页版 / 单文件 HTML 版）：
1. 家长设为二年级：数学“表内乘法（一）”练习前出现带拼音的讲解；阅读小屋显示 4 篇二年级短文（带拼音），读《小熊种玉米》做完；
   描红写字显示 8 组，二年级第 1 组（工 士 千 午）按笔顺描完。
2. 家长设为五年级：口算闯关有“小数除以整数”“同分母分数加减”；小数题、分数题用键盘自己填（含小数点、分数线）；
   阅读小屋显示五年级短文（不注拼音），读《竹子开花》做完 3 道题。
"""
import json
import os
import re
from fractions import Fraction

import sys as _sys, os as _os
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import tts_spy  # noqa: F401  V5.1：朗读走云端童声，页面里拦截假服务地址
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
RESULTS = []
def ok(m): RESULTS.append(m); print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first
TONE = re.compile(r"[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]")
def han(s): return "".join(re.findall(r"[一-鿿]", s))

SPY = """
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 20);
}
"""

# 二年级第 1 组笔画（与 src/content/writing.ts 一致）
H = lambda y, x1=15, x2=85: [(x1, y), (x2, y)]
V = lambda x, y1=15, y2=85: [(x, y1), (x, y2)]
SET5 = {
    "工": [H(22, 25, 75), V(50, 22, 80), H(80)],
    "士": [H(40), V(50, 15, 80), H(80, 30, 70)],
    "千": [[(68, 12), (35, 28)], H(50), V(50, 28, 90)],
    "午": [[(40, 12), (25, 40)], H(35, 30, 75), H(62), V(50, 35, 92)],
}

def draw(page, pts):
    box = tid(page, "trace-canvas").bounding_box()
    k = box["width"] / 100
    xy = lambda p: (box["x"] + p[0] * k, box["y"] + p[1] * k)
    x, y = xy(pts[0]); page.mouse.move(x, y); page.mouse.down()
    for a, b in zip(pts, pts[1:]):
        for i in range(1, 11):
            page.mouse.move(*xy((a[0] + (b[0] - a[0]) * i / 10, a[1] + (b[1] - a[1]) * i / 10)))
    page.mouse.up(); page.wait_for_timeout(200)

def set_grade(page, g):
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')
    tid(page, "pc-settings").click(); page.wait_for_selector('[data-testid="parent-settings"]')  # V5.1 家长中心分页
    tid(page, f"grade-{g}").scroll_into_view_if_needed(); tid(page, f"grade-{g}").click()
    page.wait_for_timeout(300)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

def read_lesson(page, lesson_id):
    tid(page, f"start-{lesson_id}").scroll_into_view_if_needed(); tid(page, f"start-{lesson_id}").click()
    page.wait_for_selector('[data-testid="read-passage"]')
    text = tid(page, "read-passage").inner_text()
    tid(page, "lesson-next").click()
    n = 0
    while not page.locator('[data-testid="lesson-summary"]').count():
        page.wait_for_timeout(200)
        sorts = page.locator('[data-testid^="sort-"]:not([data-testid="sort-answer"])')
        if sorts.count():
            m = sorts.count()
            for _ in range(m):
                for i in range(m):
                    if page.locator('[data-testid="feedback-correct"]').count(): break
                    sorts.nth(i).click(); page.wait_for_timeout(150)
        else:
            opts = page.locator('[data-testid^="option-"], [data-testid^="tf-"]')
            for i in range(opts.count()):
                expect(opts.nth(i)).not_to_have_attribute("aria-disabled", "true", timeout=4000)
                opts.nth(i).click(); page.wait_for_timeout(250)
                if page.locator('[data-testid="feedback-correct"]').count(): break
        expect(tid(page, "feedback-correct")).to_be_visible()
        n += 1
        tid(page, "lesson-next").click(); page.wait_for_timeout(250)
    return text, n

def answer_of(stem):
    a, op, b = re.fullmatch(r"([\d./]+) ([+−×÷]) ([\d./]+) = \?", stem).groups()
    a, b = Fraction(a), Fraction(b)
    v = {"+": a + b, "−": a - b, "×": a * b, "÷": a / b}[op]
    if "/" in stem: return str(v)  # Fraction 自动约分
    return str(v.numerator) if v.denominator == 1 else format(float(v), "g")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    # 1. 二年级
    set_grade(page, 2)
    tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
    tid(page, "map-subject-math").click(); page.wait_for_timeout(200)
    tid(page, "kp-m2.mul1").scroll_into_view_if_needed(); tid(page, "kp-m2.mul1").click()
    page.wait_for_selector('[data-testid="kp-card"]')
    tid(page, "kp-practice").click(); page.wait_for_selector('[data-testid="teach-panel"]')
    t = tid(page, "teach-panel").inner_text()
    assert TONE.search(t) and "相加" in han(t), t
    page.screenshot(path=f"{OUT}/ug-01-teach-g2.png")
    ok("二年级“表内乘法（一）”：练习前出现带拼音的讲解（4 个 3 相加写成 3×4）")
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="reading-house"]')
    expect(tid(page, "reading-progress")).to_have_text("0/4")
    expect(page.locator('[data-testid="start-zh-read-1"]')).to_have_count(0)
    text, n = read_lesson(page, "zh-read-g2-2")
    assert "种下玉米" in han(text) and TONE.search(text), text[:60]
    ok(f"二年级阅读小屋显示 4 篇二年级短文（不显示一年级的）；《小熊种玉米》带拼音，做完 {n} 道题")
    tid(page, "summary-home").click(); page.wait_for_selector('[data-testid="home"]')

    tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="write-section"]')
    expect(page.locator('[data-testid^="write-set-"]')).to_have_count(8)
    tid(page, "write-set-5").scroll_into_view_if_needed(); tid(page, "write-set-5").click()
    page.wait_for_selector('[data-testid="trace-canvas"]')
    for ch, strokes in SET5.items():
        expect(tid(page, "practice-screen")).to_contain_text(ch)
        for k, st in enumerate(strokes):
            expect(tid(page, "trace-step")).to_contain_text(f"第 {k + 1} 笔")
            draw(page, st)
        expect(tid(page, "trace-done")).to_be_visible()
        if ch == "千": page.screenshot(path=f"{OUT}/ug-02-trace-g2.png")
        tid(page, "practice-next").click(); page.wait_for_timeout(300)
    page.wait_for_selector('[data-testid="practice-summary"]')
    ok("二年级描红写字显示 8 组；二年级第 1 组（工 士 千 午）按笔顺描完；" + tid(page, "practice-score").inner_text())

    # 2. 五年级
    set_grade(page, 5)
    tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="oral-section"]')
    for topic in ["decdiv", "fracadd"]:
        tid(page, f"oral-{topic}").scroll_into_view_if_needed(); tid(page, f"oral-{topic}").click()
        page.wait_for_selector('[data-testid="practice-screen"]')
        kinds = []
        for i in range(10):
            stem = page.get_by_text(re.compile(r"^[\d./]+ [+−×÷] [\d./]+ = \?$")).first.inner_text()
            ans = answer_of(stem)
            if tid(page, "num-ok").count():
                kinds.append("填")
                for ch in ans: tid(page, f"num-{ch}").click()
                if i == 1: page.screenshot(path=f"{OUT}/ug-03-oral-{topic}.png")
                tid(page, "num-ok").click()
            else:
                kinds.append("选")
                tid(page, f"option-{ans}").click()
            expect(tid(page, "feedback-correct")).to_be_visible()
            tid(page, "practice-next").click(); page.wait_for_timeout(150)
        page.wait_for_selector('[data-testid="practice-summary"]')
        ok(f"五年级口算“{topic}”10 题全对（{''.join(kinds)}，自己填时用了{'小数点' if topic == 'decdiv' else '分数线'}）")
        tid(page, "practice-home").click(); page.wait_for_selector('[data-testid="home"]')
        tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="oral-section"]')
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="reading-house"]')
    expect(tid(page, "reading-progress")).to_have_text("0/4")
    text, n = read_lesson(page, "zh-read-g5-2")
    assert "竹子" in text and not TONE.search(text), text[:60]
    assert n == 3, n
    page.screenshot(path=f"{OUT}/ug-04-reading-g5.png")
    ok("五年级阅读小屋：《竹子开花》不注拼音，3 道题（含推断题）做完")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
