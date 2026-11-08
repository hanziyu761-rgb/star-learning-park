'use strict';
// Starts the real server.js on a free port for tests. No mocks: the same
// file that runs on Render is the one under test.
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const FAMILY_CODE = 'test-family-code-2026';
const SESSION_SECRET = 'x'.repeat(40);

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function startServer(extraEnv = {}) {
  const port = await freePort();
  const env = {
    PATH: process.env.PATH,
    HOST: '127.0.0.1',
    PORT: String(port),
    FAMILY_ACCESS_CODE: FAMILY_CODE,
    SESSION_SECRET,
    DEEPSEEK_API_KEY: '',
    ...extraEnv,
  };
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (d) => { output += d; });
  child.stderr.on('data', (d) => { output += d; });
  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(base + '/health');
      if (r.ok) break;
    } catch { /* not up yet */ }
    if (child.exitCode !== null) throw new Error('server exited early:\n' + output);
    await new Promise((r) => setTimeout(r, 100));
  }
  return {
    base,
    stop: () => new Promise((resolve) => {
      if (child.exitCode !== null) return resolve();
      child.once('exit', resolve);
      child.kill();
    }),
    output: () => output,
  };
}

async function login(base, code = FAMILY_CODE) {
  const r = await fetch(base + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'code=' + encodeURIComponent(code),
    redirect: 'manual',
  });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
  return { response: r, cookie };
}

module.exports = { startServer, login, ROOT, FAMILY_CODE };
