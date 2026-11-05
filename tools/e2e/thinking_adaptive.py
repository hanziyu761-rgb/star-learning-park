"""
V2.11 思维训练端到端验收（网页版 / 单文件 HTML 版）：
1. 一年级数学挑战连着玩，出现“一题多解”（多选）和“小侦探找错”：
   - 一题多解：先故意多选一个错的 → 错的被去掉；再漏选 → 提示“还有别的答案”；全部选对通过。
   - 小侦探找错：程序验算 4 道算式，点算错的那一道，一次答对。
2. 难度跟着孩子走：模拟这个孩子最近 5 道数学挑战答对 4 道以上（写入学习记录），再进每日挑战 → 显示“二年级难度 ⬆”；
   家长中心显示三科当前难度；家长关掉开关后回到“一年级难度”。
"""
import json
import os
import re
from fractions import Fraction

from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
RESULTS = []
def ok(m): RESULTS.append(m); print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first

SPY = """
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 20);
}
"""

def val(expr):
    expr = expr.strip()
    m = re.fullmatch(r"(\d+)/(\d+)", expr)
    if m: return Fraction(int(m[1]), int(m[2]))
    a, op, b = re.fullmatch(r"(\d+)([+\-×÷])(\d+)", expr).groups()
    a, b = int(a), int(b)
    return Fraction({"+": a + b, "-": a - b, "×": a * b, "÷": Fraction(a, b)}[op])

def clean(t): return re.sub(r"\s+", "", t).replace("✓", "").replace("✗", "").replace("●", "").replace("○", "")

def multi_items(page):
    loc = page.locator('[data-testid^="multi-"]:not([data-testid="multi-ok"]):not([data-testid="multi-badge"])')
    return [(loc.nth(i), clean(loc.nth(i).inner_text())) for i in range(loc.count())]

