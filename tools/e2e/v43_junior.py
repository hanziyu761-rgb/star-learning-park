"""
V4.3 端到端验收（网页版）：初中
1. 家长中心把年级设为七年级：出现“初中：不标拼音……没有初中的课程和练习”说明
2. 回到首页：汉字上方不再有拼音；改回六年级后拼音恢复
3. 教材资源库：七年级默认打开“统编版（初中）”，能看到七年级上册目录；数学人教版（初中）九年级下册标“未修订版”；英语冀教版（初中）九年级下册提示没有资料
"""
import os, re
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
def ok(m): print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first

def gate(page):
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')

# 首页上“汉字上面的拼音”个数：带声调的小字
PY = "() => [...document.querySelectorAll('[data-testid=\"pinyin-text\"] div')].filter(e => e.children.length === 0 && /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(e.textContent)).length"

with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    errors = []
    for (w, h) in [(390, 820), (1280, 800)]:
        page = b.new_page(viewport={"width": w, "height": h})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        before = page.evaluate(PY)
        assert before > 0, "小学默认应该有拼音"
        gate(page)
        assert tid(page, "grade-9").count() == 1
        tid(page, "grade-7").scroll_into_view_if_needed(); tid(page, "grade-7").click()
        expect(tid(page, "grade-junior-note")).to_have_text("初中：不标拼音。目前只有课本目录，没有初中的课程和练习。")
        page.screenshot(path=f"{OUT}/v43-grade-{w}.png", full_page=True)
        ok(f"{w}×{h}：年级可选到九年级；选七年级后显示初中说明")

        # 教材资源库默认打开初中课本
        tid(page, "parent-textbooks").scroll_into_view_if_needed(); tid(page, "parent-textbooks").click()
        page.wait_for_selector('[data-testid="textbooks-screen"]')
        tid(page, "tb-dd-term").click(); tid(page, "tb-dd-term-opt-上").click()
        expect(tid(page, "tb-book-title")).to_have_text("统编版（初中） · 七年级上册")
        expect(tid(page, "tb-units")).to_contain_text("济南的冬天")
        expect(tid(page, "tb-units")).to_contain_text("《西游记》")
        tid(page, "tb-dd-subject").click(); tid(page, "tb-dd-subject-opt-math").click()
        expect(tid(page, "tb-book-title")).to_have_text("人教版（初中） · 七年级上册")
        expect(tid(page, "tb-units")).to_contain_text("第一章 有理数")
        tid(page, "tb-dd-grade").click(); tid(page, "tb-dd-grade-opt-9").click()
        tid(page, "tb-dd-term").click(); tid(page, "tb-dd-term-opt-下").click()
        expect(tid(page, "tb-book-title")).to_have_text("人教版（初中） · 九年级下册")
        expect(tid(page, "tb-simple")).to_contain_text("未修订版")
        expect(tid(page, "tb-units")).to_contain_text("锐角三角函数")
        tid(page, "tb-dd-subject").click(); tid(page, "tb-dd-subject-opt-english").click()
        expect(tid(page, "tb-book-title")).to_have_text("冀教版（初中） · 九年级下册")
        expect(tid(page, "tb-not-ready")).to_contain_text("没有这一册的资料")
        tid(page, "tb-dd-term").click(); tid(page, "tb-dd-term-opt-上").click()
        expect(tid(page, "tb-units")).to_contain_text("Unit 6 Looking into science")
        expect(tid(page, "tb-units")).to_contain_text("初中目前只有目录，没有课程和练习")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        page.screenshot(path=f"{OUT}/v43-textbooks-{w}.png", full_page=True)
        ok(f"{w}×{h}：教材资源库默认打开初中课本；三科初中目录能看；九年级下册如实标注（数学未修订版、英语没有这一册）；不超出屏幕")

        # 首页不标拼音
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        page.wait_for_timeout(500)
        assert page.evaluate(PY) == 0, f"初中首页不应有拼音，实际 {page.evaluate(PY)}"
        page.screenshot(path=f"{OUT}/v43-home-junior-{w}.png", full_page=True)
        gate(page)
        tid(page, "grade-6").scroll_into_view_if_needed(); tid(page, "grade-6").click()
        assert tid(page, "grade-junior-note").count() == 0
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        page.wait_for_timeout(500)
        assert page.evaluate(PY) > 0
        ok(f"{w}×{h}：七年级首页汉字不标拼音（原来 {before} 处拼音 → 0）；改回六年级拼音恢复")
        page.close()
    assert not errors, errors
    b.close()
print("ALL PASS")
