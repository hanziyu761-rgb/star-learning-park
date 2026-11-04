"""
V2 端到端验收：家长设置 AI 老师 → 问问星星宝 → 口算闯关 → 题库闯关（含 AI 提示/讲解、屏蔽问题题目）
→ 今日复习出现题库错题 → 家长中心 AI 学习分析。

AI 服务使用本地 MOCK 模式（server/ai-worker: MOCK_LLM=1 node dev-server.mjs，端口 8788），
只验证 APP 与服务之间的接通和界面流程，不代表真实 DeepSeek 回答质量。
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("BASE", "http://localhost:8081")
AI = os.environ.get("AI", "http://localhost:8788")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
log = []
def ok(m): log.append(m); print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first

SPY = """
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 30);
}
"""

def gate(page):
    page.wait_for_selector('[data-testid="parent-gate"]')
    a, b = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * b): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click()
    page.wait_for_selector('[data-testid="parent-dashboard"]')

def answer_until_correct(page, book_unit):
    """依次尝试直到答对；排序题根据题库数据给出正确顺序"""
    page.wait_for_timeout(250)
    if page.locator('[data-testid="sort-0"]').count():
        first = tid(page, "sort-0").inner_text()
        for q in book_unit["questions"]:
            if q["t"] == "order" and q["o"][0] in first.replace("\n", ""):
                for i in q["a"]: tid(page, f"sort-{i}").click()
                break
        else:
            raise AssertionError("找不到排序题")
    elif page.locator('[data-testid="tf-true"]').count():
        tid(page, "tf-true").click()
        if not page.locator('[data-testid="feedback-correct"]').count():
            page.wait_for_timeout(150); tid(page, "tf-false").click()
    else:
        i = 0
        while not page.locator('[data-testid="feedback-correct"]').count():
            tid(page, f"option-{i}").click(); page.wait_for_timeout(120); i += 1
    expect(tid(page, "feedback-correct")).to_be_visible()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 760}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    expect(tid(page, "teacher-entry")).to_have_count(0)
    ok("默认未开启 AI：首页没有“问问星星宝”入口")

    # ---------- 家长开启 AI ----------
    tid(page, "parent-entry").click(); gate(page)
    tid(page, "ai-url").fill(AI)
    tid(page, "ai-test").click()
    expect(tid(page, "ai-check-result")).to_contain_text("连接成功")
    tid(page, "ai-switch").click()
    page.wait_for_timeout(300)
    page.screenshot(path=f"{OUT}/v2-01-parent-ai.png", full_page=True)
    ok("家长中心：填写 AI 服务地址、测试连接成功、开启 AI 老师")
    tid(page, "back").click(); page.wait_for_selector('[data-testid="home"]')

    # ---------- 问问星星宝 ----------
    tid(page, "teacher-entry").click(); page.wait_for_selector('[data-testid="teacher-screen"]')
    page.locator('[data-testid="quick-question"]').first.click()
    expect(page.locator('[data-testid="msg-assistant"]').first).to_contain_text("测试回复")
    page.screenshot(path=f"{OUT}/v2-02-teacher.png")
    ok("问问星星宝：点快捷问题，收到 AI 服务回复并显示")
    tid(page, "back").click(); page.wait_for_selector('[data-testid="home"]')

    # ---------- 口算闯关 ----------
    tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="oral-section"]')
    page.screenshot(path=f"{OUT}/v2-03-math-subject.png", full_page=True)
    tid(page, "oral-add10").click(); page.wait_for_selector('[data-testid="practice-screen"]')
    for i in range(10):
        stem = page.get_by_text(re.compile(r"^\d+ \+ \d+ = \?$")).first.inner_text()
        a, c = map(int, re.findall(r"\d+", stem))
        tid(page, f"option-{a + c}").click()
        expect(tid(page, "feedback-correct")).to_be_visible()
        tid(page, "practice-next").click(); page.wait_for_timeout(150)
    page.wait_for_selector('[data-testid="practice-summary"]')
    expect(tid(page, "practice-score")).to_contain_text("10 / 10")
    ok("口算闯关：10 以内加法 10 题全对，3 颗星")
    tid(page, "practice-home").click(); page.wait_for_selector('[data-testid="home"]')

    # ---------- 题库闯关 ----------
    unit = json.load(open(os.path.join(ROOT, "src/content/bank/math-g1a.json")))["units"][0]
    tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="bank-section"]')
    tid(page, f"unit-{unit['id']}").click(); page.wait_for_selector('[data-testid="practice-screen"]')
    # 第 1 题：先请 AI 提示
    tid(page, "ai-hint").click()
    expect(tid(page, "ai-reply")).to_contain_text("测试回复")
    page.screenshot(path=f"{OUT}/v2-04-bank-hint.png")
    ok("题库闯关：做题前请星星宝提示，收到回复")
    total = int(tid(page, "practice-progress").inner_text().split("/")[1])
    for i in range(total):
        answer_until_correct(page, unit)
        if i == 0:
            tid(page, "ai-explain").click()
            expect(tid(page, "ai-reply")).to_contain_text("测试回复")
            ok("答对后点“为什么呢”，收到讲解")
        tid(page, "practice-next").click(); page.wait_for_timeout(150)
    page.wait_for_selector('[data-testid="practice-summary"]')
    score = tid(page, "practice-score").inner_text()
    ok(f"题库闯关完成一轮（{unit['title']}）：{score}")
    tid(page, "practice-home").click(); page.wait_for_selector('[data-testid="home"]')

    # ---------- 屏蔽问题题目 ----------
    tid(page, "subject-math").click(); tid(page, f"unit-{unit['id']}").click()
    page.wait_for_selector('[data-testid="practice-screen"]')
    box = tid(page, "report-question").bounding_box()
    page.mouse.move(box["x"] + 5, box["y"] + 5); page.mouse.down(); page.wait_for_timeout(1100); page.mouse.up()
    expect(page.get_by_text("已屏蔽这道题")).to_be_visible()
    ok("长按“这题有问题”屏蔽当前题目")
    page.locator('[data-testid="practice-screen"] [data-testid="back"]').click(); page.wait_for_selector('[data-testid="practice-screen"]', state="detached")
    page.wait_for_timeout(500)
    page.locator('[data-testid="subject-screen-math"] [data-testid="back"]').click()
    page.wait_for_selector('[data-testid="home"]')

    # ---------- 今日复习包含题库错题 ----------
    expect(tid(page, "task-review")).to_be_visible()
    tid(page, "task-review").click(); page.wait_for_selector('[data-testid="review-screen"]')
    src_text = page.get_by_text(re.compile("来自：")).first.inner_text()
    ok(f"今日复习出现题库错题（{src_text.strip()}）")
    tid(page, "back").click(); page.wait_for_selector('[data-testid="home"]')

    # ---------- 家长中心 ----------
    tid(page, "parent-entry").click(); gate(page)
    expect(page.get_by_text(re.compile("已屏蔽的题目"))).to_be_visible()
    tid(page, "ai-report").click()
    expect(tid(page, "ai-report-text")).to_contain_text("测试回复")
    page.screenshot(path=f"{OUT}/v2-05-parent-report.png", full_page=True)
    ok("家长中心：AI 学习分析返回结果；显示已屏蔽题目，可一键恢复")
    tid(page, "unhide-all").click()
    expect(page.get_by_text(re.compile("已屏蔽的题目"))).to_have_count(0)

    # ---------- AI 服务不可用时 ----------
    tid(page, "ai-url").fill("http://localhost:9")
    tid(page, "ai-test").click()
    expect(tid(page, "ai-check-result")).to_contain_text("连不上")
    ok("AI 服务不可用时给出友好提示，不影响其它功能")

    page.reload(); page.wait_for_selector('[data-testid="home"]')
    expect(tid(page, "teacher-entry")).to_be_visible()
    ok("重新打开后 AI 开关等设置保留")
    print(json.dumps({"errors": errors}, ensure_ascii=False))
    b.close()
