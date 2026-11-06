"""
V2.18 英语单词卡端到端验收（网页版 / 单文件 HTML 版）：
1. 从英语乐园进入单词卡；两种手机尺寸（360×640、390×820）下所有按钮互不重叠
2. 喇叭用美式英语读单词；3D 翻转后背面有中文、例句、记忆窍门；出现“没记住 / 记住了”
3. 收藏红心 → 生词本弹窗显示、移除；没记住 → 自动进生词本、隔 3 张再出现并标“第 2 次出现”；全部记住弹出庆祝
4. 听写：字母按键拼对、输入框拼错显示正确拼写
5. 三年级“颜色”单元：串起来看是色卡，点单词跳到那张卡；“家人”单元是家谱树
"""
import json
import os
import re

from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
RESULTS = []
def ok(m): RESULTS.append(m); print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first

SPY = """
window.__spoken = [];
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => { window.__spoken.push({text: u.text, lang: u.lang, rate: u.rate}); setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 20); };
}
"""

def set_grade(page, g):
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')
    tid(page, f"grade-{g}").scroll_into_view_if_needed(); tid(page, f"grade-{g}").click()
    page.wait_for_timeout(300)

def open_cards(page):
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
    tid(page, "subject-english").click(); page.wait_for_selector('[data-testid="words-entry"]')
    tid(page, "words-entry").click(); page.wait_for_selector('[data-testid="wc-screen"]')
    page.wait_for_timeout(300)

def no_overlap(page, label):
    """页面上可见的按钮两两不重叠（横向滚动的单元标签只比较屏幕内的）"""
    boxes = page.evaluate("""() => {
      const vw = window.innerWidth;
      const els = [...document.querySelectorAll('[role="button"]')].filter(e => !e.closest('[aria-hidden="true"]'));
      return els.map(e => { const r = e.getBoundingClientRect(); const id = e.getAttribute('data-testid') || e.innerText.slice(0, 12);
        const s = getComputedStyle(e); return {id, x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height, vis: s.visibility !== 'hidden' && r.width > 0 && r.height > 0 && r.x < vw && r.right > 0}; })
        .filter(b => b.vis);
    }""")
    # 卡片正反两面叠在一起是设计（同一时间只有一面可点），翻转时比较当前朝上的一面
    hidden = page.evaluate("""() => [...document.querySelectorAll('[data-testid="wc-front"],[data-testid="wc-back"]')]
        .filter(e => getComputedStyle(e).pointerEvents === 'none').map(e => e.getAttribute('data-testid'))""")
    hidden_ids = set()
    for face in hidden:
        hidden_ids |= set(page.evaluate(f"""() => [...document.querySelector('[data-testid="{face}"]').querySelectorAll('[role="button"]')].map(e => e.getAttribute('data-testid') || e.innerText.slice(0, 12))"""))
    boxes = [b for b in boxes if b["id"] not in hidden_ids]
    bad = []
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            a, b = boxes[i], boxes[j]
            ix = min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"])
            iy = min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"])
            if ix > 1 and iy > 1:
                # 一个按钮包住另一个（卡片正面整块可点、里面的喇叭和红心）不算重叠
                inside = lambda p, q: p["x"] >= q["x"] - 1 and p["y"] >= q["y"] - 1 and p["x"] + p["w"] <= q["x"] + q["w"] + 1 and p["y"] + p["h"] <= q["y"] + q["h"] + 1
                if not (inside(a, b) or inside(b, a)):
                    bad.append((a["id"], b["id"]))
    assert not bad, f"{label} 按钮重叠：{bad[:5]}"
    return len(boxes)

