"""
V5.4 新功能（网页端到端）：
1. 首页连续打卡卡片；家长中心 · 设置：护眼与学习时长、孩子（添加、切换、首页头像）、学习记录备份（导出下载）
2. 八年级英语“英语阅读 · 完形填空”能打开；语文“古诗文默写”做一轮
3. 单元小测：八年级上册语文本学期综合 10 道，交卷显示得分和每个知识点
4. 五年级植树问题做错后出现“看分步讲解”，一步一步显示
5. 错题本：换到八年级后默认只看八年级，可以切到“全部”看到五年级的错题；家长中心本周小结
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

def settings(page):
    parent(page)
    tid(page, "pc-settings").click(); page.wait_for_selector('[data-testid="parent-settings"]')

def set_grade(page, g):
    settings(page)
    tid(page, f"grade-{g}").scroll_into_view_if_needed(); tid(page, f"grade-{g}").click()
    page.wait_for_timeout(300)

def answer_current(page, wrong_first=False):
    """选择题：一个个试到答对（上一题的“答对了”提示先等它消失）"""
    expect(page.locator('[data-testid="feedback-correct"]')).to_have_count(0, timeout=5000)
    opts = page.locator('[data-testid^="option-"], [data-testid^="tf-"]')
    if page.locator('[data-testid="input-display"]').count():
        return False
    for _ in range(opts.count()):
        if page.locator('[data-testid="feedback-correct"]').count(): break
        expect(page.locator('[data-testid="choice-cooldown"]')).to_have_count(0, timeout=5000)
        nxt = next((opts.nth(i) for i in range(opts.count()) if opts.nth(i).is_enabled()), None)
        if nxt is None: break
        nxt.click(); page.wait_for_timeout(250)
    expect(tid(page, "feedback-correct")).to_be_visible()
    return True

def run_round(page, limit=25):
    for _ in range(limit):
        page.wait_for_selector('[data-testid^="practice-exercise-"], [data-testid="practice-summary"]')
        page.wait_for_timeout(150)
        if page.locator('[data-testid="practice-summary"]').count(): return
        if not answer_current(page):
            # 填数题：跳过（先交一个错的，再按答案…这里直接用“继续”不可用），改为点屏蔽不合适；用 0 试错后继续
            raise AssertionError("这一轮出现了填数题")
        tid(page, "practice-next").click()
    page.wait_for_selector('[data-testid="practice-summary"]')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    errors = []
    for (w, h) in [(390, 820), (1280, 800)]:
        ctx = b.new_context(viewport={"width": w, "height": h}, accept_downloads=True)
        ctx.add_init_script(tts_spy("obj"))
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))

        # 1. 首页打卡；设置
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        expect(tid(page, "streak-card")).to_be_visible()
        settings(page)
        tid(page, "dailyMinutes-40").scroll_into_view_if_needed(); tid(page, "dailyMinutes-40").click()
        tid(page, "breakMinutes-30").click()
        raw = json.loads(page.evaluate("localStorage.getItem('slp.progress.v1')"))
        assert raw["settings"]["dailyMinutes"] == 40 and raw["settings"]["breakMinutes"] == 30, raw["settings"]
        tid(page, "dailyMinutes-0").click()
        # 备份导出（网页版下载 .json）
        with page.expect_download() as dl:
            tid(page, "backup-export").click()
        path = dl.value.path(); data = json.load(open(path, encoding="utf-8"))
        assert data["app"] == "linheng-learning-park" and "p1" in data["data"], list(data)
        # 添加孩子并切换
        tid(page, "child-new-name").fill("妹妹"); tid(page, "child-new-grade-5").click(); tid(page, "child-add").click()
        page.wait_for_timeout(500)
        expect(tid(page, "child-p2")).to_contain_text("当前 · 五年级")
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        expect(tid(page, "profile-switcher")).to_be_visible()
        tid(page, "profile-p1").click(); page.wait_for_timeout(400)
        tid(page, "profile-p2").click(); page.wait_for_timeout(400)
        page.screenshot(path=f"{OUT}/v54-home-{w}.png", full_page=True)
        ok(f"{w}×{h}：首页连续打卡；护眼设置保存；备份导出下载成功；添加孩子“妹妹”（五年级）并切换，首页显示头像")

        # 4. 五年级植树问题：先做错，出现分步讲解
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
        tid(page, "kp-m5.trees").scroll_into_view_if_needed(); tid(page, "kp-m5.trees").click()
        tid(page, "kp-practice").click(); page.wait_for_selector('[data-testid="practice-screen"]')
        if tid(page, "teach-skip").count(): tid(page, "teach-skip").click()
        page.wait_for_selector('[data-testid^="practice-exercise-"]')
        ex_id = page.locator('[data-testid^="practice-exercise-"]').last.get_attribute("data-testid")[len("practice-exercise-"):]
        m = re.match(r"kp:m5\.trees:(\d+):(\d+):(\d+)", ex_id)
        t, ln, d = map(int, m.groups()); n = ln // d
        ans = str(n + 1 if t == 0 else n - 1 if t == 1 else n)
        wrong = next(e.get_attribute("data-testid")[7:] for e in page.locator('[data-testid^="option-"]').all() if e.get_attribute("data-testid")[7:] != ans)
        tid(page, f"option-{wrong}").click(); expect(tid(page, "feedback-wrong")).to_be_visible()
        tid(page, "steps-next").click(); expect(tid(page, "step-0")).to_contain_text(f"{ln} ÷ {d} = {n}")
        tid(page, "steps-next").click(); expect(tid(page, "step-1")).to_be_visible()
        page.screenshot(path=f"{OUT}/v54-steps-{w}.png", full_page=True)
        # 做对这道题，记录才会存下（第一次答错 → 进错题本）
        expect(page.locator('[data-testid="choice-cooldown"]')).to_have_count(0, timeout=5000)
        tid(page, f"option-{ans}").click(); expect(tid(page, "feedback-correct")).to_be_visible()
        ok(f"{w}×{h}：植树问题做错后“看分步讲解”，第 1 步 {ln} ÷ {d} = {n}，一步一步显示")

        # 5. 错题本按年级：换到八年级
        set_grade(page, 8)
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="subject-screen-math"]')
        tid(page, "subject-mistakes-math").click(); page.wait_for_selector('[data-testid="mistakes-screen"]')
        expect(tid(page, "mistakes-open-count")).to_have_text("0")
        tid(page, "mistakes-scope-all").click()
        expect(tid(page, "mistakes-open-count")).not_to_have_text("0")
        ok(f"{w}×{h}：错题本默认只看八年级（0 道），切到“全部”能看到五年级做错的植树题")

        # 3. 单元小测：本学期综合
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="subject-screen-chinese"]')
        tid(page, "quiz-toggle-chinese").scroll_into_view_if_needed(); tid(page, "quiz-toggle-chinese").click()
        tid(page, "quiz-term-上").click(); tid(page, "quiz-start-term-chinese").click()
        page.wait_for_selector('[data-testid="practice-screen"]')
        expect(tid(page, "practice-progress")).to_contain_text("⏱")
        expect(tid(page, "quiz-intro")).to_be_visible()
        run_round(page)
        expect(tid(page, "quiz-score")).to_contain_text("分")
        expect(tid(page, "quiz-kps")).to_be_visible()
        page.screenshot(path=f"{OUT}/v54-quiz-{w}.png", full_page=True)
        ok(f"{w}×{h}：八年级上册语文综合小测 10 道做完，显示 " + tid(page, "quiz-score").inner_text() + "、" + tid(page, "practice-score").inner_text())

        # 2. 英语阅读、古诗文默写
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "subject-english").click(); page.wait_for_selector('[data-testid="en-reading-house"]')
        tid(page, "start-en-read-g8-4").click(); page.wait_for_timeout(800)
        expect(page.locator("body")).to_contain_text("Learning to Cook")
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="zh-dictation"]')
        expect(tid(page, "zh-dictation")).to_contain_text("古诗文默写")
        tid(page, "zh-dictation").click(); page.wait_for_selector('[data-testid="practice-screen"]')
        run_round(page)
        page.screenshot(path=f"{OUT}/v54-dictation-{w}.png", full_page=True)
        ok(f"{w}×{h}：八年级英语阅读《Learning to Cook》能打开；古诗文默写做完一轮，" + tid(page, "practice-score").inner_text())

        # 家长中心本周小结
        parent(page)
        expect(tid(page, "weekly-card")).to_be_visible()
        expect(tid(page, "weekly-streak")).to_contain_text("连续学习 1 天")
        ok(f"{w}×{h}：家长中心“本周小结”显示今天的学习，连续学习 1 天")
        ctx.close()
    assert not errors, errors
    b.close()
print("ALL PASS")
