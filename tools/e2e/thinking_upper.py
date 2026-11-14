"""
V2.7 二～六年级思维训练端到端验收（网页版 / 单文件 HTML 版）：
家长把年级设为三年级、五年级 → 每日挑战三科的题型随年级变化，题目不注拼音；
多玩几道，确认出现高年级题型（逻辑推理、幻方、鸡兔同笼 / 植树 / 年龄问题、成语、关联词、病句、英语短文、比较推理），都能做完。
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
TONE = re.compile(r"[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]")

SPY = """
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 30);
}
"""

def solve(page):
    sorts = page.locator('[data-testid="challenge-screen"] [data-testid^="sort-"]:not([data-testid="sort-answer"])')
    if sorts.count():
        n = sorts.count()
        for _ in range(n):
            for i in range(n):
                if page.locator('[data-testid="challenge-result"]').count(): break
                sorts.nth(i).click(); page.wait_for_timeout(120)
    else:
        multi = page.locator('[data-testid="challenge-screen"] [data-testid^="multi-"]:not([data-testid="multi-ok"]):not([data-testid="multi-badge"])')
        if multi.count():
            # 多选题：全部选上再提交；选错的会被去掉，再提交一次就对了
            for _ in range(3):
                for i in range(multi.count()):
                    if multi.nth(i).get_attribute("aria-checked") != "true" and multi.nth(i).get_attribute("aria-disabled") != "true":
                        multi.nth(i).click()
                tid(page, "multi-ok").click(); page.wait_for_timeout(200)
                if page.locator('[data-testid="challenge-result"]').count(): break
            expect(tid(page, "challenge-result")).to_be_visible(); return
        opts = page.locator('[data-testid="challenge-screen"] [data-testid^="option-"]')
        for i in range(opts.count()):
            opts.nth(i).click(); page.wait_for_timeout(150)
            if page.locator('[data-testid="challenge-result"]').count(): break
    expect(tid(page, "challenge-result")).to_be_visible()

def set_grade(page, g):
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')
    tid(page, "pc-settings").click(); page.wait_for_selector('[data-testid="parent-settings"]')  # V5.1 家长中心分页
    tid(page, f"grade-{g}").scroll_into_view_if_needed(); tid(page, f"grade-{g}").click()
    page.wait_for_timeout(300)
    tid(page, "back").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')
    tid(page, "pc-report").click(); page.wait_for_selector('[data-testid="parent-report"]')  # V5.1 家长中心分页
    # V2.11：本测试检查“按年级”的题型，先关掉“难度跟着孩子调整”（另有 thinking_adaptive.py 测调整）
    sw = tid(page, "pt-adaptive-switch")
    sw.scroll_into_view_if_needed()
    if sw.locator("input").is_checked():
        sw.click(); page.wait_for_timeout(200)
    assert not sw.locator("input").is_checked()
    expect(tid(page, "pt-levels")).to_contain_text("已关闭")

    tid(page, "back").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')  # V5.1：先回到家长中心首页
    page.locator('[data-testid="back"]:visible').last.click(); page.wait_for_selector('[data-testid="challenge-entry"]:visible')

def play(page, subj, rounds, shots=()):
    tid(page, f"challenge-subject-{subj}").click(); page.wait_for_timeout(200)
    if page.locator('[data-testid="challenge-done-today"]').count():
        tid(page, "challenge-more").click(); page.wait_for_timeout(200)
    seen = []
    for i in range(rounds):
        kind = tid(page, "challenge-type").inner_text(); seen.append(kind)
        ex = page.locator('[data-testid^="challenge-exercise-"]').first
        txt = ex.inner_text()
        assert not TONE.search(txt), f"{kind} 出现了拼音：{txt[:60]}"
        if kind in shots: page.screenshot(path=f"{OUT}/u-{subj}-{kind.replace(' ', '_').replace('?', '')}.png")
        solve(page)
        tid(page, "challenge-more").click(); page.wait_for_timeout(200)
    return seen

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    # 三年级
    set_grade(page, 3)
    tid(page, "challenge-entry").click(); page.wait_for_selector('[data-testid="challenge-screen"]')
    m3 = play(page, "math", 10, shots=("逻辑推理", "幻方填数"))
    assert "逻辑推理" in m3 and "幻方填数" in m3, m3
    assert not {"鸡兔同笼", "植树问题", "年龄问题", "图案找规律"} & set(m3), m3
    ok(f"三年级数学：10 道依次是 {'、'.join(m3)}；有逻辑推理、幻方，没有一年级的图案题和五六年级的鸡兔同笼；不注拼音")
    c3 = play(page, "chinese", 6, shots=("成语填空", "火眼金睛", "读一读，想一想"))
    assert {"成语填空", "关联词", "火眼金睛"} <= set(c3), c3
    ok(f"三年级语文：{'、'.join(c3)}；不注拼音")
    e3 = play(page, "english", 6, shots=("Read and answer", "Who is the tallest?"))
    assert {"Read and answer", "Who is the tallest?"} <= set(e3), e3
    ok(f"三年级英语：{'、'.join(e3)}")
    page.locator('[data-testid="challenge-screen"] [data-testid="back"]').click()
    page.wait_for_selector('[data-testid="challenge-screen"]', state="detached")

    # 五年级
    set_grade(page, 5)
    tid(page, "challenge-entry").click(); page.wait_for_selector('[data-testid="challenge-screen"]')
    m5 = play(page, "math", 13, shots=("鸡兔同笼", "植树问题", "年龄问题"))
    assert {"鸡兔同笼", "植树问题", "年龄问题", "逻辑推理"} <= set(m5), m5
    ok(f"五年级数学：13 道轮到 13 种题型（{'、'.join(m5)}）")
    c5 = play(page, "chinese", 6, shots=("排成小故事",))
    e5 = play(page, "english", 6, shots=("What comes next?",))
    ok(f"五年级语文：{'、'.join(c5)}；英语：{'、'.join(e5)}；都能做完、不注拼音")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