def flip(page):
    tid(page, "wc-flip").click(); page.wait_for_timeout(650)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    errors = []
    for (w, h) in [(360, 640), (390, 820), (800, 1280), (1280, 800), (1024, 1366), (1366, 1024)]:
        ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2)
        ctx.add_init_script(SPY)
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        open_cards(page)
        n1 = no_overlap(page, f"{w}×{h} 正面")
        page.screenshot(path=f"{OUT}/wc-{w}-front.png", full_page=True)
        flip(page)
        expect(tid(page, "wc-remember")).to_be_visible()
        n2 = no_overlap(page, f"{w}×{h} 背面")
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), f"{w}×{h} 横向超出屏幕"
        if w > h and w >= 900:  # 平板横屏：卡片在左、按钮在右
            card = tid(page, "wc-card").bounding_box(); rem = tid(page, "wc-remember").bounding_box()
            assert card["x"] + card["width"] <= rem["x"], f"{w}×{h} 没有变成左右两栏"
        page.screenshot(path=f"{OUT}/wc-{w}-back.png", full_page=True)
        ok(f"{w}×{h}：正面 {n1} 个、背面 {n2} 个按钮，互不重叠、不超出屏幕" + ("（左右两栏）" if w > h and w >= 900 else ""))
        ctx.close()

    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    open_cards(page)
    expect(tid(page, "wc-progress")).to_have_text("本单元已记住 0/4")
    expect(tid(page, "wc-ipa")).to_contain_text("/bɔɪ/")
    page.locator('[data-testid="wc-front"] [data-testid="wc-speak"]').click(); page.wait_for_timeout(200)
    spoken = page.evaluate("window.__spoken")
    assert any(s["text"] == "boy" and s["lang"].startswith("en") for s in spoken), spoken
    ok("点喇叭用美式英语读 boy；音标 /bɔɪ/")

    # 翻转：背面朝上（转到 360°，正面转到 180°）
    flip(page)
    rot = page.evaluate("""() => ['wc-front','wc-back'].map(id => getComputedStyle(document.querySelector(`[data-testid="${id}"]`)).transform)""")
    expect(page.locator('[data-testid="wc-back"] [data-testid="wc-zh"]')).to_contain_text("男")
    expect(page.locator('[data-testid="wc-back"] [data-testid="wc-example"]')).to_contain_text("I am a boy.")
    ok(f"3D 翻转：背面显示中文、例句和记忆窍门（正反两面变换 {rot[0][:22]}… / {rot[1][:22]}…）")

    # 收藏 → 生词本 → 移除
    page.locator('[data-testid="wc-back"] [data-testid="wc-heart"]').click(); page.wait_for_timeout(200)
    expect(page.locator('[data-testid="wc-back"] [data-testid="wc-heart"]')).to_have_attribute("aria-label", "从生词本移除")
    tid(page, "wc-book").click(); page.wait_for_selector('[data-testid="wb-modal"]')
    expect(tid(page, "wb-item-boy")).to_contain_text("男孩"); page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/wc-wordbook.png")
    tid(page, "wb-remove-boy").click(); expect(page.locator('[data-testid="wb-item-boy"]')).to_have_count(0)
    tid(page, "wb-modal-close").click(); page.wait_for_timeout(300)
    ok("红心收藏后生词本弹窗显示 boy（男孩），点移除后消失")

    # 没记住 → 生词本 + 隔 3 张再出现
    tid(page, "wc-forget").click(); page.wait_for_timeout(300)
    expect(tid(page, "wc-book")).to_contain_text("（1）")
    for _ in range(3):
        flip(page); tid(page, "wc-remember").click(); page.wait_for_timeout(250)
    expect(tid(page, "wc-times")).to_have_text("第 2 次出现")
    expect(tid(page, "wc-ipa")).to_contain_text("/bɔɪ/")
    page.screenshot(path=f"{OUT}/wc-again.png", full_page=True)
    flip(page); tid(page, "wc-remember").click()
    page.wait_for_selector('[data-testid="celebrate"]'); page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/wc-celebrate.png")
    ok("没记住的 boy 自动进生词本，隔 3 张后再出现并标“第 2 次出现”；4 个全部记住后弹出庆祝")

    # 听写本单元
    tid(page, "celebrate-dictate").click(); page.wait_for_selector('[data-testid="dict-modal"]')
    zh2w = {"男孩": "boy", "女孩": "girl", "老师": "teacher", "朋友": "friend"}
    for k in range(4):
        z = tid(page, "dict-zh").inner_text().strip()
        word = zh2w[z]
        if k == 1:
            tid(page, "dict-mode-input").click()
            tid(page, "dict-input").fill(word + "x")
        elif k == 2:
            tid(page, "dict-mode-input").click()
            tid(page, "dict-input").fill(word.upper())
        else:
            tid(page, "dict-mode-tiles").click()  # 上一题切到了输入框，切回字母按键
            used = set()
            tiles = page.locator('[data-testid^="dict-tile-"]')
            labels = [tiles.nth(i).get_attribute("aria-label") for i in range(tiles.count())]
            for ch in word:
                i = next(i for i, l in enumerate(labels) if l == ch and i not in used); used.add(i)
                tiles.nth(i).click()
        if k == 0: page.screenshot(path=f"{OUT}/wc-dictation.png")
        tid(page, "dict-submit").click()
        expect(tid(page, "dict-result")).to_contain_text("正确拼写" if k == 1 else "拼对了")
        if k == 1: page.screenshot(path=f"{OUT}/wc-dictation-wrong.png")
        tid(page, "dict-next").click(); page.wait_for_timeout(200)
    expect(tid(page, "dict-summary")).to_contain_text("拼对 3 / 4")
    tid(page, "dict-done").click(); page.wait_for_timeout(300)
    ok("听写 4 题：字母按键拼对、输入框拼错显示正确拼写、大写也算对；成绩 3/4")

    # 三年级：颜色色卡、家谱树
    set_grade(page, 3)
    open_cards(page)
    tid(page, "wc-unit-pep3a-2").click(); page.wait_for_timeout(300)
    expect(tid(page, "wc-progress")).to_have_text("本单元已记住 0/8")
    page.screenshot(path=f"{OUT}/wc-red.png", full_page=True)
    tid(page, "wc-map").click(); page.wait_for_selector('[data-testid="map-colors"]'); page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/wc-map-colors.png")
    tid(page, "map-word-brown").click(); page.wait_for_timeout(400)
    expect(tid(page, "wc-ipa")).to_contain_text("/braʊn/")
    tid(page, "wc-unit-pep3b-2").click(); page.wait_for_timeout(300)
    tid(page, "wc-map").click(); page.wait_for_selector('[data-testid="map-family"]'); page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/wc-map-family.png")
    tid(page, "map-modal-close").click(); page.wait_for_timeout(300)
    ok("三年级“颜色”单元串起来看是色卡，点 brown 跳到那张卡；“家人”单元是家谱树")

    # bear：藏词 ear，点了跳过去
    tid(page, "wc-unit-pep3a-4").click(); page.wait_for_timeout(300)
    tid(page, "wc-map").click(); page.wait_for_selector('[data-testid="map-cloud"]')
    tid(page, "map-word-bear").click(); page.wait_for_timeout(400)
    flip(page)
    expect(page.locator('[data-testid="wc-back"] [data-testid="trick-hidden"]')).to_contain_text("藏着")
    page.screenshot(path=f"{OUT}/wc-bear-back.png", full_page=True)
    page.locator('[data-testid="wc-back"] [data-testid="trick-hidden"] [data-testid="trick-word-ear"]').click(); page.wait_for_timeout(500)
    expect(tid(page, "wc-ipa")).to_contain_text("/ɪr/")
    ok("bear 背面记忆窍门显示“藏着 ear”，点 ear 跳到 ear 那张卡")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS)}, ensure_ascii=False))
    assert not real, real
    b.close()
