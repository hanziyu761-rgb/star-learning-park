"""
V2.19 游戏乐园端到端验收（网页版 / 单文件 HTML 版）：
1. 首页进入游戏乐园；360×640、390×820 两种尺寸下各游戏页面按钮互不重叠
2. 凑数小厨房（一年级）：先放多了看到“太多啦”，拿出来再凑对；玩完 6 单看到星星
3. 拼音钓鱼（一年级）：钓错一次再钓对；玩完 6 题
4. 拼音钓鱼（三年级）：多音字句子，钓出句中读音
5. 拼词泡泡（三年级）：按顺序戳字母拼出单词，玩完 6 个
6. 家长中心把每天上限设成 10 分钟，游戏乐园显示“已玩 / 10 分钟”
"""
import itertools
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

POOL = dict(x.split("|") for x in re.search(r"CHAR_POOL = '([^']+)'", open(os.path.join(ROOT, "src/games/data/charPool.gen.ts"), encoding="utf-8").read()).group(1).split(" "))
POLY = {}
for line in re.search(r"POLY_LINES = `([\s\S]*?)`", open(os.path.join(ROOT, "src/games/data/poly.ts"), encoding="utf-8").read()).group(1).strip().splitlines():
    c, py, sent = line.split("|"); POLY[sent] = py

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

def set_grade(page, g):
    parent(page)
    tid(page, f"grade-{g}").scroll_into_view_if_needed(); tid(page, f"grade-{g}").click(); page.wait_for_timeout(300)

def open_game(page, gid):
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "games-entry").scroll_into_view_if_needed(); tid(page, "games-entry").click(); page.wait_for_selector('[data-testid="games-screen"]')
    tid(page, f"games-start-{gid}").click(); page.wait_for_selector(f'[data-testid="game-{gid}"]'); page.wait_for_timeout(400)

def no_overlap(page, label):
    boxes = page.evaluate("""() => [...document.querySelectorAll('[role="button"]')].map(e => { const r = e.getBoundingClientRect();
        return {id: e.getAttribute('data-testid') || e.getAttribute('aria-label') || e.innerText.slice(0, 10), x: r.x, y: r.y, w: r.width, h: r.height}; })
        .filter(b => b.w > 0 && b.h > 0)""")
    bad = []
    for a, b in itertools.combinations(boxes, 2):
        ix = min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"])
        iy = min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"])
        inside = lambda p, q: p["x"] >= q["x"] - 1 and p["y"] >= q["y"] - 1 and p["x"] + p["w"] <= q["x"] + q["w"] + 1 and p["y"] + p["h"] <= q["y"] + q["h"] + 1
        if ix > 2 and iy > 2 and not (inside(a, b) or inside(b, a)):
            bad.append((a["id"], b["id"]))
    assert not bad, f"{label} 按钮重叠：{bad[:5]}"
    return len(boxes)

def num(s): return round(float(s) * 100)

def play_kitchen(page, overflow_first=False, shots=None):
    for k in range(6):
        target = num(tid(page, "kitchen-target").inner_text())
        foods = page.locator('[data-testid^="food-"]')
        vals = [(foods.nth(i).get_attribute("data-testid"), num(foods.nth(i).get_attribute("aria-label"))) for i in range(foods.count())]
        if overflow_first and k == 0:
            big = sorted(vals, key=lambda v: -v[1])
            tid(page, big[0][0]).click(); tid(page, big[1][0]).click(); page.wait_for_timeout(150)
            if big[0][1] + big[1][1] > target:
                expect(tid(page, "kitchen-status")).not_to_be_empty()
                if shots: page.screenshot(path=f"{OUT}/{shots}-smoke.png")
                while page.locator('[data-testid^="pot-"]').count():
                    page.locator('[data-testid^="pot-"]').first.click(); page.wait_for_timeout(80)
        sol = next(c for r in range(1, len(vals) + 1) for c in itertools.combinations(vals, r) if sum(v for _, v in c) == target)
        for fid, _ in sol: tid(page, fid).click(); page.wait_for_timeout(80)
        expect(tid(page, "kitchen-done")).to_be_visible()
        if shots and k == 0: page.screenshot(path=f"{OUT}/{shots}-done.png")
        tid(page, "kitchen-next").click(); page.wait_for_timeout(200)

def play_fish(page, miss_first=False, shots=None):
    for k in range(6):
        if page.locator('[data-testid="fish-sentence"]').count():
            ans = POLY[tid(page, "fish-sentence").inner_text()]
        else:
            ans = POOL[tid(page, "fish-char").inner_text().strip()]
        if miss_first and k == 0:
            fish = page.locator('[data-testid="fish-pond"] [role="button"]')
            for i in range(fish.count()):
                if fish.nth(i).get_attribute("aria-label") != ans:
                    fish.nth(i).click(force=True); break  # 鱼一直在游，不等“静止”直接点
            expect(tid(page, "fish-status")).not_to_be_empty()
        if shots and k == 0: page.screenshot(path=f"{OUT}/{shots}.png")
        page.locator(f'[data-testid="fish-pond"] [aria-label="{ans}"]').first.click(force=True)
        expect(tid(page, "fish-next")).to_be_visible()
        tid(page, "fish-next").click(); page.wait_for_timeout(200)

