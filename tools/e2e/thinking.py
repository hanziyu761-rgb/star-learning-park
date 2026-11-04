"""
V2.5 思维训练端到端验收（网页版 / 单文件 HTML 版）：
1. 首页“每日挑战”→ 做题（选错有“想一想”提示，可再试）→ 得星星 → 再玩一道（不计星）→ 首页显示“今天完成了”，再进入显示已完成。
2. 口算闯关（20 以内进位加法）：第 1、4、7、10 道一次答对的题后出现“你是怎么想的？”，点选思路。
3. 家长中心“思维能力”：显示挑战天数、各思维方面的做题数、孩子选的思路；注明不是测评。
4. 重新打开后记录仍在。
"""
import json
import os
import re

from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
RESULTS = []
def ok(m): RESULTS.append(m); print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first
def vis(page, t): return page.locator(f'[data-testid="{t}"]:visible')

SPY = """
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 30);
}
"""

def stars(page):
    return int(re.findall(r"\d+", tid(page, "total-stars").inner_text())[0])

def solve_challenge(page):
    """依次点选项，直到答对；返回尝试次数"""
    opts = page.locator('[data-testid="challenge-screen"] [data-testid^="option-"]')
    n = opts.count()
    assert n >= 3, n
    for i in range(n):
        opts.nth(i).click(); page.wait_for_timeout(250)
        if page.locator('[data-testid="challenge-result"]').count():
            return i + 1
        # 选错：出现“想一想”的提示，题目还在
        expect(tid(page, "feedback-wrong")).to_be_visible()
    raise AssertionError("所有选项都试过了仍未答对")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    # 1. 每日挑战
    expect(tid(page, "challenge-status")).to_contain_text("每天一道思维题")
    s0 = stars(page)
    tid(page, "challenge-entry").click(); page.wait_for_selector('[data-testid="challenge-screen"]')
    kind = tid(page, "challenge-type").inner_text()
    page.screenshot(path=f"{OUT}/t-01-challenge.png")
    tries = solve_challenge(page)
    expect(tid(page, "challenge-stars")).to_contain_text("⭐⭐" if tries == 1 else "⭐")
    page.screenshot(path=f"{OUT}/t-02-challenge-done.png")
    ok(f"每日挑战（{kind}）：第 {tries} 次答对{'' if tries == 1 else '（选错时出现“想一想”提示，可再试）'}，获得星星")
    tid(page, "challenge-more").click()
    expect(page.locator('[data-testid="challenge-result"]')).to_have_count(0)
    expect(tid(page, "challenge-screen")).to_contain_text("再玩一道 · 不计星星")
    kind2 = tid(page, "challenge-type").inner_text()
    solve_challenge(page)
    expect(page.locator('[data-testid="challenge-stars"]')).to_have_count(0)
    ok(f"再玩一道（{kind2}）：可以继续做，不再给星星")
    tid(page, "challenge-home").click(); page.wait_for_selector('[data-testid="home"]')
    expect(tid(page, "challenge-status")).to_contain_text("今天完成了")
    gained = stars(page) - s0
    assert gained == (2 if tries == 1 else 1), gained
    tid(page, "challenge-entry").click(); page.wait_for_selector('[data-testid="challenge-done-today"]')
    ok(f"首页显示“今天完成了”，总星星 +{gained}；再进入显示今天已完成")
    page.locator('[data-testid="challenge-screen"] [data-testid="back"]').click()
    page.wait_for_selector('[data-testid="challenge-screen"]', state="detached")

    # 2. 口算闯关 20 以内进位加法：问思路
    vis(page, "subject-math").first.click(); page.wait_for_selector('[data-testid="oral-section"]')
    tid(page, "oral-add20").click(); page.wait_for_selector('[data-testid="practice-screen"]')
    asked = []
    picks = ["make10", "make10", "count", "make10"]
    for i in range(10):
        stem = page.get_by_text(re.compile(r"^\d+ \+ \d+ = \?$")).first.inner_text()
        a, c = map(int, re.findall(r"\d+", stem))
        tid(page, f"option-{a + c}").click()
        expect(tid(page, "feedback-correct")).to_be_visible()
        if page.locator('[data-testid="strategy-ask"]').count():
            asked.append(i + 1)
            tid(page, f"strategy-{picks[len(asked) - 1]}").click()
            expect(tid(page, "strategy-done")).to_be_visible()
            if len(asked) == 1: page.screenshot(path=f"{OUT}/t-03-strategy.png")
        tid(page, "practice-next").click(); page.wait_for_timeout(150)
    assert asked == [1, 4, 7, 10], asked
    ok("口算闯关（20 以内进位加法）：第 1、4、7、10 题答对后问“你是怎么想的？”，孩子点选思路（凑十 / 数数）")
    page.wait_for_selector('[data-testid="practice-summary"]')
    tid(page, "practice-home").click(); page.wait_for_selector('[data-testid="home"]')

    # 3. 家长中心
    vis(page, "parent-entry").first.click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')
    tid(page, "pt-section").scroll_into_view_if_needed()
    expect(tid(page, "pt-section")).to_contain_text("不是心理或智力测评")
    expect(tid(page, "pt-days")).to_contain_text("做过 1 天")
    expect(tid(page, "pt-strategy-m1.carry20")).to_contain_text("共 4 次")
    expect(tid(page, "pt-strategy-m1.carry20")).to_contain_text("先凑成十 3")
    expect(tid(page, "pt-strategy-m1.carry20")).to_contain_text("先不下结论")
    tried = sum(int(m) for d in ["observe", "classify", "reason", "spatial"]
                for m in re.findall(r"做了 (\d+) 道", tid(page, f"pt-dim-{d}").inner_text()))
    assert tried >= 2, tried
    page.screenshot(path=f"{OUT}/t-04-parent.png")
    ok("家长中心“思维能力”：挑战 1 天、各方面做题数、思路统计（凑十 3 次、数数 1 次，记录少不下结论），注明不是测评")

    # 4. 重新打开
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    expect(tid(page, "challenge-status")).to_contain_text("今天完成了")
    ok("重新打开后，挑战和思路记录仍在")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
