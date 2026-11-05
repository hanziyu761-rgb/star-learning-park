"""
V2.9 自己作答端到端验收（网页版 / 单文件 HTML 版）：
1. 口算闯关：每隔一道是数字键盘填数题；填错清空并提示，填对通过。
2. 选择题防乱点：同一题第二次选错后选项暂停，出现“先读一读提示”，过一会儿才能再选。
3. 语文描红写字：第 1 组（一 二 三 十）用手指（鼠标）按笔顺描；倒着写提示“方向反了”；四个字都描完，完成一轮。
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

SPY = """
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 20);
}
"""

# 第 1 组的笔画（与 src/content/writing.ts 一致，坐标 0～100）
SET1 = {
    "一": [[(15, 50), (85, 50)]],
    "二": [[(25, 35), (75, 35)], [(15, 68), (85, 68)]],
    "三": [[(25, 25), (75, 25)], [(30, 50), (70, 50)], [(15, 78), (85, 78)]],
    "十": [[(15, 50), (85, 50)], [(50, 12), (50, 88)]],
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

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    # 1、2. 口算闯关
    tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="oral-section"]')
    tid(page, "oral-add10").click(); page.wait_for_selector('[data-testid="practice-screen"]')
    kinds = []
    for i in range(10):
        stem = page.get_by_text(re.compile(r"^\d+ \+ \d+ = \?$")).first.inner_text()
        a, c = map(int, re.findall(r"\d+", stem))
        if tid(page, "num-ok").count():
            kinds.append("填")
            if len(kinds) == 2:
                for ch in str(a + c + 1): tid(page, f"num-{ch}").click()
                tid(page, "num-ok").click()
                expect(tid(page, "feedback-wrong")).to_be_visible()
                expect(tid(page, "input-display")).to_have_text("?")
                page.screenshot(path=f"{OUT}/sa-01-input.png")
            for ch in str(a + c): tid(page, f"num-{ch}").click()
            tid(page, "num-ok").click()
        else:
            kinds.append("选")
            if i == 0:
                wrongs = [e.get_attribute("data-testid")[7:] for e in page.locator('[data-testid^="option-"]').all()]
                wrongs = [w for w in wrongs if w != str(a + c)][:2]
                tid(page, f"option-{wrongs[0]}").click(); expect(tid(page, "feedback-wrong")).to_be_visible()
                expect(page.locator('[data-testid="choice-cooldown"]')).to_have_count(0)
                tid(page, f"option-{wrongs[1]}").click()
                expect(tid(page, "choice-cooldown")).to_be_visible()
                page.screenshot(path=f"{OUT}/sa-02-cooldown.png")
                expect(page.locator('[data-testid="choice-cooldown"]')).to_have_count(0, timeout=4000)
            tid(page, f"option-{a + c}").click()
        expect(tid(page, "feedback-correct")).to_be_visible()
        tid(page, "practice-next").click(); page.wait_for_timeout(150)
    assert kinds.count("填") == 5, kinds
    page.wait_for_selector('[data-testid="practice-summary"]')
    ok(f"口算闯关 10 题：{''.join(kinds)}（一半自己填数）；填错清空并提示，填对通过")
    ok("选择题第二次选错后选项暂停、出现“先读一读提示”，约 1.5 秒后才能再选")
    tid(page, "practice-home").click(); page.wait_for_selector('[data-testid="home"]')

    # 3. 描红写字
    tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="write-section"]')
    tid(page, "write-set-1").scroll_into_view_if_needed(); tid(page, "write-set-1").click()
    page.wait_for_selector('[data-testid="trace-canvas"]')
    for n, (ch, strokes) in enumerate(SET1.items()):
        expect(tid(page, "practice-screen")).to_contain_text(ch)
        if n == 1:
            # 第二个字：第一笔故意倒着写
            draw(page, list(reversed(strokes[0])))
            expect(tid(page, "feedback-wrong")).to_be_visible()
            han = "".join(re.findall(r"[\u4e00-\u9fff]", tid(page, "feedback-wrong").inner_text()))  # 去掉拼音
            assert "方向反了" in han, han
            page.screenshot(path=f"{OUT}/sa-03-trace-reversed.png")
        for k, st in enumerate(strokes):
            expect(tid(page, "trace-step")).to_contain_text(f"第 {k + 1} 笔")
            draw(page, st)
        expect(tid(page, "trace-done")).to_be_visible()
        if ch == "十": page.screenshot(path=f"{OUT}/sa-04-trace-done.png")
        tid(page, "practice-next").click(); page.wait_for_timeout(300)
    page.wait_for_selector('[data-testid="practice-summary"]')
    ok("描红写字第 1 组（一 二 三 十）：按笔顺描完；倒着写提示“方向反了”；" + tid(page, "practice-score").inner_text())

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
