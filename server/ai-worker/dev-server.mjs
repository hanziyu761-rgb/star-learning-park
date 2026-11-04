/**
 * 本地运行 AI 服务（Node 22+）：
 *   DEEPSEEK_API_KEY=sk-xxx node dev-server.mjs      使用真实 DeepSeek
 *   MOCK_LLM=1 node dev-server.mjs                    不调用 DeepSeek，返回固定的测试回复（仅用于联调）
 * 默认端口 8788，可用 PORT 修改。
 */
import http from 'node:http';
import worker from './src/worker.js';

const env = {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
  RATE_LIMIT_PER_MINUTE: process.env.RATE_LIMIT_PER_MINUTE ?? '60',
};
if (process.env.MOCK_LLM) {
  env.DEEPSEEK_API_KEY = 'mock';
  env.__fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    const sys = body.messages[0].content;
    const reply = sys.includes('请求提示')
      ? '【测试回复】先数一数第一组有几个，再接着往后数。'
      : sys.includes('已经答对')
        ? '【测试回复】因为两组合起来就是加法，你算对啦！'
        : sys.includes('教研老师')
          ? '【测试回复】孩子在比多少上还不熟练。\n1. 用积木比一比\n2. 每天说一说谁多谁少\n3. 多表扬'
          : '【测试回复】你好呀，我是星星宝！你想学什么？';
    return new Response(JSON.stringify({ choices: [{ message: { content: reply }, finish_reason: 'stop' }] }), { status: 200 });
  };
  console.log('⚠️ MOCK_LLM 模式：不会调用 DeepSeek，所有回复都是固定测试文本');
}

const port = Number(process.env.PORT || 8788);
http
  .createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(`http://localhost:${port}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const response = await worker.fetch(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  })
  .listen(port, () => console.log(`星星 AI 服务：http://localhost:${port}  （DeepSeek ${env.DEEPSEEK_API_KEY ? '已配置' : '未配置'}）`));
