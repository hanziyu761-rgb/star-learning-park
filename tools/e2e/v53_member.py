"""
V5.3 会员（网页端到端）：
1. 新安装：免费试用中，所有功能能打开；家长中心“会员”显示试用天数和 8 位设备号
2. 试用结束（把试用开始时间改到 30 天前）：游戏乐园、每日挑战、课程弹出“请爸爸妈妈来看看”；
   首页、学科页、家长中心照常打开；今日一练每天能免费做 1 套，换一科提示“今天的免费今日一练已经做过了”
3. 填错的开通码提示“格式不对”；（可选）环境变量 MEMBER_CODE / MEMBER_DEVICE 给了管理员工具开出的真码时，开通后所有功能恢复
"""
import json, os, re
import sys as _sys, os as _os
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
from tts_spy import tts_spy
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
def ok(m): print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first

def parent(page):
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')

def set_member(page, fn):
    page.evaluate(f"""() => {{ const m = JSON.parse(localStorage.getItem('slp.member.v1')); ({fn})(m); localStorage.setItem('slp.member.v1', JSON.stringify(m)); }}""")

def blocked(page, entry, text="开通会员", shot=None):
    tid(page, entry).click()
    expect(tid(page, "paywall")).to_be_visible()
    expect(tid(page, "paywall")).to_contain_text(text)
    if shot: page.screenshot(path=shot)
    tid(page, "paywall-close").click()
    expect(tid(page, "paywall")).to_have_count(0)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    errors = []
    for (w, h) in [(390, 820), (1280, 800)]:
        ctx = b.new_context(viewport={"width": w, "height": h})
        ctx.add_init_script(tts_spy("obj"))
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))

        # 1. 新安装：试用中
        parent(page)
        expect(tid(page, "member-status")).to_contain_text("免费试用中，还剩 7 天")
        dev = tid(page, "member-device-id").inner_text()
        assert re.fullmatch(r"[0-9A-Z]{4}-[0-9A-Z]{4}", dev), dev
        page.screenshot(path=f"{OUT}/v53-member-trial-{w}.png", full_page=True)
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "games-entry").click(); page.wait_for_selector('[data-testid="games-screen"]')
        ok(f"{w}×{h}：新安装免费试用 7 天，游戏乐园能打开；家长中心显示设备号 {dev}")

        # 2. 试用结束
        set_member(page, "m => { m.firstSeen = Date.now() - 30 * 86400000; m.lastSeen = Date.now(); delete m.freeMix; }")
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        blocked(page, "games-entry", shot=f"{OUT}/v53-paywall-{w}.png")
        blocked(page, "challenge-entry")
        tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="subject-screen-math"]')
        start = page.locator('[data-testid^="start-math-"]').first
        start.click(); expect(tid(page, "paywall")).to_be_visible(); tid(page, "paywall-close").click()
        # 今日一练：数学这一套免费
        tid(page, "daily-mix-math").scroll_into_view_if_needed(); tid(page, "daily-mix-math").click()
        page.wait_for_selector('[data-testid="practice-screen"]')
        expect(tid(page, "practice-screen")).to_contain_text("今日一练")
        page.goto(BASE)
        page.wait_for_selector('[data-testid="home"]')
        # 同一天再打开数学这一套可以；换语文不行
        tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="subject-screen-math"]')
        tid(page, "daily-mix-math").scroll_into_view_if_needed(); tid(page, "daily-mix-math").click()
        page.wait_for_selector('[data-testid="practice-screen"]')
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="subject-screen-chinese"]')
        tid(page, "daily-mix-chinese").scroll_into_view_if_needed(); tid(page, "daily-mix-chinese").click()
        expect(tid(page, "paywall")).to_contain_text("今天的免费")
        # 弹窗里的“家长中心 · 会员”能进家长中心
        tid(page, "paywall-parent").click(); page.wait_for_selector('[data-testid="parent-gate"]')
        ok(f"{w}×{h}：试用结束后游戏、每日挑战、课程弹出“请爸爸妈妈来看看”；首页、学科页能打开；今日一练数学这一套免费（再打开也可以），换语文提示今天的免费已用")

        # 3. 开通码
        parent(page)
        expect(tid(page, "member-status")).to_contain_text("免费试用已结束")
        tid(page, "member-code").fill("LH1.abc"); tid(page, "member-activate").click()
        expect(tid(page, "member-msg")).to_contain_text("格式不对")
        code, mdev = os.environ.get("MEMBER_CODE"), os.environ.get("MEMBER_DEVICE")
        if code and mdev:
            set_member(page, f"m => {{ m.deviceId = '{mdev}'; }}")
            parent(page)
            tid(page, "member-code").fill(code); tid(page, "member-activate").click()
            expect(tid(page, "member-msg")).to_contain_text("开通成功")
            expect(tid(page, "member-status")).to_contain_text("会员有效期到")
            page.screenshot(path=f"{OUT}/v53-member-on-{w}.png", full_page=True)
            page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
            tid(page, "games-entry").click(); page.wait_for_selector('[data-testid="games-screen"]')
            ok(f"{w}×{h}：管理员工具开出的开通码能开通，开通后游戏乐园恢复；填错的码提示格式不对")
        else:
            ok(f"{w}×{h}：填错的开通码提示格式不对（没有提供真开通码，跳过开通成功的检查）")
        ctx.close()
    assert not errors, errors
    b.close()
print("ALL PASS")
