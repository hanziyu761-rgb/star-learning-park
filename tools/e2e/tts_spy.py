"""
端到端测试用的“朗读记录器”（V5.1）。

V5.1 起 APP 不用手机自带语音：没有录音的句子都请求自家 AI 服务的 /api/tts（阿里云星星宝童声），
网页版拿到声音地址后用 Audio 播放。测试时网页版用假服务地址构建
（见 CLAUDE.md：EXPO_PUBLIC_AI_BASE_URL=http://tts.e2e.invalid npx expo export --platform web），这里在页面里：
- 拦截 /api/tts：按要读的文字生成一个专属的空白声音地址（blob:），回给 APP
- 拦截 /api/health（只拦截假地址）：回“服务正常”
- 接管 Audio：每次播放这些声音地址时记下文字（同一句读两次就记两次），然后马上“播放完”
记录放在 window.__spoken，格式按各脚本原来的写法：
pair=[文字, 语言]，obj={text, lang}，objrate={text, lang, rate}，text=文字。语言按有没有汉字判断。
"""


def tts_spy(fmt: str = "obj") -> str:
    push = {
        "pair": "window.__spoken.push([m.text, m.lang]);",
        "obj": "window.__spoken.push({text: m.text, lang: m.lang});",
        "objrate": "window.__spoken.push({text: m.text, lang: m.lang, rate: a.playbackRate});",
        "text": "window.__spoken.push(m.text);",
    }[fmt]
    return """
window.__spoken = [];
window.__tts = {};
(function () {
  const realFetch = window.fetch.bind(window);
  const json = (o) => new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } });
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.endsWith('/api/tts')) {
      let text = '';
      try { text = JSON.parse((init && init.body) || '{}').text || ''; } catch (e) {}
      const lang = /[\\u3400-\\u9fff]/.test(text) ? 'zh-CN' : 'en-US';
      const src = URL.createObjectURL(new Blob([text], { type: 'audio/wav' }));
      window.__tts[src] = { text: text, lang: lang };
      return json({ ok: true, url: src });
    }
    if (url.startsWith('http://tts.e2e.invalid') && url.endsWith('/api/health')) {
      return json({ ok: true, llm: true, tts: true, photo: true, model: 'e2e', vlModel: 'e2e' });
    }
    return realFetch(input, init);
  };
  const RealAudio = window.Audio;
  window.Audio = function (src) {
    const a = new RealAudio();
    const m = window.__tts[src];
    // 没带地址就不设（V5.2 修正：以前设成字符串 undefined，网页会请求 /…/undefined 报 404）
    if (!m) { if (src !== undefined) a.src = src; return a; }
    a.play = function () {
      %s
      setTimeout(() => { try { a.onended && a.onended(new Event('ended')); } catch (e) {} }, 20);
      return Promise.resolve();
    };
    a.pause = function () {};
    return a;
  };
})();
""" % push


def _auto_install() -> None:
    """导入本模块后，脚本里新建的每个浏览器页面都自动装上记录器（不需要记录朗读的脚本也装，免得请求假地址报错）"""
    import playwright.sync_api._generated as G

    if getattr(G.Browser, "_tts_spy_installed", False):
        return
    new_page, new_context = G.Browser.new_page, G.Browser.new_context

    import os

    # E2E_DARK=1：所有页面按“手机是深色模式”打开（APP 外观默认跟随手机），用来把脚本在深色模式下再跑一遍
    def dark(k):
        if os.environ.get("E2E_DARK"):
            k.setdefault("color_scheme", "dark")
        return k

    def page(self, *a, **k):
        p = new_page(self, *a, **dark(k))
        p.context.add_init_script(tts_spy("obj"))
        return p

    def context(self, *a, **k):
        c = new_context(self, *a, **dark(k))
        c.add_init_script(tts_spy("obj"))
        return c

    G.Browser.new_page, G.Browser.new_context = page, context
    G.Browser._tts_spy_installed = True


_auto_install()
