"""
V2.10 先教后练端到端验收（网页版 / 单文件 HTML 版）：
1. 知识小地图 → “20 以内进位加法” → 去练习：先出现 2 页小讲解（凑十法），翻页后“开始练习”。
2. 练完退出再进：不再自动讲解，但第一题前有“先看讲解”按钮，点开能再看。
3. 语文“阅读小屋”：6 篇短文；读《小狗找朋友》（短文带拼音、有朗读按钮）→ 答 2 道题 → 完成，进度 1/6。
4. 读《洗小手》：排序题按短文顺序排步骤。
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
def han(s): return "".join(re.findall(r"[一-鿿]", s))

SPY = """
window.__spoken = [];
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => { window.__spoken.push(u.text); setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 20); };
}
"""

def answer_current(page):
    """选择/判断题：依次点选项直到答对（等待选错冷却）"""
    opts = page.locator('[data-testid^="option-"], [data-testid^="tf-"]')
    for i in range(opts.count()):
        el = opts.nth(i)
        expect(el).not_to_have_attribute("aria-disabled", "true", timeout=4000)
        el.click(); page.wait_for_timeout(300)
        if page.locator('[data-testid="feedback-correct"]').count(): return i
    raise AssertionError("没有答对")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    # 1. 第一次练：先讲后练
    tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
    tid(page, "kp-m1.carry20").scroll_into_view_if_needed(); tid(page, "kp-m1.carry20").click()
    page.wait_for_selector('[data-testid="kp-card"]')
    tid(page, "kp-practice").click(); page.wait_for_selector('[data-testid="teach-panel"]')
    expect(page.locator('[data-testid^="practice-exercise-"]')).to_have_count(0)
    t0 = han(tid(page, "teach-slide-0").inner_text())
    assert "凑" in t0 or "分成" in t0, t0
    page.screenshot(path=f"{OUT}/tr-01-teach.png")
    tid(page, "teach-next").click(); page.wait_for_selector('[data-testid="teach-slide-1"]')
    t1 = han(tid(page, "teach-slide-1").inner_text())
    assert "凑十法" in t1, t1
    spoken = page.evaluate("window.__spoken")
    assert any("凑十法" in s for s in spoken), spoken
    tid(page, "teach-start").click()
    page.wait_for_selector('[data-testid^="practice-exercise-"]')
    ok(f"第一次练“20 以内进位加法”：先看 2 页小讲解（自动朗读）→ 开始练习。第 2 页：{t1}")

    # 练完一轮
    for i in range(10):
        stem = page.get_by_text(re.compile(r"^\d+ \+ \d+ = \?$")).first.inner_text()
        a, c = map(int, re.findall(r"\d+", stem))
        if tid(page, "num-ok").count():
            for ch in str(a + c): tid(page, f"num-{ch}").click()
            tid(page, "num-ok").click()
        else:
            tid(page, f"option-{a + c}").click()
        expect(tid(page, "feedback-correct")).to_be_visible()
        if page.locator('[data-testid="strategy-ask"]').count(): tid(page, "strategy-make10").click()
        tid(page, "practice-next").click(); page.wait_for_timeout(150)
    page.wait_for_selector('[data-testid="practice-summary"]')

    # 2. 再练一轮：不自动讲解，可以手动打开
    tid(page, "practice-again").click(); page.wait_for_selector('[data-testid^="practice-exercise-"]')
    expect(page.locator('[data-testid="teach-panel"]')).to_have_count(0)
    tid(page, "teach-open").click(); page.wait_for_selector('[data-testid="teach-panel"]')
    tid(page, "teach-skip").click(); page.wait_for_selector('[data-testid^="practice-exercise-"]')
    ok("练过以后再练一轮：不再自动讲解；第一题前有“先看讲解”按钮，点开能再看、也能直接跳过")
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    # 3. 阅读小屋
    tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="reading-house"]')
    expect(tid(page, "reading-progress")).to_have_text("0/6")
    tid(page, "reading-house").scroll_into_view_if_needed()
    page.screenshot(path=f"{OUT}/tr-02-reading-house.png")
    tid(page, "start-zh-read-4").click(); page.wait_for_selector('[data-testid="read-passage"]')
    txt = tid(page, "read-passage").inner_text()
    assert "小狗和小猫一起玩皮球" in han(txt), han(txt)
    assert "xiǎo" in txt, "短文应带拼音"
    tid(page, "read-listen").click(); page.wait_for_timeout(200)
    assert any("小狗想找一个朋友" in s for s in page.evaluate("window.__spoken"))
    page.screenshot(path=f"{OUT}/tr-03-passage.png")
    tid(page, "lesson-next").click()
    for q in range(2):
        page.wait_for_selector('[data-testid^="option-"]')
        answer_current(page)
        if q == 0: page.screenshot(path=f"{OUT}/tr-04-question.png")
        tid(page, "lesson-next").click(); page.wait_for_timeout(200)
    page.wait_for_selector('[data-testid="lesson-summary"]')
    ok("阅读小屋《小狗找朋友》：短文全文注音、能整篇朗读；读完回答 2 道题，完成")
    tid(page, "summary-home").click(); page.wait_for_selector('[data-testid="home"]')
    tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="reading-house"]')
    expect(tid(page, "reading-progress")).to_have_text("1/6")
    ok("回到语文页，阅读小屋进度 1/6")

    # 4. 排序题
    tid(page, "start-zh-read-5").scroll_into_view_if_needed(); tid(page, "start-zh-read-5").click()
    page.wait_for_selector('[data-testid="read-passage"]'); tid(page, "lesson-next").click()
    page.wait_for_selector('[data-testid="sort-answer"]')
    order = ["把手打湿", "擦上肥皂", "搓一搓", "冲一冲"]
    items = page.locator('[data-testid^="sort-"]:not([data-testid="sort-answer"])')
    for want in order:
        for i in range(items.count()):
            if han(items.nth(i).inner_text()) == want:
                items.nth(i).click(); page.wait_for_timeout(200); break
    expect(tid(page, "feedback-correct")).to_be_visible()
    page.screenshot(path=f"{OUT}/tr-05-sort.png")
    ok("阅读小屋《洗小手》：按短文顺序把 4 个洗手步骤排好")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
