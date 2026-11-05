"""
V2.15 真机试用准备（网页版 / 单文件 HTML 版）：家长中心“声音检查”卡片显示检查结果和版本号，试听按钮会朗读中文、英语。
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
window.__spoken = [];
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => { window.__spoken.push([u.text, u.lang]); setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 20); };
}
"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')
    tid(page, "voice-check").scroll_into_view_if_needed()
    expect(tid(page, "voice-result")).not_to_contain_text("正在检查", timeout=8000)
    result = tid(page, "voice-result").inner_text()
    expect(tid(page, "app-version")).to_contain_text("2.15.1")
    tid(page, "voice-test-zh").click(); tid(page, "voice-test-en").click(); page.wait_for_timeout(300)
    spoken = page.evaluate("window.__spoken")
    assert ["你好，我是星星宝。", "zh-CN"] in spoken and ["Hello! Nice to meet you.", "en-US"] in spoken, spoken
    page.screenshot(path=f"{OUT}/rc-01-voice-check.png")
    ok(f"家长中心“声音检查”：{result}；试听按钮分别用中文、英语朗读；显示版本 2.15.1")
    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
