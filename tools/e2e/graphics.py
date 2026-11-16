"""
V2.1 图形类数学互动课程端到端验收（网页版，真实浏览器 + 真实鼠标拖动）：

1. 数学乐园 →「图形乐园」六个入口（位置 / 平面图形 / 立体图形 / 钟表 / 分类 / 找规律）都能进入并完成；
2. 每个知识点的题库全部做一遍（钟表做 2 轮共 12 题），每类 ≥5 题；
3. 交互：真实拖动（小动物进格子、物品进篮子、图案进空格、拨钟面上的分针和时针）+ 点选替代操作；
4. 反馈：故意先答错 → 出现“再试试”提示，可重试 → 答对出现表扬；
5. 换题后不残留上一题的反馈 / 放置状态；
6. 学习记录：知识小地图状态变化、反复出错的钟表出现“找找原因”并能完成诊断（诊断题也是拨钟等互动题），
   家长中心推荐里出现新知识点；
7. 重新打开网页（重新读取本地存储）后记录仍在；
8. 平板横屏尺寸截图，检查布局。

答案表由测试独立写出（不读取 APP 代码），用来核对界面判定是否正确。
"""
import json
import math
import os
import re

import sys as _sys, os as _os
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import tts_spy  # noqa: F401  V5.1：朗读走云端童声，页面里拦截假服务地址
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
RESULTS = []
def ok(m): RESULTS.append(m); print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first

SPY = """
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 30);
}
"""

# ───────── 独立答案表 ─────────
SOL = {
    "m1.position": {
        "p1": ("place", "cell-0-1", "cell-2-2"), "p2": ("place", "cell-1-2", "cell-1-0"),
        "p3": ("place", "cell-2-1", "cell-0-1"), "p4": ("place", "cell-1-0", "cell-1-2"),
        "p5": ("tap", "cell-1-0", "cell-1-2"), "p6": ("tap", "cell-2-1", "cell-0-1"),
        "p7": ("tap", "cell-1-2", "cell-1-0"),
        "p8": ("choice", "right", "left"), "p9": ("choice", "up", "down"),
    },
    "m1.shapes2d": {
        "s1": ("pick", ["a", "c", "e"], "b"), "s2": ("pick", ["b", "d"], "a"), "s3": ("pick", ["a", "c"], "b"),
        "s4": ("bins", {"i1": "circle", "i2": "triangle", "i3": "rect", "i4": "triangle", "i5": "circle", "i6": "rect"}),
        "s5": ("bins", {"i1": "square", "i2": "rect", "i3": "rect", "i4": "square"}),
        "s6": ("rotate", 2), "s7": ("rotate", 3),
        "s8": ("choice", "rect", "square"), "s9": ("choice", "square", "circle"), "s10": ("choice", "st", "ct"),
    },
    "m1.shapes3d": {
        "d1": ("bins", {"i1": "ball", "i2": "cube", "i3": "ball", "i4": "cube"}),
        "d2": ("bins", {"i1": "cyl", "i2": "cuboid", "i3": "cuboid", "i4": "cyl"}),
        "d3": ("choice", "ball", "box"), "d4": ("choice", "cyl", "ball"), "d5": ("choice", "cube", "cuboid"),
    },
    "m1.classify": {
        "k1": ("bins", {"i1": "red", "i2": "blue", "i3": "blue", "i4": "red", "i5": "blue"}),
        "k2": ("bins", {"i1": "circle", "i2": "triangle", "i3": "circle", "i4": "triangle", "i5": "circle"}),
        "k3": ("bins", {"i1": "food", "i2": "study", "i3": "food", "i4": "study", "i5": "study"}),
        "k4": ("bins", {"i1": "wear", "i2": "play", "i3": "wear", "i4": "play"}),
        "k5": ("tf", True), "k6": ("tf", False),
        "k7": ("choice", "car", "apple"), "k8": ("choice", "c", "a"),
    },
    "m1.pattern": {
        "t1": ("pattern", [(5, "b")], "r"), "t2": ("pattern", [(3, "cir")], "tri"),
        "t3": ("pattern", [(5, "dog")], "cat"), "t4": ("pattern", [(5, "moon"), (6, "star")], "star"),
        "t5": ("pattern", [(5, "grape"), (6, "apple")], "apple"),
        "t6": ("pattern", [(3, "6")], "5"), "t7": ("pattern", [(3, "8")], "7"),
        "t8": ("pattern", [(3, "20")], "16"), "t9": ("pattern", [(3, "7")], "6"),
    },
}
SCENE_HOURS = [7, 8, 12, 9]

