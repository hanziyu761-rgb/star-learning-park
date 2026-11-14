"""
V2.15 真机试用准备（网页版 / 单文件 HTML 版）：家长中心“声音检查”卡片显示检查结果和版本号，试听按钮会朗读中文、英语。
"""
import json
import os
import re

# 版本号以 src/version.ts 为准
APP_VERSION = re.search(r"APP_VERSION = '([^']+)'", open(os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'version.ts'), encoding='utf-8').read()).group(1)
import sys as _sys, os as _os
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
from tts_spy import tts_spy
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
RESULTS = []
def ok(m): RESULTS.append(m); print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first

SPY = tts_spy("pair")  # V5.1：朗读走云端童声，记录要读的文字（见 tts_spy.py）

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
    tid(page, "pc-settings").click(); page.wait_for_selector('[data-testid="parent-settings"]')  # V5.1 家长中心分页
    tid(page, "voice-check").scroll_into_view_if_needed()
    # V5.1 起不用手机语音，不再检查手机里的语音；只用星星宝童声
    assert page.locator('[data-testid="voice-result"]').count() == 0
    result = tid(page, "voice-gender-note").inner_text()
    expect(tid(page, "app-version")).to_contain_text(f"林亨学习乐园 版本 {APP_VERSION}")
    tid(page, "voice-test-zh").click(); tid(page, "voice-test-en").click(); page.wait_for_timeout(300)
    spoken = page.evaluate("window.__spoken")
    assert ["小朋友你好，我们一起来学习吧！", "zh-CN"] in spoken and ["Hello! Let’s learn together.", "en-US"] in spoken, spoken
    page.screenshot(path=f"{OUT}/rc-01-voice-check.png")
    ok(f"家长中心“声音”：{result}；试听按钮分别请求云端童声读中文、英语；显示“林亨学习乐园 版本 {APP_VERSION}”")
    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
