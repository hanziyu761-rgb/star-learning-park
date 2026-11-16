"""
V5.2 端到端验收（网页版）：七～九年级练习
1. 七年级数学：学科页有“章节练习”（七年级上下册 12 章），一年级课程收起；《有理数的运算》先讲解再练一整轮（填数题按题目重新计算答案，键盘有负号键）
2. 七年级口算：只显示初中口算 + 六年级分数口算；“有理数加法”做完一轮
3. 八年级语文：“单元练习”、阅读小屋 4 篇八年级短文（读完一篇做题）；《山水古文与唐诗》练一整轮
4. 八年级英语：“语法闯关”，《Comparatives》讲解读英语、练一整轮（指令是英文）
5. 九年级：知识地图显示九年级；单词卡有“九年级”；每日挑战能做；试卷九年级上册数学按章选《一元二次方程》生成
6. V5.2.3：学科页“接着学”不推荐一年级的复习；“今日一练”出本年级的题；游戏乐园三个游戏用初中内容；教材资源库打开初中课本
每次都检查页面不超出屏幕宽度、没有页面报错
"""
import os, re
import sys as _sys, os as _os
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
from tts_spy import tts_spy
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
def ok(m): print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first
def no_overflow(page): assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "页面超出屏幕宽度"

def gate(page):
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')

def set_grade(page, g):
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    gate(page)
    tid(page, "pc-settings").click(); page.wait_for_selector('[data-testid="parent-settings"]')
    tid(page, f"grade-{g}").scroll_into_view_if_needed(); tid(page, f"grade-{g}").click()
    page.wait_for_timeout(300)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

