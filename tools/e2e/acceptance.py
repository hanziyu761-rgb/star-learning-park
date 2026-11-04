"""
端到端验收脚本（网页版，手机尺寸 360x640）。
真实点击、真实鼠标拖动，并记录语音合成调用。
"""
import re, sys, time, json
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:8081"
import os
OUT = os.environ.get("OUT", "shots")
os.makedirs(OUT, exist_ok=True)
log = []

def ok(msg):
    log.append("PASS " + msg); print("PASS", msg, flush=True)

SPY = """
window.__spoken = [];
const orig = window.speechSynthesis && window.speechSynthesis.speak.bind(window.speechSynthesis);
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => {
    window.__spoken.push({text: u.text, lang: u.lang});
    // 无头浏览器没有发音引擎：立即触发结束回调，模拟朗读完成
    setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 50);
  };
}
"""

def tid(page, t):
    return page.locator(f'[data-testid="{t}"]').first

def wait_next(page, timeout=15000):
    btn = tid(page, "lesson-next")
    expect(btn).not_to_have_attribute("aria-disabled", "true", timeout=timeout)
    return btn

def click_next(page):
    wait_next(page).click()
    page.wait_for_timeout(400)

def drag(page, src, dst):
    a = src.bounding_box(); b = dst.bounding_box()
    page.mouse.move(a["x"] + a["width"]/2, a["y"] + a["height"]/2)
    page.mouse.down()
    steps = 12
    for i in range(1, steps+1):
        page.mouse.move(a["x"] + a["width"]/2 + (b["x"] + b["width"]/2 - a["x"] - a["width"]/2) * i/steps,
                        a["y"] + a["height"]/2 + (b["y"] + b["height"]/2 - a["y"] - a["height"]/2) * i/steps)
        page.wait_for_timeout(16)
    page.mouse.up()
    page.wait_for_timeout(500)

