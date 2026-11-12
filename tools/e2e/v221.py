"""
V2.21 端到端验收（网页版 / 单文件 HTML 版）：
1. 开机动画：打开就播放，“林亨学习乐园”跳出来、读欢迎语，约 3 秒后自动进入首页；点一下能跳过；手机和平板横屏都不超出屏幕
2. 家长中心关掉开机动画后，再打开不播放
3. 错题本：在拼音钓鱼里故意钓错一次 → 语文学科页显示“语文错题本 1”→ 错题本里能看到这道题 → 打印出 A4 错题单（PDF）→ 重做错题
4. 家长中心有三科错题本入口；声音设置里只有童声（没有男女声选项）
"""
import json
import os
import re

from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
RESULTS = []
def ok(m): RESULTS.append(m); print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first
def url(q=""):
    if not q: return BASE
    return BASE + ("&" if "?" in BASE else "?") + q

POOL = dict(x.split("|") for x in re.search(r"CHAR_POOL = '([^']+)'", open(os.path.join(ROOT, "src/games/data/charPool.gen.ts"), encoding="utf-8").read()).group(1).split(" "))

SPY = """
window.__spoken = [];
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => { window.__spoken.push({text: u.text, lang: u.lang}); setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 20); };
}
"""

def parent(page):
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    errors = []
    def ctx_page(w, h):
        ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2)
        ctx.add_init_script(SPY)
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text and "fcapp.run" not in m.text else None)
        return ctx, page

    # 1. 开机动画（手机、平板横屏）
    for (w, h) in [(390, 820), (1280, 800)]:
        ctx, page = ctx_page(w, h)
        page.goto(url("splash=1"))
        page.wait_for_selector('[data-testid="splash"]')
        page.wait_for_timeout(1300)
        title = re.sub(r"[a-zāáǎàēéěèīíǐìōóǒòūúǔùü\s]", "", tid(page, "splash-title").inner_text())
        assert title == "林亨学习乐园", title
        page.screenshot(path=f"{OUT}/v221-splash-{w}.png")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        page.wait_for_function("() => window.__spoken.some(s => s.text.startsWith('你好，欢迎来到林亨学习乐园'))", timeout=8000)
        page.wait_for_selector('[data-testid="splash"]', state="detached", timeout=6000)
        expect(tid(page, "home")).to_be_visible()
        ok(f"{w}×{h} 开机动画：出现“林亨学习乐园”、读欢迎语，约 3 秒后自动进入首页")
        ctx.close()

    ctx, page = ctx_page(390, 820)
    page.goto(url("splash=1")); page.wait_for_selector('[data-testid="splash"]')
    page.wait_for_timeout(400)
    tid(page, "splash-skip").click()
    page.wait_for_selector('[data-testid="splash"]', state="detached", timeout=2000)
    ok("点一下跳过开机动画")

    # 2. 家长中心关掉开机动画
    parent(page)
    expect(tid(page, "voice-gender-note")).to_contain_text("星星宝童声")
    assert page.locator('[data-testid="voice-gender-male"]').count() == 0 and page.locator('[data-testid="voice-gender-female"]').count() == 0
    sw = tid(page, "splash-switch"); sw.scroll_into_view_if_needed(); sw.click(); page.wait_for_timeout(300)
    page.goto(url("splash=1")); page.wait_for_selector('[data-testid="home"]'); page.wait_for_timeout(800)
    assert page.locator('[data-testid="splash"]').count() == 0
    ok("声音设置只有童声；家长关掉开机动画后再打开不播放")

    # 3. 错题本：拼音钓鱼钓错一次
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "games-entry").scroll_into_view_if_needed(); tid(page, "games-entry").click()
    tid(page, "games-start-fish").click(); page.wait_for_selector('[data-testid="game-fish"]'); page.wait_for_timeout(400)
    ans = POOL[tid(page, "fish-char").inner_text().strip()]
    fish = page.locator('[data-testid="fish-pond"] [role="button"]')
    for i in range(fish.count()):
        if fish.nth(i).get_attribute("aria-label") != ans:
            fish.nth(i).click(force=True); break
    page.wait_for_timeout(300)
    page.locator(f'[data-testid="fish-pond"] [aria-label="{ans}"]').first.click(force=True)
    expect(tid(page, "fish-next")).to_be_visible()
    for _ in range(5):
        tid(page, "fish-next").click(); page.wait_for_timeout(250)
        a2 = POOL[tid(page, "fish-char").inner_text().strip()]
        page.locator(f'[data-testid="fish-pond"] [aria-label="{a2}"]').first.click(force=True)
        expect(tid(page, "fish-next")).to_be_visible()
    tid(page, "fish-next").click(); page.wait_for_selector('[data-testid="game-summary"]')

    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="subject-screen-chinese"]')
    entry = tid(page, "subject-mistakes-chinese")
    expect(entry).to_have_text(re.compile(r"错题本\s*1$"))  # V4.2：入口只留名字和没掌握的题数
    page.screenshot(path=f"{OUT}/v221-subject-entry.png")
    entry.click(); page.wait_for_selector('[data-testid="mistakes-screen"]')
    expect(tid(page, "mistakes-open-count")).to_have_text("1")
    expect(page.locator('[data-testid="mistake-entry"]')).to_have_count(1)
    page.screenshot(path=f"{OUT}/v221-mistakes.png", full_page=True)
    tid(page, "mistakes-print").click()
    page.wait_for_function("() => !!globalThis.__lastPrintHtml")
    html = page.evaluate("() => globalThis.__lastPrintHtml")
    assert "语文错题本" in html and "错过 1 次" in html and "参考答案" in html, html[:500]
    pg = b.new_page(); pg.set_content(html, wait_until="load")
    pg.pdf(path=f"{OUT}/v221-mistakes.pdf", format="A4", print_background=True, prefer_css_page_size=True)
    pg.set_viewport_size({"width": 794, "height": 1123}); pg.screenshot(path=f"{OUT}/v221-mistakes-paper.png"); pg.close()
    ok("钓错一次 → 语文学科页显示“还有 1 道题没掌握”→ 错题本里有这道题 → 打印出 A4 错题单（含答案页）")

    tid(page, "mistakes-redo").click(); page.wait_for_selector('[data-testid="review-screen"]')
    expect(tid(page, "review-progress")).to_have_text("1/1")
    page.screenshot(path=f"{OUT}/v221-redo.png")
    ok("错题本“重做错题”进入只有这一道语文错题的复习")

    # 4. 家长中心三科入口
    parent(page)
    for sub in ["math", "chinese", "english"]:
        expect(tid(page, f"parent-mistakes-{sub}")).to_be_visible()
    expect(tid(page, "parent-mistakes-chinese")).to_contain_text("（1）")
    tid(page, "parent-mistakes-math").click(); page.wait_for_selector('[data-testid="mistakes-screen"]')
    expect(tid(page, "mistakes-empty")).to_be_visible()
    ok("家长中心有数学、语文、英语三本错题本入口；数学没有错题时显示鼓励")

    # 平板横屏下错题本页面不超出屏幕
    ctx2, p2 = ctx_page(1280, 800)
    p2.goto(BASE); p2.wait_for_selector('[data-testid="home"]')
    tid(p2, "subject-math").click(); tid(p2, "subject-mistakes-math").click(); p2.wait_for_selector('[data-testid="mistakes-screen"]')
    assert p2.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
    p2.screenshot(path=f"{OUT}/v221-mistakes-1280.png")
    ok("平板横屏：错题本页面正常显示")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
