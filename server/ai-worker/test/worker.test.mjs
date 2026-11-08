import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import worker, { _resetRateLimit, extractJson, _resetTtsCache, cleanOutput, DISTRESS_REPLY, FALLBACK_REPLY, scrubPersonalInfo } from '../src/worker.js';

/** 模拟 DeepSeek：记录请求，返回指定内容 */
function mockEnv(reply, { status = 200 } = {}) {
  const calls = [];
  return {
    calls,
    env: {
      DEEPSEEK_API_KEY: 'test-key',
      __fetch: async (url, init) => {
        calls.push({ url, init, body: JSON.parse(init.body) });
        if (status !== 200) return new Response('err', { status });
        return new Response(JSON.stringify({ choices: [{ message: { content: reply }, finish_reason: 'stop' }] }), { status: 200 });
      },
    },
  };
}

const post = (path, body, env, headers = {}) =>
  worker.fetch(new Request(`http://x${path}`, { method: 'POST', body: JSON.stringify(body), headers }), env);

beforeEach(() => {
  _resetRateLimit();
  _resetTtsCache();
});

describe('健康检查与配置', () => {
  it('未配置密钥时 health 显示 llm=false，业务接口返回 501', async () => {
    const h = await (await worker.fetch(new Request('http://x/api/health'), {})).json();
    assert.deepEqual(h, { ok: true, llm: false, model: 'deepseek-flash', tts: false, photo: false, vlModel: 'qwen3-vl-plus' });
    const r = await post('/api/tutor/chat', { messages: [{ role: 'user', content: '你好' }] }, {});
    assert.equal(r.status, 501);
    assert.equal((await r.json()).code, 'LLM_NOT_CONFIGURED');
  });

  it('按 DeepSeek 文档调用：模型 deepseek-flash、关闭思考模式、Bearer 认证', async () => {
    const { env, calls } = mockEnv('你好呀');
    const r = await post('/api/tutor/chat', { subject: 'math', grade: 1, messages: [{ role: 'user', content: '你好' }] }, env);
    assert.equal(r.status, 200);
    assert.equal(calls[0].url, 'https://api.deepseek.com/chat/completions');
    assert.equal(calls[0].init.headers.Authorization, 'Bearer test-key');
    assert.equal(calls[0].body.model, 'deepseek-flash');
    assert.deepEqual(calls[0].body.thinking, { type: 'disabled' });
    assert.equal(calls[0].body.stream, false);
    assert.match(calls[0].body.messages[0].content, /一年级的小朋友/);
  });

  it('DeepSeek 报错时返回友好错误码，不泄露细节', async () => {
    const { env } = mockEnv('', { status: 402 });
    const r = await post('/api/tutor/chat', { messages: [{ role: 'user', content: '你好' }] }, env);
    assert.equal(r.status, 502);
    const j = await r.json();
    assert.equal(j.code, 'LLM_NO_BALANCE');
    assert.equal(j.error, 'AI 老师暂时不可用');
  });
});

