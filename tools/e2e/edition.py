"""
V2.4 一年级新版教材单元端到端验收（网页版 / 单文件 HTML 版）：
1. 数学 → 题库闯关：上册按新版单元（数学游戏开头），注明“人教版（2024年新版）”；能进入新单元做题。
2. 语文 → 下册：新版单元，含《热爱中国共产党》等新课文。
3. 家长中心 → 试卷生成：一年级下册的单元是新版目录，选“100以内的笔算加、减法”出卷、打印；
   三年级如实提示仍是旧版单元。
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

SPY = """
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 30);
}
"""

def back_home(page):
    for _ in range(5):
        if page.locator('[data-testid="subject-chinese"]:visible').count(): return
        page.locator('[data-testid="back"]:visible').last.click(); page.wait_for_timeout(500)
    raise AssertionError("回不到首页")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    # 1. 数学题库：新版单元
    tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="bank-section"]')
    expect(tid(page, "book-meta-math-g1a")).to_contain_text("人教版（2024年新版）")
    expect(tid(page, "book-meta-math-g1a")).to_contain_text("7 个单元")
    expect(tid(page, "unit-math-g1a-n0")).to_contain_text("数学游戏")
    expect(page.locator('[data-testid^="unit-math-g1a-u"]')).to_have_count(0)
    tid(page, "unit-math-g1a-n5").scroll_into_view_if_needed()
    expect(tid(page, "unit-math-g1a-n5")).to_contain_text("20以内的进位加法")
    page.screenshot(path=f"{OUT}/ed-01-math-units.png")
    ok("数学题库：一年级上册 7 个新版单元（数学游戏开头），标注“人教版（2024年新版）”，旧单元不再显示")
    tid(page, "unit-math-g1a-n5").click(); page.wait_for_selector('[data-testid="practice-screen"]')
    expect(tid(page, "practice-progress")).to_contain_text("/")
    ok("进入新版单元“20以内的进位加法”做题")
    back_home(page)

    # 2. 语文下册
    tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="bank-section"]')
    tid(page, "book-chinese-g1b").scroll_into_view_if_needed(); tid(page, "book-chinese-g1b").click()
    expect(tid(page, "unit-chinese-g1b-n2")).to_contain_text("热爱中国共产党")
    expect(tid(page, "book-meta-chinese-g1b")).to_contain_text("统编版（2024年新版）")
    tid(page, "unit-chinese-g1b-n2").scroll_into_view_if_needed()
    page.screenshot(path=f"{OUT}/ed-02-chinese-units.png")
    ok("语文题库：一年级下册新版单元，含新课文《热爱中国共产党》")
    back_home(page)

    # 3. 试卷
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')
    tid(page, "exam-entry").scroll_into_view_if_needed(); tid(page, "exam-entry").click()
    page.wait_for_selector('[data-testid="exam-generate"]')
    tid(page, "exam-subject-math").click(); tid(page, "exam-grade-1").click(); tid(page, "exam-term-下").click()
    expect(tid(page, "exam-edition")).to_contain_text("人教版（2024年新版）")
    expect(tid(page, "exam-unit-5")).to_contain_text("100以内的笔算加、减法")
    tid(page, "exam-unit-5").click(); tid(page, "exam-size-20").click(); tid(page, "exam-generate").click()
    page.wait_for_selector('[data-testid="exam-preview"]')
    expect(page.locator('[data-testid="exam-item"]')).to_have_count(20)
    page.screenshot(path=f"{OUT}/ed-03-exam.png")
    tid(page, "exam-print").click(); page.wait_for_function("() => !!globalThis.__lastPrintHtml")
    html = page.evaluate("() => globalThis.__lastPrintHtml")
    assert "范围：100以内的笔算加、减法" in html and "人教版（2024年新版）" in html, "打印内容缺少新版说明"
    ok("试卷：一年级下册按新版单元，只选“笔算”出 20 题；打印稿写明“人教版（2024年新版）”")
    tid(page, "exam-grade-3").click()
    expect(tid(page, "exam-edition")).to_contain_text("旧版")
    ok("三年级如实提示：仍按旧版单元，新版待更新")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