def clock_sol(sig):
    t, a = sig.split(":"); n = int(a)
    if t == "set": return ("clock", n)
    if t == "sset": return ("clock", SCENE_HOURS[n])
    if t == "read": return ("choice", str(n), str(n % 12 + 1))
    return ("choice", "right", "swap")

def sol_of(ex_id):
    _, kp, sig = ex_id.split(":", 2)
    if kp == "m1.clock": return clock_sol(sig)
    if kp in SOL: return SOL[kp][sig]
    return ("calc", answer_of(kp, sig))

def answer_of(kp, sig):
    """诊断回溯到计算类知识点时的答案（与 knowledge_loop.py 相同规则）"""
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
    raise ValueError(kp + ":" + sig)

# ───────── 操作 ─────────
def center(loc):
    b = loc.bounding_box(); return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2

def drag(page, src, dst, steps=12):
    (ax, ay), (bx, by) = center(src), center(dst)
    page.mouse.move(ax, ay); page.mouse.down()
    for i in range(1, steps + 1):
        page.mouse.move(ax + (bx - ax) * i / steps, ay + (by - ay) * i / steps); page.wait_for_timeout(16)
    page.mouse.up(); page.wait_for_timeout(450)

def tap_place(page, src, dst):
    src.click(); page.wait_for_timeout(80); dst.click(); page.wait_for_timeout(120)

def put(page, src, dst, use_drag):
    (drag if use_drag else tap_place)(page, src, dst)

def clock_value(page):
    h, m = tid(page, "clock-value").inner_text().split(":"); return int(h), int(m)

def arc(page, cx, cy, r, a0, a1, steps=24):
    """沿钟面圆弧拖动（角度从 12 点方向顺时针计）"""
    pt = lambda a: (cx + r * math.sin(math.radians(a)), cy - r * math.cos(math.radians(a)))
    x, y = pt(a0); page.mouse.move(x, y); page.mouse.down()
    for i in range(1, steps + 1):
        x, y = pt(a0 + (a1 - a0) * i / steps); page.mouse.move(x, y); page.wait_for_timeout(16)
    page.mouse.up(); page.wait_for_timeout(250)

def feedback(page, kind):
    expect(tid(page, f"feedback-{kind}")).to_be_visible(timeout=4000)