describe('儿童安全', () => {
  it('发送给大模型前去除手机号、身份证、邮箱、微信号、门牌地址', () => {
    const s = scrubPersonalInfo('我电话13812345678，邮箱a@b.com，微信: abc12345，住在幸福路12号，身份证11010120150101123X');
    assert.ok(!/13812345678|a@b\.com|abc12345|幸福路12号|11010120150101123X/.test(s), s);
  });

  it('孩子说出危险或难过的事：不调用大模型，直接给出“告诉大人”的固定回复', async () => {
    const { env, calls } = mockEnv('不应该被调用');
    const r = await post('/api/tutor/chat', { messages: [{ role: 'user', content: '有人打我，我好害怕' }] }, env);
    const j = await r.json();
    assert.equal(j.text, DISTRESS_REPLY);
    assert.equal(calls.length, 0);
  });

  it('输出包含不当内容时替换为安全回复；去除 Markdown；限制长度', () => {
    assert.equal(cleanOutput('我们来谈谈恋爱吧'), FALLBACK_REPLY);
    assert.equal(cleanOutput('**加油**'), '加油');
    assert.ok(Array.from(cleanOutput('啊'.repeat(500))).length <= 161);
  });

  it('提示模式：不把答案告诉模型；模型若仍说出答案则换成固定引导语', async () => {
    const { env, calls } = mockEnv('答案是 5，因为 2 加 3 等于 5');
    const r = await post(
      '/api/tutor/hint',
      { subject: 'math', grade: 1, mode: 'hint', question: '2+3=?', options: ['4', '5', '6'], answer: '5' },
      env,
    );
    const j = await r.json();
    assert.ok(!calls[0].body.messages[1].content.includes('正确答案'));
    assert.ok(!j.text.includes('5'), j.text);
  });

  it('讲解模式：答对后才把答案给模型', async () => {
    const { env, calls } = mockEnv('两组合起来就是 5 个。');
    const r = await post(
      '/api/tutor/hint',
      { subject: 'math', grade: 1, mode: 'explain', question: '2+3=?', answer: '5' },
      env,
    );
    assert.equal((await r.json()).text, '两组合起来就是 5 个。');
    assert.match(calls[0].body.messages[1].content, /正确答案：5/);
  });

  it('输入过长、科目不合法时拒绝', async () => {
    const { env } = mockEnv('x');
    const r1 = await post('/api/tutor/hint', { subject: 'math', question: '题'.repeat(400) }, env);
    assert.equal(r1.status, 400);
    const r2 = await post('/api/tutor/hint', { subject: 'game', question: '题' }, env);
    assert.equal(r2.status, 400);
  });

  it('同一来源每分钟请求次数受限', async () => {
    const { env } = mockEnv('好');
    env.RATE_LIMIT_PER_MINUTE = '3';
    const h = { 'CF-Connecting-IP': '1.2.3.4' };
    const body = { messages: [{ role: 'user', content: '你好' }] };
    for (let i = 0; i < 3; i++) assert.equal((await post('/api/tutor/chat', body, env, h)).status, 200);
    assert.equal((await post('/api/tutor/chat', body, env, h)).status, 429);
  });
});

describe('家长学习分析', () => {
  it('只发送知识点、正确率和错题题干', async () => {
    const { env, calls } = mockEnv('孩子在比多少上还不熟练。\n1. 用积木比\n2. 说一说\n3. 多表扬');
    const r = await post(
      '/api/tutor/report',
      { grade: 1, weakSkills: [{ label: '比多少', accuracy: 40, total: 5 }], mistakes: ['哪一边的小鱼多？'] },
      env,
    );
    assert.equal(r.status, 200);
    const sent = calls[0].body.messages[1].content;
    assert.match(sent, /比多少：一次答对率 40%（5 题）/);
    assert.match(sent, /哪一边的小鱼多/);
  });

  it('没有薄弱点时不调用大模型', async () => {
    const { env, calls } = mockEnv('x');
    const j = await (await post('/api/tutor/report', { grade: 1 }, env)).json();
    assert.match(j.text, /没有明显的薄弱知识点/);
    assert.equal(calls.length, 0);
  });
});

describe('语音合成 /api/tts（CosyVoice）', () => {
  const ttsEnv = (resp, status = 200) => {
    const calls = [];
    return {
      calls,
      env: {
        DASHSCOPE_API_KEY: 'ds-key',
        __fetch: async (url, init) => {
          calls.push({ url, init, body: JSON.parse(init.body) });
          if (status !== 200) return new Response('bad', { status });
          return new Response(JSON.stringify(resp), { status: 200 });
        },
      },
    };
  };
  it('未配置百炼密钥：health 显示 tts=false，接口返回 501', async () => {
    const r = await post('/api/tts', { text: '你好' }, {});
    assert.equal(r.status, 501);
    assert.equal((await r.json()).code, 'TTS_NOT_CONFIGURED');
  });
  it('按百炼文档调用：cosyvoice-v3-flash、input 里放 text/voice/format/rate，返回音频地址；同一句话不重复合成', async () => {
    const { env, calls } = ttsEnv({ output: { audio: { url: 'https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/a.mp3' } } });
    const r = await post('/api/tts', { text: '小朋友你好**', voice: 'longniuniu_v3', rate: 'slow' }, env);
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.url, 'https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/a.mp3');
    assert.equal(calls[0].url, 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer');
    assert.equal(calls[0].init.headers.Authorization, 'Bearer ds-key');
    assert.deepEqual(calls[0].body, { model: 'cosyvoice-v3-flash', input: { text: '小朋友你好', voice: 'longniuniu_v3', format: 'mp3', sample_rate: 24000, rate: 0.9 } });
    const r2 = await post('/api/tts', { text: '小朋友你好**', voice: 'longniuniu_v3', rate: 'slow' }, env);
    assert.equal((await r2.json()).cached, true);
    assert.equal(calls.length, 1);
  });
  it('不在名单里的音色换成默认童声；地址可用 DASHSCOPE_TTS_URL 修改；服务出错返回 502', async () => {
    const { env, calls } = ttsEnv({ output: { audio: { url: 'https://x.example/a.mp3' } } });
    env.DASHSCOPE_TTS_URL = 'https://ws.cn-beijing.maas.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer';
    await post('/api/tts', { text: '你好', voice: 'someone_else' }, env);
    assert.equal(calls[0].body.input.voice, 'longhuhu_v3');
    assert.equal(calls[0].url, env.DASHSCOPE_TTS_URL);
    const bad = ttsEnv({}, 401);
    const r = await post('/api/tts', { text: '出错的一句' }, bad.env);
    assert.equal(r.status, 502);
    const bj = await r.json();
    assert.equal(bj.code, 'TTS_ERROR');
    assert.deepEqual(bj.upstream, { status: 401, detail: 'bad' });
    const empty = ttsEnv({ output: { audio: { url: '' } } });
    assert.equal((await post('/api/tts', { text: '没有地址的一句' }, empty.env)).status, 502);
  });
});

