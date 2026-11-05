"""
V2.8 一、二年级英语三条主线端到端验收（网页版 / 单文件 HTML 版）：
1. 英语乐园显示交流、拼读、分级阅读三张主线卡片，注明配合的纸质书和“原创配套练习”说明。
2. 完整做完交流第 1 单元、拼读第 1 组、无字故事、首批词小书各一课（通用做题器：点卡片、跟读、对话、翻页、选择、判断、排序）。
3. 主线进度更新（1/9、1/7、2/7），课程显示已完成。
4. 原有 Fruits 课仍在交流主线里，可以进入。
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
def vis(page, sel): return page.locator(f'{sel}:visible')

SPY = """
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 20);
}
"""

def next_enabled(page):
    b = tid(page, "lesson-next")
    return b.count() and b.get_attribute("aria-disabled") != "true"

def solve_step(page):
    """把当前这一步做完，直到“下一步”可以点"""
    for _ in range(40):
        if next_enabled(page): return
        if page.locator('[data-testid^="card-"]').count():
            for c in page.locator('[data-testid^="card-"]').all(): c.click(); page.wait_for_timeout(60)
        if tid(page, "said-it").count():
            for _ in range(8):
                if next_enabled(page) or not tid(page, "said-it").count(): break
                b = tid(page, "said-it")
                if b.get_attribute("aria-disabled") != "true": b.click()
                page.wait_for_timeout(150)
        if tid(page, "dialogue-play").count():
            tid(page, "dialogue-play").click(); page.wait_for_timeout(600)
        if tid(page, "book-next").count():
            for _ in range(8):
                b = tid(page, "book-next")
                if b.get_attribute("aria-disabled") == "true": break
                b.click(); page.wait_for_timeout(150)
        if page.locator('[data-testid^="option-"]').count():
            for o in page.locator('[data-testid^="option-"]').all():
                if next_enabled(page): break
                if o.get_attribute("aria-disabled") == "true": continue
                o.click(); page.wait_for_timeout(200)
        if tid(page, "tf-true").count():
            tid(page, "tf-true").click(); page.wait_for_timeout(200)
            if not next_enabled(page): tid(page, "tf-false").click(); page.wait_for_timeout(200)
        sorts = page.locator('[data-testid^="sort-"]:not([data-testid="sort-answer"])')
        if sorts.count():
            for _ in range(sorts.count()):
                for s in sorts.all():
                    if next_enabled(page): break
                    s.click(); page.wait_for_timeout(100)
        page.wait_for_timeout(200)
    raise AssertionError("这一步没能完成")

def do_lesson(page, lesson_id, shot=None):
    tid(page, f"start-{lesson_id}").scroll_into_view_if_needed(); tid(page, f"start-{lesson_id}").click()
    page.wait_for_selector('[data-testid="lesson-next"]')
    steps = 0
    while not page.locator('[data-testid="lesson-summary"]').count():
        solve_step(page)
        if shot and steps == shot[0]: page.screenshot(path=f"{OUT}/{shot[1]}.png")
        tid(page, "lesson-next").click(); page.wait_for_timeout(350); steps += 1
        assert steps < 30
    score = tid(page, "summary-score").inner_text()
    tid(page, "summary-home").click(); page.wait_for_selector('[data-testid="home"]')
    return steps, score

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    def open_english():
        vis(page, '[data-testid="subject-english"]').first.click(); page.wait_for_selector('[data-testid="english-tracks"]')

    open_english()
    for t, book in [("talk", "Let’s Go"), ("phonics", "Jolly Phonics"), ("reading", "Oxford Reading Tree")]:
        expect(tid(page, f"track-{t}")).to_contain_text(book)
    expect(tid(page, "english-tracks")).to_contain_text("未收录原书")
    expect(tid(page, "track-progress-talk")).to_have_text("0/9")
    expect(tid(page, "track-progress-phonics")).to_have_text("0/7")
    expect(tid(page, "track-progress-reading")).to_have_text("0/7")
    page.screenshot(path=f"{OUT}/es-01-tracks.png", full_page=True)
    ok("英语乐园：交流 9 课、拼读 7 组、分级阅读 7 本三条主线，注明配合的纸质书和原创配套说明")

    for lid, name, shot in [
        ("en-talk-1", "交流第 1 单元 Hello!", (3, "es-02-talk-dialogue")),
        ("en-phonics-1", "拼读第 1 组 s a t i p n", (5, "es-03-phonics-build")),
        ("en-read-1", "无字故事 A Rainy Day", (0, "es-04-wordless")),
        ("en-read-3", "首批词小书 Pip Can", (0, "es-05-book")),
    ]:
        if not page.locator('[data-testid="english-tracks"]').count(): open_english()
        steps, score = do_lesson(page, lid, shot)
        ok(f"{name}：{steps} 步全部完成，{score.strip()}")

    open_english()
    expect(tid(page, "track-progress-talk")).to_have_text("1/9")
    expect(tid(page, "track-progress-phonics")).to_have_text("1/7")
    expect(tid(page, "track-progress-reading")).to_have_text("2/7")
    expect(tid(page, "start-en-talk-1")).to_contain_text("再学")
    ok("主线进度更新：交流 1/9、拼读 1/7、分级阅读 2/7，学过的课显示“再学”")
    tid(page, "start-english-fruits").scroll_into_view_if_needed(); tid(page, "start-english-fruits").click()
    page.wait_for_selector('[data-testid="lesson-next"]')
    ok("原有 Fruits 课在交流主线里，可以进入")
    tid(page, "lesson-exit").click(); page.wait_for_timeout(500)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    vis(page, '[data-testid="parent-entry"]').first.click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')
    tid(page, "parent-track-reading").scroll_into_view_if_needed()
    expect(tid(page, "parent-track-talk")).to_contain_text("已学 1/9")
    expect(tid(page, "parent-track-reading")).to_contain_text("已学 2/7")
    expect(tid(page, "parent-track-phonics")).to_contain_text("下一课 Group 2")
    page.screenshot(path=f"{OUT}/es-06-parent.png")
    ok("家长中心：三条主线的进度和下一课（交流 1/9、拼读下一课 Group 2、分级阅读 2/7）")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
