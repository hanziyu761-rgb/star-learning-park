import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import worker, { _resetRateLimit, cleanOutput, DISTRESS_REPLY, FALLBACK_REPLY, scrubPersonalInfo } from '../src/worker.js';

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

beforeEach(() => _resetRateLimit());

describe('健康检查与配置', () => {
  it('未配置密钥时 health 显示 llm=false，业务接口返回 501', async () => {
    const h = await (await worker.fetch(new Request('http://x/api/health'), {})).json();
    assert.deepEqual(h, { ok: true, llm: false, model: 'deepseek-flash' });
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
