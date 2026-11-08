"""
V4.1 端到端验收（网页版）：家长中心 → 拍照错题
真实链路：网页 APP → 本机运行的 AI 服务（server/ai-worker/fc-server.mjs，与线上同一份代码）→ 模拟的“百炼视觉模型 / DeepSeek”。
只有最后一步是模拟（本机没有阿里云密钥，也不应在测试里花钱）；照片真的经过选图、压缩、上传、服务端校验。
1. 数学：从相册选一张错题图 → 识别 → 核对 → 原创程序出同类题 → 保存 → 打印内容正确 → 刷新后仍在 → 学习记录里没有照片
2. 英语：AI 出题，页面标注“AI 生成，未经人工审核”
3. 手机宽度不超出屏幕
需要：dist 已用 npx expo export --platform web 生成，并在 8081 端口提供静态服务。
"""
import json, os, re, subprocess, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from PIL import Image, ImageDraw
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8081")
OUT = os.environ.get("OUT", "shots"); os.makedirs(OUT, exist_ok=True)
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RESULTS = []
def ok(m): RESULTS.append(m); print("PASS", m, flush=True)
def tid(page, t): return page.locator(f'[data-testid="{t}"]').first

UPSTREAM = {"vl": [], "llm": []}
VL_REPLY = {"math": {"subject": "math", "question": "3 + 4 =", "childAnswer": "8", "correctAnswer": "7", "kpId": "m1.add10", "reason": "数数时多数了一个"},
            "english": {"subject": "english", "question": "What colour is the apple?", "childAnswer": "blue", "correctAnswer": "red", "kpId": "", "reason": "颜色单词记混了"}}
LLM_REPLY = [{"question": "The sky is ___.", "options": ["red", "blue", "green"], "answer": "blue", "explain": "天空是蓝色的"},
             {"question": "Grass is ___.", "options": ["green", "black", "pink"], "answer": "green", "explain": "草是绿色的"}]
MODE = {"vl": "math"}