def spoken(page):
    return page.evaluate("window.__spoken")

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 360, "height": 640}, device_scale_factor=2, has_touch=False)
    ctx.add_init_script(SPY)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append("console.error: " + m.text) if m.type == "error" else None)

    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/01-home-empty.png", full_page=True)
    expect(tid(page, "total-stars")).to_contain_text("0")
    ok("首页加载，初始星星 0")

    # ---------- 家长中心：空状态 ----------
    tid(page, "parent-entry").click()
    page.wait_for_selector('[data-testid="parent-gate"]')
    q = tid(page, "gate-question").inner_text()
    a, b = map(int, re.findall(r"\d+", q)[:2])
    # 先输入错误答案
    tid(page, "key-1").click(); tid(page, "key-确定").click()
    expect(page.get_by_text("答案不对")).to_be_visible()
    ok("家长验证：错误答案被拒绝")
    q = tid(page, "gate-question").inner_text()
    a, b = map(int, re.findall(r"\d+", q)[:2])
    for d in str(a*b): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click()
    page.wait_for_selector('[data-testid="parent-dashboard"]')
    expect(page.get_by_text("还没有学习记录。孩子完成课程")).to_be_visible()
    page.screenshot(path=f"{OUT}/02-parent-empty.png", full_page=True)
    ok("家长中心空状态（无假数据）")
    tid(page, "back").click(); page.wait_for_selector('[data-testid="home"]')

    # ---------- 数学课 ----------
    tid(page, "subject-math").click()
    page.wait_for_selector('[data-testid="subject-screen-math"]')
    page.screenshot(path=f"{OUT}/03-subject-math.png", full_page=True)
    tid(page, "start-math-add-within-5").click()
    page.wait_for_selector('[data-testid="count-demo"]')
    page.wait_for_timeout(2500)
    page.screenshot(path=f"{OUT}/04-math-count-demo.png")
    click_next(page)  # 1 数数演示（等待动画结束）
    ok("数学 1：数数演示完成")

    # 2 拖进篮子：真实鼠标拖动 3 次
    page.wait_for_selector('[data-testid="basket"]')
    for i in range(3):
        drag(page, tid(page, "apple-0"), tid(page, "basket"))
    expect(tid(page, "basket-count")).to_have_text("3")
    page.screenshot(path=f"{OUT}/05-math-drag-basket.png")
    click_next(page)
    ok("数学 2：鼠标拖动 3 个苹果进篮子，计数=3")

    # 3 合起来：拖 1 个，点 4 个
    drag(page, tid(page, "combine-L-0"), tid(page, "basket"))
    for _ in range(4):
        page.locator('[data-testid^="combine-"]').first.click(); page.wait_for_timeout(150)
    tid(page, "num-4").click()   # 故意答错
    expect(tid(page, "feedback-wrong")).to_be_visible()
    page.screenshot(path=f"{OUT}/06-math-combine-wrong.png")
    tid(page, "num-5").click()
    expect(tid(page, "feedback-correct")).to_be_visible()
    click_next(page)
    ok("数学 3：合起来 2+3，先答错有提示，再答对")

    # 4 数草莓
    tid(page, "option-4").click(); expect(tid(page, "feedback-correct")).to_be_visible(); click_next(page)
    # 5 比多少
    tid(page, "option-five").click(); click_next(page)
    # 6 拖动配对：拖 2 个，点选 1 个
    drag(page, tid(page, "drag-3"), tid(page, "target-3"))
    drag(page, tid(page, "drag-2"), tid(page, "target-5"))  # 错误拖放
    expect(tid(page, "feedback-wrong")).to_be_visible()
    drag(page, tid(page, "drag-2"), tid(page, "target-2"))
    page.screenshot(path=f"{OUT}/07-math-drag-match.png")
    tid(page, "drag-5").click(); tid(page, "target-5").click()
    expect(tid(page, "feedback-correct")).to_be_visible()
    click_next(page)
    ok("数学 6：拖动配对（含一次错误拖放被弹回）")
    # 7 1+4
    tid(page, "option-5").click(); click_next(page)
    # 8 判断
    tid(page, "tf-false").click(); click_next(page)
    # 9 排序
    for n in ["1", "2", "3", "4", "5"]:
        tid(page, f"sort-{n}").click()
    page.screenshot(path=f"{OUT}/08-math-sort.png")
    click_next(page)
    ok("数学 9：排序")
    # 10 开放题：3 苹果 + 2 梨
    for _ in range(3): tid(page, "pile-A").click(); page.wait_for_timeout(100)
    for _ in range(2): tid(page, "pile-B").click(); page.wait_for_timeout(100)
    tid(page, "open-check").click()
    expect(tid(page, "found-list")).to_be_visible()
    page.screenshot(path=f"{OUT}/09-math-open.png", full_page=True)
    click_next(page)
    page.wait_for_selector('[data-testid="lesson-summary"]')
    page.wait_for_timeout(600)
    page.screenshot(path=f"{OUT}/10-math-summary.png")
    score = tid(page, "summary-score").inner_text()
    ok(f"数学课完成，小结：{score}")
    tid(page, "summary-home").click(); page.wait_for_selector('[data-testid="home"]')
    stars_after_math = re.findall(r"\d+", tid(page, "total-stars").inner_text())[0]
    ok(f"返回首页，星星 = {stars_after_math}")

    # ---------- 语文课：听读互动 ----------
    tid(page, "subject-chinese").click()
    tid(page, "start-chinese-ri-yue-shui-huo").click()
    page.wait_for_selector('[data-testid="card-ri"]')
    before = len(spoken(page))
    for c in ["ri", "yue", "shui", "huo", "shan"]:
        tid(page, f"card-{c}").click(); page.wait_for_timeout(120)
    sp = spoken(page)[before:]
    zh_spoken = [s for s in sp if s["lang"] == "zh-CN"]
    assert any("日" in s["text"] for s in zh_spoken), sp
    page.screenshot(path=f"{OUT}/11-chinese-cards.png")
    ok("语文：点击汉字触发中文朗读 → " + "、".join(s["text"] for s in zh_spoken[-5:]))
    click_next(page)
    # 汉字配对，中途退出测试“继续学习”
    drag(page, tid(page, "drag-ri"), tid(page, "target-ri"))
    page.screenshot(path=f"{OUT}/12-chinese-drag.png")
    tid(page, "lesson-exit").click()
    page.wait_for_selector('[data-testid="subject-screen-chinese"]')
    expect(tid(page, "resume-chinese-ri-yue-shui-huo")).to_be_visible()
    ok("中途退出回到学科页，出现“继续学习”按钮")
    tid(page, "back").click()
    page.wait_for_selector('[data-testid="home"]')

    # ---------- 关闭后重新打开 ----------
    page.reload(); page.wait_for_selector('[data-testid="home"]'); page.wait_for_timeout(500)
    expect(tid(page, "total-stars")).to_contain_text(stars_after_math)
    expect(tid(page, "continue-card")).to_be_visible()
    page.screenshot(path=f"{OUT}/13-home-after-reload.png", full_page=True)
    ok("重新打开后：星星保留、显示“继续学习”")
    tid(page, "continue-card").click()
    expect(tid(page, "step-no")).to_have_text(re.compile(r"^2/"))
    ok("继续学习：回到语文第 2 步")
    tid(page, "lesson-exit").click(); page.wait_for_selector('[data-testid="home"]')

    # ---------- 英语课：听词汇发音 ----------
    tid(page, "subject-english").click()
    tid(page, "start-english-fruits").click()
    page.wait_for_selector('[data-testid="card-apple"]')
    before = len(spoken(page))
    for w in ["apple", "banana", "orange", "grapes"]:
        tid(page, f"card-{w}").click(); page.wait_for_timeout(120)
    en = [s for s in spoken(page)[before:] if s["lang"] == "en-US"]
    assert [s["text"] for s in en][-4:] == ["apple", "banana", "orange", "grapes"], en
    page.screenshot(path=f"{OUT}/14-english-cards.png")
    ok("英语：点击单词触发英文朗读 apple / banana / orange / grapes")
    click_next(page)
    tid(page, "listen-button").click()
    assert spoken(page)[-1] == {"text": "banana", "lang": "en-US"}
    tid(page, "option-apple").click()
    expect(tid(page, "feedback-wrong")).to_be_visible()
    page.screenshot(path=f"{OUT}/15-english-listen-wrong.png")
    tid(page, "option-banana").click(); click_next(page)
    ok("英语：听音选图（先错后对）")
    tid(page, "lesson-exit").click(); page.wait_for_selector('[data-testid="subject-screen-english"]')
    tid(page, "back").click(); page.wait_for_selector('[data-testid="home"]')

    # ---------- 家长中心：真实数据 ----------
    tid(page, "parent-entry").click()
    q = tid(page, "gate-question").inner_text()
    a, b = map(int, re.findall(r"\d+", q)[:2])
    for d in str(a*b): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click()
    page.wait_for_selector('[data-testid="parent-dashboard"]')
    page.wait_for_timeout(300)
    page.screenshot(path=f"{OUT}/16-parent-data.png", full_page=True)
    acc = tid(page, "acc-math").inner_text()
    sessions = page.locator('[data-testid="session-row"]').count()
    mistakes = page.locator('[data-testid="mistake-row"]').count()
    ok(f"家长中心：数学一次答对率 {acc}，最近课程 {sessions} 条，错题 {mistakes} 条")
    assert sessions == 1, sessions

    print(json.dumps({"errors": errors}, ensure_ascii=False, indent=1))
    browser.close()

open(f"{OUT}/result.txt", "w").write("\n".join(log))