describe('语音合成返回 http 地址', () => {
  it('百炼返回 http:// 的对象存储地址时改成 https://', async () => {
    const env = {
      DASHSCOPE_API_KEY: 'k',
      __fetch: async () =>
        new Response(JSON.stringify({ output: { audio: { data: '', url: 'http://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/prod/a.mp3?Expires=1' } } }), { status: 200 }),
    };
    const d = await (await post('/api/tts', { text: 'http 地址的一句' }, env)).json();
    assert.equal(d.url, 'https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/prod/a.mp3?Expires=1');
  });

  it('朗读单独限频（默认每分钟 90 句），不占用提问的 20 次', async () => {
    const env = {
      DASHSCOPE_API_KEY: 'k',
      __fetch: async () => new Response(JSON.stringify({ output: { audio: { url: 'https://x.example/a.mp3' } } }), { status: 200 }),
    };
    const h = { 'X-Forwarded-For': '9.9.9.9' };
    for (let i = 0; i < 90; i++) assert.equal((await post('/api/tts', { text: `第${i}句` }, env, h)).status, 200);
    assert.equal((await post('/api/tts', { text: '第91句' }, env, h)).status, 429);
    // 同一个 IP 提问不受影响
    const chat = mockEnv('好的');
    assert.equal((await post('/api/tutor/hint', { subject: 'math', grade: 1, question: '1+1', wrong: '3' }, chat.env, h)).status, 200);
  });
});

// ---------------- 拍照错题（V4.1） ----------------

const IMG = 'data:image/jpeg;base64,' + 'A'.repeat(4000) + '==';

/** 模拟百炼视觉模型：记录请求，返回指定内容 */
function vlEnv(reply, { status = 200 } = {}) {
  const calls = [];
  return {
    calls,
    env: {
      DASHSCOPE_API_KEY: 'test-ds',
      __fetch: async (url, init) => {
        calls.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization });
        if (status !== 200) return new Response('{"code":"AccessDenied","message":"Model access denied."}', { status });
        return new Response(JSON.stringify({ choices: [{ message: { content: reply } }] }), { status: 200 });
      },
    },
  };
}

