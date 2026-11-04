"""
试卷生成端到端验收（网页版 / 单文件 HTML 版）：
家长中心 → 试卷生成 → 选学科、年级、上下册、单元、题量 → 生成 → 预览（可显示答案）→ 打印 → 换一套；
并把打印内容用浏览器真正输出成 A4 PDF（检查页数、内容），作为样卷交付。
"""
import json
import os
import re

from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
PDF_OUT = os.environ.get("PDF_OUT", OUT); os.makedirs(PDF_OUT, exist_ok=True)
RESULTS = []
def ok(m): RESULTS.append(m); print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first

SPY = """
if (window.speechSynthesis) {
  window.speechSynthesis.speak = (u) => setTimeout(() => { try { u.onend && u.onend(new Event('end')); } catch(e){} }, 30);
}
"""

def to_pdf(browser, html, name):
    pg = browser.new_page()
    pg.set_content(html, wait_until="load")
    pdf_path = os.path.join(PDF_OUT, f"{name}.pdf")
    pg.pdf(path=pdf_path, format="A4", print_background=True, prefer_css_page_size=True)
    pg.set_viewport_size({"width": 794, "height": 1123})
    pg.screenshot(path=os.path.join(OUT, f"{name}-page1.png"))
    pg.close()
    data = open(pdf_path, "rb").read()
    pages = len(re.findall(rb"/Type\s*/Page[^s]", data))
    return pdf_path, pages, len(data)

def generate(page, subject, grade, term, size, units=()):
    tid(page, f"exam-subject-{subject}").click()
    tid(page, f"exam-grade-{grade}").click()
    tid(page, f"exam-term-{term}").click()
    for u in units: tid(page, f"exam-unit-{u}").click()
    tid(page, f"exam-size-{size}").click()
    tid(page, "exam-generate").click()
    page.wait_for_selector('[data-testid="exam-preview"]')
    expect(page.locator('[data-testid="exam-item"]')).to_have_count(size)
    return tid(page, "exam-code").inner_text()

def print_now(page):
    tid(page, "exam-print").click()
    page.wait_for_function("() => !!globalThis.__lastPrintHtml")
    page.wait_for_timeout(500)
    html = page.evaluate("() => globalThis.__lastPrintHtml")
    page.evaluate("() => { globalThis.__lastPrintHtml = undefined; }")
    return html

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 820}, device_scale_factor=2)
    ctx.add_init_script(SPY)
    page = ctx.new_page(); errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE); page.wait_for_selector('[data-testid="home"]')

    # 家长中心 → 试卷生成（验证一次即可）
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for d in str(a * c): tid(page, f"key-{d}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')
    tid(page, "exam-entry").scroll_into_view_if_needed(); tid(page, "exam-entry").click()
    page.wait_for_selector('[data-testid="exam-generate"]')
    expect(page.locator('[data-testid="parent-gate"]')).to_have_count(0)
    page.screenshot(path=f"{OUT}/e-01-settings.png")
    ok("家长中心 → 试卷生成（家长验证一次即可，不重复验证）")

    # 一、二年级英语：提示
    tid(page, "exam-subject-english").click(); tid(page, "exam-grade-1").click()
    expect(page.locator('[data-testid="exam-generate"]')).to_have_count(0)
    expect(tid(page, "exam-screen")).to_contain_text("英语试卷从三年级开始")
    ok("一年级英语：提示“英语试卷从三年级开始”，不能生成")

    samples = []
    # 1. 三年级上册数学：选 2 个单元的单元测试
    code1 = generate(page, "math", 3, "上", 25, units=[2, 4])
    expect(tid(page, "exam-code")).to_contain_text("万以内的加法和减法")
    for k in ["calc", "choice", "tf"]: expect(tid(page, f"exam-section-{k}")).to_be_visible()
    tid(page, "exam-show-answers").click()
    expect(page.locator("text=答案：").first).to_be_visible()
    page.screenshot(path=f"{OUT}/e-02-preview.png")
    html = print_now(page)
    calls = page.evaluate("() => globalThis.__printCount || 0")
    assert calls >= 1, calls
    assert "三年级上册数学单元测试" in html and "参考答案" in html, "打印内容不完整"
    ok(f"三年级上册数学·选 2 个单元·25 题：{code1.split('·')[0].strip()}；预览显示答案；点“打印”调用浏览器打印（{calls} 次）")
    pdf, pages, size = to_pdf(b, html, "样卷-三年级上册数学-单元测试")
    assert pages >= 2, pages
    samples.append((pdf, pages))
    ok(f"打印内容输出为 A4 PDF：{pages} 页（试卷 + 参考答案页），{size // 1024} KB")

    # 换一套：编号变化
    tid(page, "exam-again").click(); page.wait_for_timeout(300)
    code2 = tid(page, "exam-code").inner_text()
    assert code1.split("·")[0] != code2.split("·")[0], (code1, code2)
    ok("换一套：试卷编号变化 " + code1.split("·")[0].replace("试卷编号", "").strip() + " → " + code2.split("·")[0].replace("试卷编号", "").strip())

    # 2. 一年级上册数学期末（注音、钟面图形）；不附答案
    tid(page, "exam-with-answers").click()
    generate(page, "math", 1, "上", 50)
    html = print_now(page)
    assert "<ruby>" in html and "参考答案" not in html
    pdf, pages, size = to_pdf(b, html, "样卷-一年级上册数学-期末模拟卷-无答案")
    samples.append((pdf, pages))
    ok(f"一年级上册数学期末模拟卷 50 题：汉字注音，不附答案，PDF {pages} 页")
    tid(page, "exam-with-answers").click()

    # 3. 五年级下册语文、六年级上册英语
    for subj, g, t, n, name in [("chinese", 5, "下", 25, "样卷-五年级下册语文-单元测试"), ("english", 6, "上", 20, "样卷-六年级上册英语-随堂小测")]:
        generate(page, subj, g, t, n)
        html = print_now(page)
        pdf, pages, size = to_pdf(b, html, name)
        samples.append((pdf, pages))
        ok(f"{name.replace('样卷-', '')}：{n} 题，PDF {pages} 页")
    page.screenshot(path=f"{OUT}/e-03-preview-english.png")

    real = [e for e in errors if "React DevTools" not in e]
    print(json.dumps({"errors": real, "pass": len(RESULTS), "pdfs": samples}, ensure_ascii=False))
    assert not real, real
    b.close()
