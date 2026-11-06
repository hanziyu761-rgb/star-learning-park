/**
 * 在阿里云函数计算（FC 3.0 · Web 函数）或任意国内服务器上运行星星 AI 服务。
 * 与 Cloudflare 版共用同一份 src/worker.js，接口完全相同。
 *
 *   启动命令：node fc-server.mjs
 *   监听端口：FC_SERVER_PORT 或 PORT，默认 9000（函数计算 Web 函数的默认端口）
 *   环境变量：DEEPSEEK_API_KEY（必填，只在服务器上配置，不要写进代码）
 *             DASHSCOPE_API_KEY（可选，阿里云百炼密钥：星星宝用 CosyVoice 自然语音朗读）
 *             DEEPSEEK_MODEL（可选，默认 deepseek-flash）、RATE_LIMIT_PER_MINUTE（可选，默认 20）
 */
import http from 'node:http';
import worker from './src/worker.js';

const env = {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
  RATE_LIMIT_PER_MINUTE: process.env.RATE_LIMIT_PER_MINUTE,
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL, // 可选：仅测试或代理时使用
  DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY, // 可选：阿里云百炼密钥，用于星星宝的自然语音（V2.18）
  DASHSCOPE_TTS_URL: process.env.DASHSCOPE_TTS_URL,
  TTS_MODEL: process.env.TTS_MODEL,
};

const port = Number(process.env.FC_SERVER_PORT || process.env.PORT || 9000);

export const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
    // 频率限制按访问者 IP：取 X-Forwarded-For 的第一个地址
    const fwd = headers.get('x-forwarded-for');
    const ip = (fwd ? fwd.split(',')[0].trim() : '') || req.socket.remoteAddress || 'local';
    headers.set('CF-Connecting-IP', ip);
    const request = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const response = await worker.fetch(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    console.log(JSON.stringify({ error: String(e && e.message) }));
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: '服务出错', code: 'SERVER' }));
  }
});

if (process.env.NODE_TEST !== '1') {
  server.listen(port, '0.0.0.0', () =>
    console.log(`星星 AI 服务已启动，端口 ${port}（DeepSeek 密钥${env.DEEPSEEK_API_KEY ? '已配置' : '未配置'}）`),
  );
}