describe('拍照错题：识别', () => {
  const cands = [{ id: 'm1-add10', name: '10以内加法' }, { id: 'm1-sub10', name: '10以内减法' }];

  it('未配置百炼密钥时返回 501 PHOTO_NOT_CONFIGURED', async () => {
    const r = await post('/api/photo/analyze', { image: IMG }, {});
    assert.equal(r.status, 501);
    assert.equal((await r.json()).code, 'PHOTO_NOT_CONFIGURED');
  });

  it('按 OpenAI 兼容格式把照片发给视觉模型，并只接受候选中的知识点', async () => {
    const reply = '```json\n{"subject":"math","question":"7-3=","childAnswer":"5","correctAnswer":"4","kpId":"m1-sub10","reason":"退位没想清楚"}\n```';
    const { env, calls } = vlEnv(reply);
    const r = await post('/api/photo/analyze', { image: IMG, grade: 1, subject: 'math', candidates: cands }, env);
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.question, '7-3=');
    assert.equal(d.childAnswer, '5');
    assert.equal(d.kpId, 'm1-sub10');
    assert.equal(calls[0].url, 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions');
    assert.equal(calls[0].body.model, 'qwen3-vl-plus');
    assert.equal(calls[0].auth, 'Bearer test-ds');
    const content = calls[0].body.messages[1].content;
    assert.equal(content[0].type, 'image_url');
    assert.equal(content[0].image_url.url, IMG);
    assert.match(content[1].text, /m1-sub10=10以内减法/);
  });

  it('模型给出候选以外的知识点时 kpId 为空；文字里的手机号被隐藏', async () => {
    const { env } = vlEnv('{"subject":"math","question":"小明13812345678 算 2+3","kpId":"made-up"}');
    const d = await (await post('/api/photo/analyze', { image: IMG, candidates: cands }, env)).json();
    assert.equal(d.kpId, '');
    assert.ok(!d.question.includes('13812345678'));
  });

  it('照片格式不对或太大时返回 400/413，不调用模型', async () => {
    const { env, calls } = vlEnv('{}');
    assert.equal((await post('/api/photo/analyze', { image: 'http://x/a.jpg' }, env)).status, 400);
    assert.equal((await post('/api/photo/analyze', { image: 'data:image/jpeg;base64,' + 'A'.repeat(1_900_000) }, env)).status, 413);
    assert.equal(calls.length, 0);
  });

  it('其他接口仍然限制 8000 字节', async () => {
    const { env } = mockEnv('x');
    const r = await post('/api/tutor/chat', { messages: [{ role: 'user', content: 'a'.repeat(9000) }] }, env);
    assert.equal(r.status, 413);
  });

  it('百炼拒绝（例如没开通模型）时返回 502 并带回错误原因，不含密钥', async () => {
    const { env } = vlEnv('', { status: 403 });
    const r = await post('/api/photo/analyze', { image: IMG }, env);
    assert.equal(r.status, 502);
    const d = await r.json();
    assert.equal(d.code, 'PHOTO_ERROR');
    assert.equal(d.upstream.status, 403);
    assert.match(d.upstream.detail, /AccessDenied/);
    assert.ok(!JSON.stringify(d).includes('test-ds'));
  });

  it('识别结果不是 JSON 时返回 502', async () => {
    const { env } = vlEnv('看不清楚');
    assert.equal((await post('/api/photo/analyze', { image: IMG }, env)).status, 502);
  });

  it('拍照接口单独限流（默认每分钟 6 次）', async () => {
    const { env } = vlEnv('{"subject":"math","question":"1+1="}');
    for (let i = 0; i < 6; i++) assert.equal((await post('/api/photo/analyze', { image: IMG }, env)).status, 200);
    assert.equal((await post('/api/photo/analyze', { image: IMG }, env)).status, 429);
    // 普通接口不受影响
    const { env: e2 } = mockEnv('好的');
    assert.equal((await post('/api/tutor/chat', { messages: [{ role: 'user', content: '你好' }] }, e2)).status, 200);
  });
});

describe('拍照错题：语文、英语出同类题', () => {
  it('只保留结构正确的题，并标明 AI 生成、未审核', async () => {
    const reply = JSON.stringify([
      { question: 'What colour is the sky?', options: ['blue', 'red', 'green'], answer: 'blue', explain: '天空是蓝色的' },
      { question: '答案不在选项里', options: ['a', 'b', 'c'], answer: 'd' },
      { question: '选项重复', options: ['a', 'a', 'b'], answer: 'a' },
      { question: 'I ___ a pupil.', options: ['am', 'is', 'are'], answer: 'am' },
    ]);
    const { env, calls } = mockEnv(reply);
    const r = await post('/api/photo/similar', { subject: 'english', grade: 3, question: 'What colour is it?', knowledgePoint: '颜色', count: 5 }, env);
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.items.length, 2);
    assert.equal(d.items[1].question, 'I ___ a pupil.'); // 填空横线保留
    assert.equal(d.generatedBy, 'ai');
    assert.equal(d.reviewed, false);
    assert.match(calls[0].body.messages[0].content, /出 5 道/);
  });

  it('数学不走 AI 出题（由 APP 原创出题程序出），返回 400', async () => {
    const { env } = mockEnv('[]');
    assert.equal((await post('/api/photo/similar', { subject: 'math', question: '1+1' }, env)).status, 400);
  });

  it('一道合格的题都没有时返回 502 PHOTO_GEN_INVALID', async () => {
    const { env } = mockEnv('不会出');
    const r = await post('/api/photo/similar', { subject: 'chinese', question: '“日”字有几画？' }, env);
    assert.equal(r.status, 502);
    assert.equal((await r.json()).code, 'PHOTO_GEN_INVALID');
  });

  it('extractJson 能从带说明的回复中取出 JSON', () => {
    assert.deepEqual(extractJson('好的：\n```json\n[{"a":1}]\n```'), [{ a: 1 }]);
    assert.equal(extractJson('没有'), null);
  });
});