def solve(page, ex_id, correct_first, use_drag, notes):
    s = sol_of(ex_id); kind = s[0]
    if kind in ("choice", "calc"):
        ans = str(s[1])
        if not correct_first:
            wrong = s[2] if kind == "choice" else next(
                e.get_attribute("data-testid")[7:] for e in page.locator('[data-testid^="option-"]').all()
                if e.get_attribute("data-testid")[7:] != ans)
            tid(page, f"option-{wrong}").click(); feedback(page, "wrong")
        tid(page, f"option-{ans}").click()
    elif kind == "tf":
        if not correct_first:
            tid(page, "tf-false" if s[1] else "tf-true").click(); feedback(page, "wrong")
        tid(page, "tf-true" if s[1] else "tf-false").click()
    elif kind == "place":
        if not correct_first:
            put(page, tid(page, "mover"), tid(page, s[2]), use_drag); feedback(page, "wrong")
            expect(tid(page, "mover")).to_be_visible()  # 放错弹回，可以再拖
        put(page, tid(page, "mover"), tid(page, s[1]), use_drag)
        expect(tid(page, "mover")).to_have_count(0)
        notes.add("小动物拖进格子" if use_drag else "点小动物再点格子")
    elif kind == "tap":
        if not correct_first:
            tid(page, s[2]).click(); feedback(page, "wrong")
        tid(page, s[1]).click()
    elif kind == "pick":
        if not correct_first:
            tid(page, f"fig-{s[2]}").click(); feedback(page, "wrong")
        for a in s[1]: tid(page, f"fig-{a}").click(); page.wait_for_timeout(60)
    elif kind == "bins":
        mapping = s[1]
        if not correct_first:
            first = next(iter(mapping)); bins = sorted(set(mapping.values()))
            wrong_bin = next(b for b in bins if b != mapping[first])
            put(page, tid(page, f"item-{first}"), tid(page, f"bin-{wrong_bin}"), use_drag); feedback(page, "wrong")
            expect(tid(page, f"item-{first}")).to_be_visible()
        for item, b in mapping.items():
            put(page, tid(page, f"item-{item}"), tid(page, f"bin-{b}"), use_drag)
            expect(tid(page, f"item-{item}")).to_have_count(0)
        notes.add("物品拖进篮子" if use_drag else "点物品再点篮子")
    elif kind == "rotate":
        if not correct_first:
            tid(page, "rotate-check").click(); feedback(page, "wrong")
        for _ in range(s[1]): tid(page, "rotate-piece").click(); page.wait_for_timeout(60)
        tid(page, "rotate-check").click()
    elif kind == "clock":
        target = s[1]
        if not correct_first:
            m_start = clock_value(page)[1]
            tid(page, "clock-check").click(); feedback(page, "wrong")
            han = re.sub(r"[^\u4e00-\u9fff]", "", tid(page, "feedback-wrong").inner_text())
            # 分针不在 12 → 提示分针；分针对了但时针不对 → 提示时针
            assert ("分针要指着十二" if m_start else "短短的时针要指着") in han, han
        h0, m0 = clock_value(page)
        assert m0 == 30 or m0 == 0, (h0, m0)
        if use_drag:
            face = tid(page, "clock-face"); b = face.bounding_box()
            cx, cy = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
            if m0 == 30:
                # 拖动分针：从 6 顺时针拖到 12（经过 9），时针应该跟着进一格
                arc(page, cx, cy, b["width"] * 0.36, 180, 359.5)
                h1, m1 = clock_value(page)
                assert (h1, m1) == (h0 % 12 + 1, 0), f"拖分针后 {h0}:{m0} → {h1}:{m1}"
                notes.add(f"拖分针 {h0}:30→{h1}:00（时针跟着走）")
                h0 = h1
            # 拖动时针：从时针当前位置拖到目标数字（短弧）
            a0 = (h0 % 12) * 30; a1 = (target % 12) * 30
            d = (a1 - a0 + 540) % 360 - 180
            arc(page, cx, cy, b["width"] * 0.14, a0, a0 + d)
            h2, m2 = clock_value(page)
            assert (h2, m2) == (target, 0), f"拖时针后 {h2}:{m2}，目标 {target}:00"
            notes.add(f"拖时针 {h0}时→{target}时")
        else:
            while clock_value(page)[1] != 0: tid(page, "clock-minute-plus").click()
            while clock_value(page)[0] != target: tid(page, "clock-hour-plus").click()
            notes.add("按钮拨钟")
        tid(page, "clock-check").click()
    elif kind == "pattern":
        if not correct_first:
            slot0 = s[1][0][0]
            put(page, tid(page, f"token-{s[2]}"), tid(page, f"slot-{slot0}"), use_drag); feedback(page, "wrong")
        for slot, tok in s[1]:
            put(page, tid(page, f"token-{tok}"), tid(page, f"slot-{slot}"), use_drag)
        notes.add("图案拖进空格" if use_drag else "点图案再点空格")
    feedback(page, "correct")
    return kind

def current_id(page, prefix):
    return page.locator(f'[data-testid^="{prefix}"]').last.get_attribute("data-testid")[len(prefix):]

def goto_math(page):
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="graphics-section"]')

def run_round(page, kp, wrong_pattern, use_drag_pattern, stats, shots):
    tid(page, f"graphics-{kp}").scroll_into_view_if_needed()
    tid(page, f"graphics-{kp}").click(); page.wait_for_selector('[data-testid="practice-screen"]'); skip_teach(page)
    seen = []; notes = set(); prev = None
    for i in range(20):
        page.wait_for_timeout(150)
        if page.locator('[data-testid="practice-summary"]').count(): break
        ex_id = current_id(page, "practice-exercise-")
        assert ex_id != prev, "换题失败"
        # 不残留：新题出现时没有上一题的反馈
        assert page.locator('[data-testid^="feedback-"]').count() == 0, f"{ex_id} 出现上一题残留反馈"
        cf = wrong_pattern(i); ud = use_drag_pattern(i)
        kind = solve(page, ex_id, cf, ud, notes)
        stats.setdefault(kp, []).append((ex_id, kind, cf))
        if kind not in shots:
            shots.add(kind); page.screenshot(path=f"{OUT}/g-{kind}.png")
        seen.append(ex_id); prev = ex_id
        tid(page, "practice-next").click()
    page.wait_for_selector('[data-testid="practice-summary"]')
    score = tid(page, "practice-score").inner_text()
    tid(page, "practice-home").click(); page.wait_for_selector('[data-testid="home"]')
    tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="graphics-section"]')
    return seen, notes, score

