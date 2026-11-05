"""
知识图谱学习闭环端到端验收（一年级数学，原创题目）：
互动课程 → 知识小地图状态变化 → 知识点练习反复出错 → 出现“找找原因” → 找原因小游戏找到根因
→ 去练根因 → 家长中心看到掌握情况、诊断结论、推荐复习计划与判断依据 → 重新打开数据仍在。
"""
import os, re, json
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
def ok(m): print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first

SPY = """
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 30);
}
"""

def answer_of(exercise_id):
    """根据题目 id（kp:知识点:签名）算出正确答案 —— 与 src/knowledge/generators.ts 的规则一致"""
    _, kp, sig = exercise_id.split(":", 2)
    m = re.match(r"^(\d+)([+-])(\d+)$", sig)
    if m:
        a, b = int(m[1]), int(m[3]); return a + b if m[2] == "+" else a - b
    parts = sig.split(":")
    if kp in ("m1.count5", "m1.count10"): return int(parts[0])
    if kp in ("m1.count20", "m1.count100"): return int(parts[0]) * 10 + int(parts[1])
    if kp in ("m1.compose5", "m1.compose10"): return int(parts[0]) - int(parts[1])
    if kp == "m1.make10": return 10 - int(sig)
    if kp == "m1.zero": return 0
    if kp == "m1.compare10": return max(int(parts[0]), int(parts[1]))
    if kp == "m1.wordprob10":
        a, b = int(parts[1]), int(parts[2]); return a + b if parts[0] in ("fly-in", "join") else a - b
    raise ValueError(exercise_id)

def current_id(page, prefix):
    el = page.locator(f'[data-testid^="{prefix}"]').last
    return el.get_attribute("data-testid")[len(prefix):]


def type_in(page, s):
    """自己填数题：按数字键输入，再点“确定”"""
    for ch in str(s).replace("……", "余"): tid(page, f"num-{ch}").click()
    tid(page, "num-ok").click()

def solve(page, ex_id, correct_first):
    if ex_id.endswith(":in"):
        ans = answer_of(ex_id[:-3])
        if not correct_first:
            type_in(page, f"{ans}1"); expect(tid(page, "feedback-wrong")).to_be_visible()
        type_in(page, ans); expect(tid(page, "feedback-correct")).to_be_visible()
        return
    ans = answer_of(ex_id)
    opts = [e.get_attribute("data-testid")[7:] for e in page.locator('[data-testid^="option-"]').all()]
    if not correct_first:
        wrong = next(o for o in opts if o != str(ans))
        tid(page, f"option-{wrong}").click(); page.wait_for_timeout(100)
    tid(page, f"option-{ans}").click()
    expect(tid(page, "feedback-correct")).to_be_visible()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 780}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    # 1. 知识小地图：初始全部“还没学”
    tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
    expect(tid(page, "map-learned")).to_contain_text("学会了 0 / 24")
    page.screenshot(path=f"{OUT}/k-01-map-empty.png")
    ok("知识小地图：24 个本领，初始学会 0 个")

    # 2. 知识点练习：10 以内加法，故意大多数第一次答错（模拟不熟练）
    tid(page, "kp-m1.add10").click(); page.wait_for_selector('[data-testid="kp-card"]')
    expect(tid(page, "kp-diagnose")).to_have_count(0)
    tid(page, "kp-practice").click(); page.wait_for_selector('[data-testid="practice-screen"]')
    for i in range(10):
        page.wait_for_timeout(150)
        solve(page, current_id(page, "practice-exercise-"), correct_first=(i % 4 == 0))
        tid(page, "practice-next").click()
    page.wait_for_selector('[data-testid="practice-summary"]')
    ok("知识点练习（10 以内加法）完成 10 题：" + tid(page, "practice-score").inner_text())
    tid(page, "practice-home").click(); page.wait_for_selector('[data-testid="home"]')

    # 3. 小地图上出现“要复习的本领 / 找原因”
    expect(tid(page, "map-todo-count")).to_be_visible()
    tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
    expect(tid(page, "todo-m1.add10")).to_be_visible()
    page.screenshot(path=f"{OUT}/k-02-map-todo.png")
    ok("反复出错后：首页提示、知识小地图“今天要复习的本领”出现 10 以内加法")

    # 4. 找原因小游戏：模拟孩子 —— 10 以内的分与合不会，其它都会
    tid(page, "kp-m1.add10").click()
    tid(page, "kp-diagnose").click(); page.wait_for_selector('[data-testid="diagnose-intro"]')
    tid(page, "diagnose-start").click()
    asked = []
    for _ in range(20):
        page.wait_for_timeout(200)
        if page.locator('[data-testid="diagnose-summary"]').count(): break
        ex_id = current_id(page, "diag-exercise-")
        kp = ex_id.split(":")[1]; asked.append(kp)
        if len(asked) == 1: page.screenshot(path=f"{OUT}/k-03-diagnose.png")
        solve(page, ex_id, correct_first=kp not in ("m1.add10", "m1.compose10"))
        tid(page, "diagnose-next").click()
    page.wait_for_selector('[data-testid="diagnose-summary"]')
    expect(tid(page, "diagnose-root")).to_contain_text("分")
    page.screenshot(path=f"{OUT}/k-04-diagnose-result.png")
    ok(f"找原因：共 {len(asked)} 题，依次检查 {' → '.join(dict.fromkeys(asked))}；找到根因“10 的分与合”")

    # 5. 去练根因
    tid(page, "diagnose-practice").click(); page.wait_for_selector('[data-testid="practice-screen"]')
    first = current_id(page, "practice-exercise-")
    assert first.startswith("kp:m1.compose10:"), first
    ok("从诊断结果直接进入“10 的分与合”练习")
    for i in range(10):
        page.wait_for_timeout(150)
        solve(page, current_id(page, "practice-exercise-"), correct_first=True)
        tid(page, "practice-next").click()
    page.wait_for_selector('[data-testid="practice-summary"]')
    tid(page, "practice-home").click(); page.wait_for_selector('[data-testid="home"]')

    # 6. 家长中心
    tid(page, "parent-entry").click()
    page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="knowledge-card"]')
    card = tid(page, "knowledge-card")
    card.scroll_into_view_if_needed()
    expect(tid(page, "diag-row")).to_contain_text("需要先补：10 以内数的分与合")
    recs = page.locator('[data-testid="kp-rec"]').all_inner_texts()
    nm = page.locator('[data-testid="kp-not-mastered"]').all_inner_texts()
    page.locator('[data-testid="kp-not-mastered"]').first.click()
    page.wait_for_timeout(200)
    card.screenshot(path=f"{OUT}/k-05-parent-knowledge.png")
    ok("家长中心·前置薄弱点：需要先补 10 以内数的分与合")
    ok("家长中心·推荐复习计划：" + " / ".join(r.replace("\n", " ") for r in recs[:4]))
    ok("家长中心·尚未掌握：" + " / ".join(" ".join(x.split("\n")[1:2]) for x in nm))
    ok("掌握状态计数：" + "，".join(tid(page, f"count-{s}").inner_text() for s in ["not-started", "learning", "emerging", "needs-review", "stable"]))

    # 7. 重新打开
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
    learned = tid(page, "map-learned").inner_text()
    page.screenshot(path=f"{OUT}/k-06-map-after.png", full_page=True)
    ok("重新打开后知识小地图仍保留状态：" + learned)
    print(json.dumps({"errors": errors}, ensure_ascii=False))
    b.close()