def generic_solve(page):
    sorts = page.locator('[data-testid="challenge-screen"] [data-testid^="sort-"]:not([data-testid="sort-answer"])')
    if sorts.count():
        n = sorts.count()
        for _ in range(n):
            for i in range(n):
                if page.locator('[data-testid="challenge-result"]').count(): break
                sorts.nth(i).click(); page.wait_for_timeout(120)
    else:
        opts = page.locator('[data-testid="challenge-screen"] [data-testid^="option-"]')
        for i in range(opts.count()):
            expect(opts.nth(i)).not_to_have_attribute("aria-disabled", "true", timeout=4000)
            opts.nth(i).click(); page.wait_for_timeout(150)
            if page.locator('[data-testid="challenge-result"]').count(): break
    expect(tid(page, "challenge-result")).to_be_visible()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    # 1. 一年级数学：连着玩到两种新题型
    tid(page, "challenge-entry").click(); page.wait_for_selector('[data-testid="challenge-screen"]')
    tid(page, "challenge-subject-math").click(); page.wait_for_timeout(200)
    expect(tid(page, "challenge-level")).to_contain_text("一年级难度")
    done = set(); seen = []
    for _ in range(12):
        kind = tid(page, "challenge-type").inner_text(); seen.append(kind)
        if kind == "一题多解" and kind not in done:
            prompt = clean(re.sub(r"[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]", "", page.locator('[data-testid="challenge-screen"]').inner_text()))
            target = Fraction(int(re.search(r"得数是(\d+)", prompt)[1]))
            items = multi_items(page)
            good = [(el, t) for el, t in items if val(t) == target]
            bad = [(el, t) for el, t in items if val(t) != target]
            assert len(good) >= 2 and len(bad) >= 2, items
            expect(tid(page, "multi-badge")).to_be_visible()
            page.screenshot(path=f"{OUT}/ta-01-multi.png")
            # 多选一个错的
            good[0][0].click(); bad[0][0].click(); tid(page, "multi-ok").click()
            expect(tid(page, "feedback-wrong")).to_be_visible()
            expect(bad[0][0]).to_have_attribute("aria-disabled", "true")
            expect(good[0][0]).to_have_attribute("aria-checked", "true")
            # 漏选
            tid(page, "multi-ok").click()
            fb = "".join(re.findall(r"[一-鿿]", tid(page, "feedback-wrong").inner_text()))
            assert "还有别的答案" in fb, fb
            for el, _t in good[1:]: el.click()
            tid(page, "multi-ok").click()
            expect(tid(page, "challenge-result")).to_be_visible()
            page.screenshot(path=f"{OUT}/ta-02-multi-done.png")
            ok(f"一题多解（得数是 {target}）：正确的 {'、'.join(t for _, t in good)}；多选错的被去掉，漏选提示“还有别的答案”，全部选对通过")
            done.add(kind)
        elif kind == "小侦探找错" and kind not in done:
            opts = page.locator('[data-testid="challenge-screen"] [data-testid^="option-"]')
            texts = [clean(opts.nth(i).inner_text()) for i in range(opts.count())]
            wrong = [i for i, t in enumerate(texts) if val(t.split("=")[0]) != int(t.split("=")[1])]
            assert len(wrong) == 1, texts
            page.screenshot(path=f"{OUT}/ta-03-detective.png")
            opts.nth(wrong[0]).click()
            expect(tid(page, "challenge-result")).to_be_visible()
            assert "一次就想出来了" in "".join(re.findall(r"[\u4e00-\u9fff]", tid(page, "challenge-result").inner_text()))
            ok(f"小侦探找错：{' / '.join(texts)}，程序验算后点出算错的 {texts[wrong[0]]}，一次答对")
            done.add(kind)
        else:
            generic_solve(page)
        if len(done) == 2: break
        tid(page, "challenge-more").click(); page.wait_for_timeout(200)
    assert len(done) == 2, seen
    page.locator('[data-testid="challenge-screen"] [data-testid="back"]').click()
    page.wait_for_selector('[data-testid="challenge-screen"]', state="detached")

    # 2. 难度跟着孩子走：写入“最近 5 道数学挑战都一次答对”的记录
    page.evaluate("""() => {
      const s = JSON.parse(localStorage.getItem('slp.progress.v1'));
      const now = Date.now();
      for (let i = 0; i < 5; i++) s.challenges.push({ at: now + i, day: '2026-11-01', id: 'ch:seq:add:2:3:1', type: 'seq',
        dims: ['observe'], firstTryCorrect: true, attempts: 1, daily: false, subject: 'math', level: 1 });
      localStorage.setItem('slp.progress.v1', JSON.stringify(s));
    }""")
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "challenge-entry").click(); page.wait_for_selector('[data-testid="challenge-screen"]')
    tid(page, "challenge-subject-math").click(); page.wait_for_timeout(200)
    if page.locator('[data-testid="challenge-done-today"]').count():
        tid(page, "challenge-more").click(); page.wait_for_timeout(200)
    expect(tid(page, "challenge-level")).to_contain_text("二年级难度")
    expect(tid(page, "challenge-level")).to_contain_text("难一点")
    page.screenshot(path=f"{OUT}/ta-04-level-up.png")
    ok("最近 5 道数学挑战都一次答对 → 再出题显示“二年级难度 ⬆ 最近答得好，难一点”")
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')
    tid(page, "pt-levels").scroll_into_view_if_needed()
    expect(tid(page, "pt-levels")).to_contain_text("数学：二年级难度（难一档）")
    expect(tid(page, "pt-levels")).to_contain_text("语文：一年级难度")
    page.screenshot(path=f"{OUT}/ta-05-parent.png")
    tid(page, "pt-adaptive-switch").click(); page.wait_for_timeout(200)
    expect(tid(page, "pt-levels")).to_contain_text("已关闭")
    ok("家长中心显示三科当前难度（数学难一档）；关掉“难度跟着孩子调整”后显示按年级出题")
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "challenge-entry").click(); page.wait_for_selector('[data-testid="challenge-screen"]')
    tid(page, "challenge-subject-math").click(); page.wait_for_timeout(200)
    if page.locator('[data-testid="challenge-done-today"]').count():
        tid(page, "challenge-more").click(); page.wait_for_timeout(200)
    expect(tid(page, "challenge-level")).to_have_text("一年级难度")
    ok("关掉后再进每日挑战：回到“一年级难度”，设置重新打开后仍保存")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