def skip_teach(page):
    """V2.10：第一次练某个知识点会先出现小讲解，这里点“我会了，直接练习”"""
    page.wait_for_timeout(200)
    if page.locator('[data-testid="teach-panel"]').count():
        page.locator('[data-testid="teach-skip"]').first.click()
        page.wait_for_selector('[data-testid="teach-panel"]', state="detached")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    goto_math(page)
    tid(page, "graphics-section").scroll_into_view_if_needed()
    tid(page, "graphics-section").screenshot(path=f"{OUT}/g-00-section.png")
    expect(tid(page, "graphics-section")).to_contain_text("已通过教师审核")
    for kp in SOL.keys() | {"m1.clock"}: expect(tid(page, f"graphics-{kp}")).to_be_visible()
    ok("数学乐园出现「图形乐园」六个入口，标注“已通过教师审核”")

    stats = {}; shots = set(); all_notes = set()
    plan = {
        # 知识点: (轮数, 第 i 题是否一次答对, 第 i 题是否用真实拖动)
        "m1.position": (2, lambda i: i % 3 != 1, lambda i: i % 2 == 0),
        "m1.shapes2d": (2, lambda i: i % 3 != 2, lambda i: i % 2 == 1),
        "m1.shapes3d": (1, lambda i: i != 1, lambda i: True),
        "m1.classify": (2, lambda i: i % 2 == 0, lambda i: i % 2 == 0),
        "m1.pattern": (2, lambda i: i % 3 != 0, lambda i: i % 2 == 0),
        # 钟表：第一轮大多先拨错（模拟不熟练，触发“找找原因”），第二轮全部一次拨对
        "m1.clock": (1, lambda i: i == 0, lambda i: True),
    }
    for kp, (rounds, cf, ud) in plan.items():
        done = set()
        for r in range(rounds):
            seen, notes, score = run_round(page, kp, cf, ud, stats, shots)
            done |= set(seen); all_notes |= notes
        ok(f"{kp}：完成 {rounds} 轮，做过 {len(done)} 道不同的题，最后一轮 {score.replace(chr(10), ' ')}")

    # 每类至少 5 题、全部题库都做过
    cats = {"位置与方向": ["m1.position"], "平面/立体图形": ["m1.shapes2d", "m1.shapes3d"], "钟表整时": ["m1.clock"],
            "分类与整理": ["m1.classify"], "找规律": ["m1.pattern"]}
    for c, kps in cats.items():
        ids = {e for k in kps for e, _, _ in stats.get(k, [])}
        assert len(ids) >= 5, (c, ids)
        ok(f"{c}：真实完成 {len(ids)} 道不同的题（题型：{'、'.join(sorted({kd for k in kps for _, kd, _ in stats[k]}))}）")
    for kp in SOL:
        missing = set(f"kp:{kp}:{s}" for s in SOL[kp]) - {e for e, _, _ in stats[kp]}
        assert not missing, (kp, missing)
    ok("位置、平面图形、立体图形、分类、找规律的全部题目都在界面上做过一遍，判定与独立答案表一致")
    wrong_n = sum(1 for v in stats.values() for _, _, cf in v if not cf)
    ok(f"共作答 {sum(len(v) for v in stats.values())} 题，其中 {wrong_n} 题先故意答错：都出现提示，重试后答对")
    ok("用到的操作：" + "；".join(sorted(all_notes)))

    # 知识小地图：图形类知识点状态变化，钟表出现“找找原因”
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "map-entry").click(); page.wait_for_selector('[data-testid="map-screen"]')
    states = {k: tid(page, f"kp-{k}").inner_text().replace("\n", " ") for k in ["m1.position", "m1.shapes2d", "m1.shapes3d", "m1.clock", "m1.classify", "m1.pattern"]}
    for k, t in states.items(): assert "还没学" not in t, (k, t)
    page.screenshot(path=f"{OUT}/g-map.png", full_page=True)
    ok("知识小地图：" + "；".join(f"{k}={t}" for k, t in states.items()))
    tid(page, "kp-m1.clock").click(); page.wait_for_selector('[data-testid="kp-card"]')
    expect(tid(page, "kp-diagnose")).to_be_visible()
    ok("钟表第一轮反复拨错 → 小地图上出现“找找原因”")

    # 诊断：先确认钟表本身（互动拨钟题），再沿必需先修“认识 11～20”回溯
    tid(page, "kp-diagnose").click(); page.wait_for_selector('[data-testid="diagnose-intro"]')
    tid(page, "diagnose-start").click()
    asked = []; dnotes = set()
    for _ in range(20):
        page.wait_for_timeout(200)
        if page.locator('[data-testid="diagnose-summary"]').count(): break
        ex_id = current_id(page, "diag-exercise-")
        kp = ex_id.split(":")[1]; asked.append(f"{kp}({sol_of(ex_id)[0]})")
        solve(page, ex_id, correct_first=(kp != "m1.clock"), use_drag=False, notes=dnotes)
        tid(page, "diagnose-next").click()
    page.wait_for_selector('[data-testid="diagnose-summary"]')
    page.screenshot(path=f"{OUT}/g-diagnose-result.png")
    root = tid(page, "diagnose-root").inner_text().replace("\n", " ") if page.locator('[data-testid="diagnose-root"]').count() else tid(page, "diagnose-summary").inner_text().replace("\n", " ")
    assert any(a.startswith("m1.clock") for a in asked) and any(a.startswith("m1.count20") for a in asked), asked
    ok(f"找原因：依次检查 {' → '.join(dict.fromkeys(asked))}；结论：{root[:60]}")

    # 家长中心：推荐 / 尚未掌握里出现图形类知识点
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')
    tid(page, "pc-report").click(); page.wait_for_selector('[data-testid="knowledge-card"]')  # V5.1
    tid(page, "knowledge-card").scroll_into_view_if_needed()
    recs = page.locator('[data-testid="kp-rec"]').all_inner_texts()
    rec_text = " / ".join(r.replace("\n", " ") for r in recs)
    assert any(w in rec_text for w in ["钟", "整时", "图形", "位置", "分类", "规律"]), rec_text
    tid(page, "knowledge-card").screenshot(path=f"{OUT}/g-parent.png")
    ok("家长中心推荐：" + rec_text[:200])

    # 重新打开：记录仍在
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "subject-math").click(); page.wait_for_selector('[data-testid="graphics-section"]')
    counts = {k: tid(page, f"graphics-{k}").inner_text().replace("\n", " ") for k in ["m1.position", "m1.clock", "m1.pattern"]}
    for k, t in counts.items(): assert "已练 0/" not in t, (k, t)
    raw = page.evaluate("() => localStorage.getItem('slp.progress.v1')")
    data = json.loads(raw)
    gkps = {"m1.position", "m1.shapes2d", "m1.shapes3d", "m1.clock", "m1.classify", "m1.pattern"}
    gids = [r["exerciseId"] for r in data["results"] if r["exerciseId"].startswith("kp:") and r["exerciseId"].split(":")[1] in gkps]
    assert len(gids) >= sum(len(v) for v in stats.values()), (len(gids), sum(len(v) for v in stats.values()))
    ok(f"重新打开后记录仍在：本地存储里有 {len(gids)} 条图形类作答记录；入口显示 " + "；".join(counts.values()))

    # 平板横屏布局
    tab = b.new_context(viewport={"width": 1180, "height": 820}, device_scale_factor=1)
    tab.add_init_script(SPY)
    tp = tab.new_page(); tp.on("pageerror", lambda e: errors.append(str(e)))
    tp.goto(BASE); tp.wait_for_selector('[data-testid="home"]')
    tid(tp, "subject-math").click(); tp.wait_for_selector('[data-testid="graphics-section"]')
    for kp in ["m1.clock", "m1.classify", "m1.position"]:
        tid(tp, f"graphics-{kp}").click(); tp.wait_for_selector('[data-testid="practice-screen"]'); skip_teach(tp)
        tp.screenshot(path=f"{OUT}/g-tablet-{kp}.png")
        tp.locator('[data-testid="practice-screen"] [data-testid="back"]').first.click()
        tp.wait_for_selector('[data-testid="graphics-section"]')
    ok("平板横屏（1180×820）截图：钟表、分类、位置")

    real_errors = [e for e in errors if "Download the React DevTools" not in e]
    print(json.dumps({"errors": real_errors, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real_errors, real_errors
    b.close()