class Mock(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        if self.path == "/vl":
            UPSTREAM["vl"].append(body)
            content = json.dumps(VL_REPLY[MODE["vl"]], ensure_ascii=False)
        else:
            UPSTREAM["llm"].append(body)
            content = json.dumps(LLM_REPLY, ensure_ascii=False)
        data = json.dumps({"choices": [{"message": {"content": content}, "finish_reason": "stop"}]}).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(data)

mock = ThreadingHTTPServer(("127.0.0.1", 9911), Mock)
threading.Thread(target=mock.serve_forever, daemon=True).start()
env = {**os.environ, "PORT": "9912", "DASHSCOPE_API_KEY": "e2e-dummy", "DEEPSEEK_API_KEY": "e2e-dummy",
       "DASHSCOPE_VL_URL": "http://127.0.0.1:9911/vl", "DEEPSEEK_BASE_URL": "http://127.0.0.1:9911/llm"}
srv = subprocess.Popen(["node", "fc-server.mjs"], cwd=os.path.join(ROOT, "server/ai-worker"), env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
time.sleep(1.5)

img_path = os.path.join(OUT, "photo-sample.jpg")
im = Image.new("RGB", (2000, 1500), "white"); d = ImageDraw.Draw(im)
d.text((100, 100), "3 + 4 = 8  X", fill="black"); im.save(img_path, quality=90)

def unlock(page):
    tid(page, "parent-entry").click(); page.wait_for_selector('[data-testid="parent-gate"]')
    a, c = map(int, re.findall(r"\d+", tid(page, "gate-question").inner_text())[:2])
    for dgt in str(a * c): tid(page, f"key-{dgt}").click()
    tid(page, "key-确定").click(); page.wait_for_selector('[data-testid="parent-dashboard"]')

def pick(page):
    with page.expect_file_chooser() as fc:
        tid(page, "photo-library").click()
    fc.value.set_files(img_path)

try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-sandbox"])
        errors = []
        page = b.new_page(viewport={"width": 390, "height": 820})
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]')
        # 预设：打开 AI 老师、填本机服务地址（缺的字段由 APP 的 parseProgress 迁移补齐）
        page.evaluate("""() => localStorage.setItem('slp.progress.v1', JSON.stringify({ version: 8, totalStars: 0, lessons: {}, results: [], sessions: [], mistakes: {},
          settings: { grade: 1, aiEnabled: true, aiBaseUrl: 'http://127.0.0.1:9912' } }))""")
        page.reload(); page.wait_for_selector('[data-testid="home"]')
        unlock(page)
        tid(page, "photo-entry").scroll_into_view_if_needed(); tid(page, "photo-entry").click()
        page.wait_for_selector('[data-testid="photo-screen"]')
        pick(page)
        expect(tid(page, "photo-question")).to_have_value("3 + 4 =", timeout=20000)
        vl = UPSTREAM["vl"][-1]
        url = vl["messages"][1]["content"][0]["image_url"]["url"]
        assert url.startswith("data:image/jpeg;base64,"), url[:40]
        assert len(url) < 1_800_000
        assert "m1.add10=" in vl["messages"][1]["content"][1]["text"]
        ok(f"照片经压缩后上传（{len(url) // 1024} KB base64），AI 服务按百炼 OpenAI 兼容格式转发，并带上一年级知识点候选")
        # 识别出的知识点自动选中（选中的按钮填充成家长中心主色）
        expect(tid(page, "photo-kp-m1.add10")).to_have_css("background-color", "rgb(108, 99, 255)")
        page.screenshot(path=f"{OUT}/v41-confirm.png", full_page=True)
        tid(page, "photo-generate").click()
        expect(page.locator('[data-testid="photo-item"]')).to_have_count(5)
        assert len(UPSTREAM["llm"]) == 0, "数学不应调用 AI 出题"
        tid(page, "photo-save").click()
        expect(tid(page, "photo-detail-question")).to_have_text("3 + 4 =")
        tid(page, "photo-print").click(); page.wait_for_timeout(500)
        html = page.evaluate("globalThis.__lastPrintHtml || ''")
        assert "错题同类练习" in html and "3 + 4 =" in html and "原创出题程序" in html and "参考答案" in html
        page.screenshot(path=f"{OUT}/v41-detail.png", full_page=True)
        saved = json.loads(page.evaluate("localStorage.getItem('slp.progress.v1')"))
        assert len(saved["photoMistakes"]) == 1 and saved["version"] == 9
        assert "base64" not in json.dumps(saved), "照片不应保存"
        assert saved["results"] == [] and saved["mistakes"] == {}
        ok("数学：识别 → 核对（知识点自动选中）→ 原创程序出 5 道同类题（没有调用 AI 出题）→ 保存 → 打印内容正确；记录里没有照片")

        MODE["vl"] = "english"
        page.goto(BASE); page.wait_for_selector('[data-testid="home"]'); unlock(page)
        tid(page, "photo-entry").scroll_into_view_if_needed(); tid(page, "photo-entry").click()
        page.wait_for_selector('[data-testid="photo-screen"]')
        expect(page.locator('[data-testid="photo-row"]')).to_have_count(1)
        tid(page, "photo-hint-english").click()
        pick(page)
        expect(tid(page, "photo-question")).to_have_value("What colour is the apple?", timeout=20000)
        tid(page, "photo-generate").click()
        expect(tid(page, "photo-ai-label")).to_contain_text("AI 生成，未经人工审核", timeout=20000)
        expect(page.locator('[data-testid="photo-item"]')).to_have_count(2)
        expect(page.get_by_text("The sky is ___.")).to_be_visible()  # 英语填空横线不能被过滤掉
        assert UPSTREAM["llm"][-1]["messages"][1]["content"].endswith("What colour is the apple?")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        page.screenshot(path=f"{OUT}/v41-english.png", full_page=True)
        ok("英语：AI 出题，页面标注“AI 生成，未经人工审核”；刷新后已保存的错题仍在；手机宽度不超出屏幕")
        print({"errors": errors, "pass": len(RESULTS)})
        assert not errors
        b.close()
finally:
    srv.terminate(); mock.shutdown()