def play_bubble(page, shots=None):
    for k in range(6):
        page.wait_for_timeout(150)
        word = [s["text"] for s in page.evaluate("window.__spoken") if s["lang"].startswith("en")][-1]
        for i, ch in enumerate(word):
            if shots and k == 0 and i == 1: page.screenshot(path=f"{OUT}/{shots}.png")
            page.locator(f'[data-testid="bubble-sky"] [aria-label="{ch}"]').first.click(force=True); page.wait_for_timeout(60)  # 泡泡一直在飘
        expect(tid(page, "bubble-done")).to_contain_text(word)
        tid(page, "bubble-next").click(); page.wait_for_timeout(200)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    errors = []
    def ctx_page(w, h):
        ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2)
        ctx.add_init_script(SPY)
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        return ctx, page

    for (w, h) in [(360, 640), (390, 820), (800, 1280), (1280, 800), (1024, 1366), (1366, 1024)]:
        ctx, page = ctx_page(w, h)
        counts = []
        for gid in ["kitchen", "fish", "bubble"]:
            open_game(page, gid)
            counts.append(no_overlap(page, f"{w}×{h} {gid}"))
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), f"{w}×{h} 横向超出屏幕"
            vis = page.evaluate("() => [...document.querySelectorAll('[role=button]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.bottom > window.innerHeight + 1 || r.right > window.innerWidth + 1); }).map(e => e.getAttribute('data-testid'))")
            assert not vis, f"{w}×{h} {gid} 有按钮在屏幕外：{vis}"
            page.screenshot(path=f"{OUT}/g-{w}-{gid}.png", full_page=True)
        ok(f"{w}×{h}：三个游戏页面（按钮 {counts}）互不重叠、都在屏幕内")
        ctx.close()

    ctx, page = ctx_page(1280, 800)
    open_game(page, "kitchen"); play_kitchen(page, shots="g-wide-kitchen")
    open_game(page, "fish"); play_fish(page, shots="g-wide-fish")
    open_game(page, "bubble"); play_bubble(page, shots="g-wide-bubble")
    page.wait_for_selector('[data-testid="game-summary"]'); page.screenshot(path=f"{OUT}/g-wide-summary.png")
    ok("平板横屏 1280×800：三个游戏各玩完一局")
    ctx.close()

    ctx, page = ctx_page(390, 820)
    open_game(page, "kitchen")
    play_kitchen(page, overflow_first=True, shots="g-kitchen")
    page.wait_for_selector('[data-testid="game-summary"]'); page.screenshot(path=f"{OUT}/g-kitchen-summary.png")
    ok(f"凑数小厨房（一年级）：放多了冒烟、拿出来再凑对；6 单做完 {tid(page, 'game-score').inner_text()} {tid(page, 'game-stars').inner_text()}")

    open_game(page, "fish")
    play_fish(page, miss_first=True, shots="g-fish-g1")
    page.wait_for_selector('[data-testid="game-summary"]')
    ok(f"拼音钓鱼（一年级）：钓错一次再钓对；{tid(page, 'game-score').inner_text()}")

    set_grade(page, 3)
    open_game(page, "fish")
    expect(tid(page, "fish-sentence")).to_be_visible()
    play_fish(page, shots="g-fish-poly")
    page.wait_for_selector('[data-testid="game-summary"]')
    ok(f"多音字钓鱼（三年级）：6 句全部钓对；{tid(page, 'game-score').inner_text()}")

    open_game(page, "bubble")
    play_bubble(page, shots="g-bubble")
    page.wait_for_selector('[data-testid="game-summary"]'); page.screenshot(path=f"{OUT}/g-bubble-summary.png")
    ok(f"拼词泡泡（三年级）：6 个单词按顺序拼对；{tid(page, 'game-score').inner_text()}")

    parent(page)
    tid(page, "game-limit-10").scroll_into_view_if_needed(); tid(page, "game-limit-10").click(); page.wait_for_timeout(200)
    expect(tid(page, "parent-games-kitchen")).to_contain_text("1 局")
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "games-entry").click(); page.wait_for_selector('[data-testid="games-screen"]')
    expect(tid(page, "games-time")).to_contain_text("/ 10 分钟")  # V4.2.1：精简成“已玩 / 上限 分钟”
    page.screenshot(path=f"{OUT}/g-hub.png", full_page=True)
    ok("家长中心设成每天 10 分钟、能看到各游戏玩了几局；游戏乐园显示“已玩 / 10 分钟”")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