def calc(ex_id):
    """按题目 id 独立算出填数题的答案（只用于有理数运算和初中口算）"""
    parts = ex_id.replace(":in", "").replace("#in", "").split(":")
    if parts[0] == "n":  # 口算 n:a:op:b
        a, op, b = int(parts[1]), parts[2], int(parts[3])
    else:  # kp:m7.a2:add:a:b
        k = parts[2]
        if k == "pow":
            a, n, neg = int(parts[3]), int(parts[4]), parts[5] == "1"
            return str(-((-a) ** n) if neg else a ** n)
        a, b = int(parts[3]), int(parts[4])
        op = {"add": "+", "sub": "-", "mul": "×", "div": "÷"}[k]
    v = {"+": a + b, "-": a - b, "×": a * b, "÷": a // b if a % b == 0 else a / b}[op]
    return str(int(v))

def solve_current(page, ex_id, saw_minus):
    if page.locator('[data-testid="input-display"]').count():
        assert tid(page, "num--").count() == 1, "初中填数题应当有负号键"
        saw_minus.append(True)
        for ch in calc(ex_id): tid(page, f"num-{ch}").click()
        tid(page, "num-ok").click()
    else:
        # 上一题的“答对了”提示条可能还没消失，先等它消失再答（否则会误以为已经答对）
        expect(page.locator('[data-testid="feedback-correct"]')).to_have_count(0, timeout=5000)
        opts = page.locator('[data-testid^="option-"], [data-testid^="tf-"]')
        for _ in range(opts.count()):
            if page.locator('[data-testid="feedback-correct"]').count(): break
            expect(page.locator('[data-testid="choice-cooldown"]')).to_have_count(0, timeout=5000)
            nxt = next((opts.nth(i) for i in range(opts.count()) if opts.nth(i).is_enabled()), None)
            if nxt is None: break
            nxt.click(); page.wait_for_timeout(250)
    expect(tid(page, "feedback-correct")).to_be_visible()

def practice_round(page):
    seen, saw_minus = [], []
    for _ in range(25):
        page.wait_for_selector('[data-testid^="practice-exercise-"], [data-testid="practice-summary"]')
        page.wait_for_timeout(150)
        if page.locator('[data-testid="practice-summary"]').count(): break
        ex_id = page.locator('[data-testid^="practice-exercise-"]').last.get_attribute("data-testid")[len("practice-exercise-"):]
        solve_current(page, ex_id, saw_minus)
        seen.append(ex_id)
        tid(page, "practice-next").click()
    page.wait_for_selector('[data-testid="practice-summary"]')
    return seen, len(saw_minus)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    errors = []
    for (w, h) in [(390, 820), (1280, 800)]:
        ctx = b.new_context(viewport={"width": w, "height": h})
        ctx.add_init_script(tts_spy("obj"))
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))

        # 1. 七年级数学
        set_grade(page, 7)
        tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="junior-kps"]')
        expect(tid(page, "junior-kps")).to_contain_text("章节练习")
        expect(tid(page, "junior-kps")).to_contain_text("七年级")
        assert page.locator('[data-testid^="jkp-m7."]').count() == 12
        assert page.locator('[data-testid^="start-math-"]').count() == 0, "一年级课程应当收起"
        tid(page, "primary-toggle").click()
        assert page.locator('[data-testid^="start-math-"]').count() >= 1
        tid(page, "primary-toggle").click()
        expect(tid(page, "bank-section")).to_contain_text("七年级")
        no_overflow(page)
        page.screenshot(path=f"{OUT}/v52-math7-{w}.png", full_page=True)
        ok(f"{w}×{h}：七年级数学学科页有 12 章“章节练习”，一年级课程收进按钮（展开能看到），题库是七年级")

        tid(page, "jkp-m7.a2").scroll_into_view_if_needed(); tid(page, "jkp-m7.a2").click()
        page.wait_for_selector('[data-testid="teach-panel"]')
        expect(tid(page, "teach-panel")).to_contain_text("相反数")
        tid(page, "teach-skip").click(); page.wait_for_selector('[data-testid="teach-panel"]', state="detached")
        seen, minus = practice_round(page)
        assert all(s.startswith("kp:m7.a2:") for s in seen), seen
        assert minus >= 2, "应当有自己填数的题"
        page.screenshot(path=f"{OUT}/v52-math7-summary-{w}.png")
        ok(f"{w}×{h}：《有理数的运算》先看讲解再练 {len(seen)} 道（{minus} 道自己填数，按题目重新计算答案；键盘有负号键）")

        # 2. 七年级口算
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="oral-section"]')
        expect(page.locator('[data-testid="oral-add10"]')).to_have_count(0)
        tid(page, "oral-ratadd").scroll_into_view_if_needed(); tid(page, "oral-ratadd").click()
        seen, minus = practice_round(page)
        assert len(seen) == 10 and minus == 5, (len(seen), minus)
        ok(f"{w}×{h}：七年级口算只有初中和六年级分数口算；“有理数加法”10 题做完（5 题自己填数）")

        # 3. 八年级语文
        set_grade(page, 8)
        tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="junior-kps"]')
        expect(tid(page, "junior-kps")).to_contain_text("单元练习")
        assert page.locator('[data-testid^="jkp-c8."]').count() == 12
        expect(tid(page, "reading-progress")).to_have_text("0/4")
        tid(page, "start-zh-read-g8-2").scroll_into_view_if_needed(); tid(page, "start-zh-read-g8-2").click()
        page.wait_for_selector('[data-testid="read-passage"]')
        expect(tid(page, "read-passage")).to_contain_text("北斗")
        tid(page, "lesson-next").click()
        n = 0
        while not page.locator('[data-testid="lesson-summary"]').count():
            page.wait_for_timeout(200)
            sorts = page.locator('[data-testid^="sort-"]:not([data-testid="sort-answer"])')
            if sorts.count():
                m = sorts.count()
                for _ in range(m):
                    for i in range(m):
                        if page.locator('[data-testid="feedback-correct"]').count(): break
                        sorts.nth(i).click(); page.wait_for_timeout(150)
            else:
                solve_current(page, "", [])
            expect(tid(page, "feedback-correct")).to_be_visible()
            n += 1
            tid(page, "lesson-next").click(); page.wait_for_timeout(250)
        assert n == 3
        ok(f"{w}×{h}：八年级语文有 12 个“单元练习”；阅读小屋 4 篇八年级短文，《北斗为什么能定位》读完做 3 道题")
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "subject-chinese").click(); page.wait_for_selector('[data-testid="junior-kps"]')
        tid(page, "jkp-c8.a3").scroll_into_view_if_needed(); tid(page, "jkp-c8.a3").click()
        page.wait_for_selector('[data-testid="teach-panel"]')
        tid(page, "teach-skip").click()
        seen, _ = practice_round(page)
        assert len(seen) >= 8 and all(s.startswith("kp:c8.a3:") for s in seen), seen
        ok(f"{w}×{h}：《山水古文与唐诗》练 {len(seen)} 道原创题")

        # 4. 八年级英语
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        page.evaluate("window.__spoken = []")
        tid(page, "subject-english").click(); page.wait_for_selector('[data-testid="junior-kps"]')
        expect(tid(page, "junior-kps")).to_contain_text("语法闯关")
        tid(page, "jkp-e8.a1").scroll_into_view_if_needed(); tid(page, "jkp-e8.a1").click()
        page.wait_for_selector('[data-testid="teach-panel"]')
        expect(tid(page, "teach-panel")).to_contain_text("taller than")
        tid(page, "teach-skip").click()
        page.wait_for_selector('[data-testid^="practice-exercise-"]')
        expect(tid(page, "practice-screen")).to_contain_text("Choose the best answer.")
        seen, _ = practice_round(page)
        spoken = page.evaluate("window.__spoken")
        assert any(s["lang"] == "en-US" for s in spoken), spoken[:5]
        ok(f"{w}×{h}：八年级英语“语法闯关”；《Comparatives》讲解读英语，练 {len(seen)} 道，题目指令是英文")

        # 5. 九年级
        set_grade(page, 9)
        tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
        expect(tid(page, "map-grade-label")).to_contain_text("九年级")
        tid(page, "map-subject-math").click(); page.wait_for_timeout(200)
        expect(tid(page, "kp-m9.a1")).to_be_visible()
        no_overflow(page)
        page.screenshot(path=f"{OUT}/v52-map9-{w}.png", full_page=True)
        ok(f"{w}×{h}：知识地图默认九年级，能看到九年级的知识点")

        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "subject-english").click(); page.wait_for_selector('[data-testid="words-entry"]')
        tid(page, "words-entry").click(); page.wait_for_selector('[data-testid="wc-screen"]')
        tid(page, "wc-grade-9").click(); page.wait_for_timeout(300)
        expect(tid(page, "wc-screen")).to_contain_text("Health and feelings")
        ok(f"{w}×{h}：单词卡有“九年级”，打开是初中话题单元")

        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "challenge-entry").click(); page.wait_for_selector('[data-testid="challenge-screen"]')
        # 每日挑战按日期换题型（选择、排序、多选等），等题目出来即可
        page.wait_for_selector('[data-testid^="challenge-exercise-"]')
        no_overflow(page)
        page.screenshot(path=f"{OUT}/v52-challenge9-{w}.png", full_page=True)
        ok(f"{w}×{h}：九年级每日挑战能打开出题")

        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        gate(page)
        tid(page, "exam-entry").scroll_into_view_if_needed(); tid(page, "exam-entry").click()
        page.wait_for_selector('[data-testid="exam-screen"]')
        expect(tid(page, "exam-grade-9")).to_be_visible()
        tid(page, "exam-grade-9").click(); tid(page, "exam-term-上").click()
        tid(page, "exam-kp-m9.a1").click()
        tid(page, "exam-size-20").click()
        tid(page, "exam-generate").click(); page.wait_for_selector('[data-testid="exam-preview"]')
        assert page.locator('[data-testid="exam-item"]').count() == 20
        expect(tid(page, "exam-preview")).to_contain_text("九年级上册数学")
        no_overflow(page)
        page.screenshot(path=f"{OUT}/v52-exam9-{w}.png", full_page=True)
        ok(f"{w}×{h}：试卷九年级上册数学，按章选《一元二次方程》，生成 20 题")

        # 6. V5.2.3：按年级出内容
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="daily-mix-math"]')
        expect(tid(page, "next-math")).not_to_contain_text("数到")
        expect(tid(page, "daily-mix-math")).to_contain_text("九年级")
        tid(page, "daily-mix-math").click()
        page.wait_for_selector('[data-testid^="practice-exercise-"]')
        ex_id = page.locator('[data-testid^="practice-exercise-"]').last.get_attribute("data-testid")[len("practice-exercise-"):]
        assert ex_id.startswith("kp:m9."), ex_id
        expect(tid(page, "practice-screen")).to_contain_text("今日一练")
        ok(f"{w}×{h}：九年级数学“接着学”是九年级内容；“今日一练”出九年级的题（{ex_id}）")
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "games-entry").click(); page.wait_for_selector('[data-testid="games-screen"]')
        expect(tid(page, "games-meta-kitchen")).to_contain_text("第 9 档")
        expect(tid(page, "games-meta-fish")).to_contain_text("第 5 档")
        tid(page, "games-start-kitchen").click(); page.wait_for_selector('[data-testid="kitchen-target"]')
        assert "²" in tid(page, "kitchen-target").inner_text()
        page.screenshot(path=f"{OUT}/v523-kitchen-{w}.png")
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "games-entry").click(); page.wait_for_selector('[data-testid="games-screen"]')
        tid(page, "games-start-fish").click(); page.wait_for_selector('[data-testid="fish-sentence"]')
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        gate(page)
        tid(page, "parent-textbooks").scroll_into_view_if_needed(); tid(page, "parent-textbooks").click()
        page.wait_for_selector('[data-testid="textbooks-screen"]')
        expect(tid(page, "tb-book-title")).to_contain_text("（初中） · 九年级")
        ok(f"{w}×{h}：游戏乐园初中档（小厨房平方凑平方、钓鱼易读错的字）；教材资源库直接打开初中九年级课本")
        # V5.2.6：年级下拉框一～九年级都有；选三年级换回小学课本，再选八年级打开初中课本
        tid(page, "tb-dd-grade").click(); tid(page, "tb-dd-grade-opt-3").click()
        expect(tid(page, "tb-book-title")).to_have_text(re.compile(r"^统编版 · 三年级"))
        tid(page, "tb-dd-grade").click()
        for x in range(1, 10): expect(tid(page, f"tb-dd-grade-opt-{x}")).to_have_count(1)
        tid(page, "tb-dd-grade-opt-8").click()
        expect(tid(page, "tb-book-title")).to_contain_text("统编版（初中） · 八年级")
        n_units = page.locator('[data-testid="tb-unit"]').count()
        assert n_units >= 6, n_units
        page.screenshot(path=f"{OUT}/v526-textbook-g8-{w}.png")
        ok(f"{w}×{h}：教材资源库年级下拉框有一～九年级；选三年级打开小学统编版，选八年级打开初中统编版（{n_units} 个单元）")
        ctx.close()
    assert not errors, errors
    b.close()
print("ALL PASS")
