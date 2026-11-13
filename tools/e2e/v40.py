"""
V4.0 端到端验收（网页版 / 单文件 HTML 版）：家长中心 → 教材资源库
1. 汇总只按真实数据：新版教材 12 册、目录已核实 0 册
2. 语文：统编版修订版各册显示“目录未录入”；题库旧版单元显示“目录待核实”；其它语文版本显示“状态待核实”
3. 数学、英语切换；按年级筛选；手机和平板横屏不超出屏幕
"""
import os, re
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
RESULTS = []
def ok(m): RESULTS.append(m); print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first

with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    errors = []
    for (w, h) in [(390, 820), (1280, 800)]:
        page = b.new_page(viewport={"width": w, "height": h})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
        a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
        for d in str(a * c): tid(page, f"key-{d}").click()
        tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')
        tid(page, "parent-textbooks").scroll_into_view_if_needed(); tid(page, "parent-textbooks").click()
        page.wait_for_selector('[data-testid="textbooks-screen"]')
        # V4.1 简单视图：下拉选 科目 → 版本 → 年级 → 学期
        expect(tid(page, "tb-book-title")).to_contain_text("统编版")
        tid(page, "tb-dd-grade").click(); tid(page, "tb-dd-grade-opt-1").click()
        tid(page, "tb-dd-term").click(); tid(page, "tb-dd-term-opt-下").click()
        expect(tid(page, "tb-book-title")).to_have_text("统编版 · 一年级下册")
        expect(tid(page, "tb-units")).to_contain_text("小壁虎借尾巴")
        tid(page, "tb-dd-subject").click(); tid(page, "tb-dd-subject-opt-math").click()
        tid(page, "tb-dd-edition").click(); tid(page, "tb-dd-edition-opt-math.bsd").click()
        tid(page, "tb-dd-grade").click(); tid(page, "tb-dd-grade-opt-2").click()
        tid(page, "tb-dd-term").click(); tid(page, "tb-dd-term-opt-上").click()
        expect(tid(page, "tb-book-title")).to_have_text("北师大版 · 二年级上册")
        assert page.locator('[data-testid="tb-unit"]').count() >= 5
        tid(page, "tb-dd-edition").click(); tid(page, "tb-dd-edition-opt-math.hujiao").click()
        expect(tid(page, "tb-not-ready")).to_contain_text("没有这一册的资料")  # V4.2.1 精简了提示
        tid(page, "tb-dd-subject").click(); tid(page, "tb-dd-subject-opt-english").click()
        tid(page, "tb-dd-grade").click()
        assert page.locator('[data-testid="tb-dd-grade-opt-1"]').count() == 0  # 英语三年级起
        tid(page, "tb-dd-grade-opt-3").click()
        expect(tid(page, "tb-book-title")).to_contain_text("人教PEP版 · 三年级")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        page.screenshot(path=f"{OUT}/v41-textbooks-{w}.png", full_page=True)
        # 选过的版本会记住：数学最后选的是沪教版（平台没有，目录未核对）
        tid(page, "tb-dd-subject").click(); tid(page, "tb-dd-subject-opt-math").click()
        expect(tid(page, "tb-book-title")).to_contain_text("沪教版")
        tid(page, "tb-dd-edition").click(); tid(page, "tb-dd-edition-opt-math.pep").click()
        tid(page, "tb-dd-subject").click(); tid(page, "tb-dd-subject-opt-chinese").click()
        ok(f"{w}×{h}：简单视图下拉选科目、版本、年级、学期正常；未核对版本只提示；英语从三年级起；选过的版本会记住；不超出屏幕")
        # V4.0 详细资料（折叠）
        tid(page, "tb-details-toggle").click()
        expect(tid(page, "textbooks-summary")).to_contain_text("教材册次 187 册（目录已核实 181 册）")
        expect(tid(page, "tb-toc-chinese.tongbian.2024.g6b")).to_have_text("目录未录入")
        expect(tid(page, "tb-toc-chinese.tongbian.2024.g1a")).to_have_text("目录已核实")
        tid(page, "tb-open-chinese.tongbian.2024.g1b").click()
        expect(tid(page, "tb-tocview-chinese.tongbian.2024.g1b")).to_contain_text("小壁虎借尾巴")
        expect(tid(page, "tb-tocview-chinese.tongbian.2024.g1b")).to_contain_text("古诗二首（池上、小池）")
        tid(page, "tb-open-chinese.tongbian.2024.g3a").click()
        expect(tid(page, "tb-tocview-chinese.tongbian.2024.g3a")).to_contain_text("第三单元（阅读策略单元）")
        expect(tid(page, "tb-tocview-chinese.tongbian.2024.g3a")).to_contain_text("9*　犟龟")
        page.screenshot(path=f"{OUT}/v40-toc-{w}.png", full_page=True)
        expect(tid(page, "tb-toc-bank.chinese-g4a")).to_have_text("目录待核实")
        expect(tid(page, "tb-edition-chinese.sujiao")).to_contain_text("状态待核实")
        page.screenshot(path=f"{OUT}/v40-textbooks-{w}.png")
        tid(page, "tb-grade-4").click(); page.wait_for_timeout(200)
        assert page.locator('[data-testid^="tb-vol-chinese.tongbian.2024.g1"]').count() == 0
        assert page.locator('[data-testid^="tb-vol-chinese.tongbian.2024.g4"]').count() == 2
        expect(tid(page, "tb-vol-chinese.tongbian.legacy.g4b")).to_contain_text("未修订版")
        tid(page, "tb-subject-math").click(); page.wait_for_timeout(200)
        expect(tid(page, "tb-stat-bank.math-g4a")).to_contain_text("练习题 355")
        tid(page, "tb-grade-0").click(); page.wait_for_timeout(200)
        expect(tid(page, "tb-toc-math.pep.2024.g2b")).to_have_text("目录已核实")
        tid(page, "tb-open-math.pep.2024.g2b").click()
        expect(tid(page, "tb-tocview-math.pep.2024.g2b")).to_contain_text("数学连环画")
        tid(page, "tb-subject-english").click(); page.wait_for_timeout(200)
        expect(tid(page, "tb-edition-english.yilin")).to_contain_text("现行")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        page.screenshot(path=f"{OUT}/v40-textbooks-en-{w}.png", full_page=True)
        ok(f"{w}×{h}：教材资源库按真实数据显示（187 册中 181 册已核实、一年级目录可展开；题库旧版待核实；筛选年级、切换学科正常）")
        page.close()
    print({"errors": errors, "pass": len(RESULTS)})
    assert not errors
    b.close()
