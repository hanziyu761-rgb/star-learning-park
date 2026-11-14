"""
V2.5 思维训练端到端验收（网页版 / 单文件 HTML 版）：
1. 首页“每日挑战”→ 数学、语文、英语三科可选（标出今天推荐）→ 语文题得星星 → 英语题不计星（再玩一道）→ 首页显示“今天完成了”。
2. 口算闯关（20 以内进位加法）：第 1、4、7、10 道一次答对的题后出现“你是怎么想的？”，点选思路。
3. 家长中心“思维能力”：显示挑战天数、各思维方面的做题数、孩子选的思路；注明不是测评。
4. 重新打开后记录仍在。
"""
import json
import os
import re

import sys as _sys, os as _os
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import tts_spy  # noqa: F401  V5.1：朗读走云端童声，页面里拦截假服务地址
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
    """选择题：依次点选项直到答对；排序题：反复依次点各项（点错的不会放进去），直到排好。返回是否一次答对"""
    sorts = page.locator('[data-testid="challenge-screen"] [data-testid^="sort-"]:not([data-testid="sort-answer"])')
    if sorts.count():
        n = sorts.count(); wrong = 0
        for _ in range(n):
            for i in range(n):
                if page.locator('[data-testid="challenge-result"]').count(): break
                before = page.locator('[data-testid="feedback-wrong"]').count()
                sorts.nth(i).click(); page.wait_for_timeout(200)
                if page.locator('[data-testid="feedback-wrong"]').count(): wrong += 1
        expect(tid(page, "challenge-result")).to_be_visible()
        return wrong == 0, "排序"
    opts = page.locator('[data-testid="challenge-screen"] [data-testid^="option-"]')
    n = opts.count()
    assert n >= 3, n
    for i in range(n):
        opts.nth(i).click(); page.wait_for_timeout(250)
        if page.locator('[data-testid="challenge-result"]').count():
            return i == 0, "选择"
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

    # 1. 每日挑战：三科
    expect(tid(page, "challenge-status")).to_contain_text("今天推荐")
    s0 = stars(page)
    tid(page, "challenge-entry").click(); page.wait_for_selector('[data-testid="challenge-screen"]')
    expect(tid(page, "challenge-screen")).to_contain_text("今天推荐")
    kinds = {}
    for subj in ["math", "chinese", "english"]:
        tid(page, f"challenge-subject-{subj}").click(); page.wait_for_timeout(200)
        kinds[subj] = tid(page, "challenge-type").inner_text()
        page.screenshot(path=f"{OUT}/t-01-challenge-{subj}.png")
    ok(f"每日挑战有数学、语文、英语三科可选，并标出今天推荐的学科：{kinds}")
    # 语文：今天的第一道，得星星
    tid(page, "challenge-subject-chinese").click(); page.wait_for_timeout(200)
    kind = tid(page, "challenge-type").inner_text()
    first, how = solve_challenge(page)
    expect(tid(page, "challenge-stars")).to_contain_text("⭐⭐" if first else "⭐")
    page.screenshot(path=f"{OUT}/t-02-challenge-done.png")
    ok(f"语文挑战（{kind}，{how}题）：{'一次答对' if first else '选错有“想一想”提示，再试后答对'}，获得星星")
    # 英语：今天已经做过每日挑战，这道是“再玩一道”
    tid(page, "challenge-subject-english").click(); page.wait_for_timeout(200)
    expect(tid(page, "challenge-screen")).to_contain_text("再玩一道 · 不计星星")
    kind2 = tid(page, "challenge-type").inner_text()
    solve_challenge(page)
    expect(page.locator('[data-testid="challenge-stars"]')).to_have_count(0)
    tid(page, "challenge-more").click()
    expect(page.locator('[data-testid="challenge-result"]')).to_have_count(0)
    kind3 = tid(page, "challenge-type").inner_text()
    solve_challenge(page)
    expect(page.locator('[data-testid="challenge-stars"]')).to_have_count(0)
    ok(f"英语挑战（{kind2}、{kind3}）：同一天再做不计星星，可以一直“再玩一道”")
    # 排序题（排成小故事、连词成句）：多玩几道，直到出现排序题
    for subj, want in [("chinese", "排成小故事"), ("english", "Make a sentence")]:
        tid(page, f"challenge-subject-{subj}").click(); page.wait_for_timeout(200)
        seen = []
        for _ in range(6):
            k = tid(page, "challenge-type").inner_text(); seen.append(k)
            if k == want: break
            solve_challenge(page); tid(page, "challenge-more").click(); page.wait_for_timeout(200)
        assert tid(page, "challenge-type").inner_text() == want, seen
        page.screenshot(path=f"{OUT}/t-05-sort-{subj}.png")
        solve_challenge(page)
        expect(tid(page, "challenge-result")).to_be_visible()
        ok(f"{'语文' if subj == 'chinese' else '英语'}排序题（{want}）：按顺序点句子/单词完成，点错的不会放进去（轮到过的题型：{'、'.join(seen)}）")
    tid(page, "challenge-home").click(); page.wait_for_selector('[data-testid="home"]')
    expect(tid(page, "challenge-status")).to_contain_text("今天完成了")
    gained = stars(page) - s0
    assert gained == (2 if first else 1), gained
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
        if tid(page, "num-ok").count():  # 自己填数题（每隔一道）
            for ch in str(a + c): tid(page, f"num-{ch}").click()
            tid(page, "num-ok").click()
        else:
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
    tid(page, "pc-report").click(); page.wait_for_selector('[data-testid="parent-report"]')  # V5.1 家长中心分页
    tid(page, "pt-section").scroll_into_view_if_needed()
    expect(tid(page, "pt-section")).to_contain_text("不是心理或智力测评")
    expect(tid(page, "pt-days")).to_contain_text("做过 1 天")
    expect(tid(page, "pt-subjects")).to_contain_text("语文")
    expect(tid(page, "pt-subjects")).to_contain_text("英语")
    expect(tid(page, "pt-subjects")).to_contain_text("数学 0 道")
    expect(tid(page, "pt-strategy-m1.carry20")).to_contain_text("共 4 次")
    expect(tid(page, "pt-strategy-m1.carry20")).to_contain_text("先凑成十 3")
    expect(tid(page, "pt-strategy-m1.carry20")).to_contain_text("先不下结论")
    tried = sum(int(m) for d in ["observe", "classify", "reason", "spatial"]
                for m in re.findall(r"做了 (\d+) 道", tid(page, f"pt-dim-{d}").inner_text()))
    assert tried >= 3, tried
    page.screenshot(path=f"{OUT}/t-04-parent.png")
    ok("家长中心“思维能力”：挑战 1 天、按学科和各方面的做题数、思路统计（凑十 3 次、数数 1 次，记录少不下结论），注明不是测评")

    # 4. 重新打开
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    expect(tid(page, "challenge-status")).to_contain_text("今天完成了")
    ok("重新打开后，挑战和思路记录仍在")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
