'use strict';
// Tests for the /academy/ mount (server/academy.js) through the real server.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { startServer, login } = require('./helpers/server');

function fakeDist() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-dist-'));
  fs.mkdirSync(path.join(dir, 'assets'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>AI 少年学院</title><div id="root"></div>');
  fs.writeFileSync(path.join(dir, 'assets', 'app-abc.js'), 'console.log(1)');
  fs.writeFileSync(path.join(dir, 'sw.js'), '// sw');
  fs.mkdirSync(path.join(dir, 'pyodide'));
  fs.writeFileSync(path.join(dir, 'pyodide', 'pyodide.asm.wasm'), Buffer.from([0, 97, 115, 109]));
  fs.writeFileSync(path.join(dir, 'pyodide', 'pyodide.mjs'), 'export {}');
  return dir;
}

test.describe('academy mount with a build present', () => {
  let srv, cookie, dist;
  test.before(async () => {
    dist = fakeDist();
    srv = await startServer({ ACADEMY_DIST: dist });
    cookie = (await login(srv.base)).cookie;
  });
  test.after(async () => { await srv.stop(); fs.rmSync(dist, { recursive: true, force: true }); });

  test('academy requires the parent login like the rest of the site', async () => {
    const r = await fetch(srv.base + '/academy/', { redirect: 'manual' });
    assert.equal(r.status, 302);
    assert.equal(r.headers.get('location'), '/login');
    const api = await fetch(srv.base + '/api/academy/health');
    assert.equal(api.status, 401);
  });

  test('/academy redirects to /academy/', async () => {
    const r = await fetch(srv.base + '/academy', { headers: { cookie }, redirect: 'manual' });
    assert.equal(r.status, 301);
    assert.equal(r.headers.get('location'), '/academy/');
  });

  test('app shell is served with security headers and no-cache', async () => {
    const r = await fetch(srv.base + '/academy/', { headers: { cookie } });
    assert.equal(r.status, 200);
    assert.match(await r.text(), /AI 少年学院/);
    assert.match(r.headers.get('content-security-policy') || '', /default-src 'self'/);
    assert.equal(r.headers.get('cache-control'), 'no-cache');
  });

  test('hashed assets are served with long cache, sw.js with no-cache', async () => {
    const a = await fetch(srv.base + '/academy/assets/app-abc.js', { headers: { cookie } });
    assert.equal(a.status, 200);
    assert.match(a.headers.get('content-type'), /javascript/);
    assert.match(a.headers.get('cache-control'), /immutable/);
    const sw = await fetch(srv.base + '/academy/sw.js', { headers: { cookie } });
    assert.equal(sw.status, 200);
    assert.equal(sw.headers.get('cache-control'), 'no-cache');
  });

  test('client routes fall back to the app shell, missing assets are 404', async () => {
    const r = await fetch(srv.base + '/academy/lesson/g1-l1', { headers: { cookie } });
    assert.equal(r.status, 200);
    assert.match(await r.text(), /AI 少年学院/);
    const miss = await fetch(srv.base + '/academy/assets/missing.js', { headers: { cookie } });
    assert.equal(miss.status, 404);
  });

  test('path traversal and dotfiles are refused', async () => {
    for (const p of ['/academy/..%2fserver.js', '/academy/%2e%2e/server.js', '/academy/.env', '/academy/assets/..%2f..%2fserver.js', '/academy/%00']) {
      const r = await fetch(srv.base + p, { headers: { cookie } });
      assert.equal(r.status, 404, p);
      assert.doesNotMatch(await r.text(), /use strict/, p);
    }
  });

  test('only GET/HEAD are allowed on academy files', async () => {
    const r = await fetch(srv.base + '/academy/', { method: 'POST', headers: { cookie }, body: 'x' });
    assert.equal(r.status, 405);
  });

  test('academy pages allow WebAssembly for Python; the legacy app keeps its stricter policy', async () => {
    const a = await fetch(srv.base + '/academy/', { headers: { cookie } });
    const acsp = a.headers.get('content-security-policy') || '';
    assert.match(acsp, /'wasm-unsafe-eval'/);
    assert.match(acsp, /worker-src 'self'/);
    assert.match(acsp, /connect-src 'self'/);
    assert.doesNotMatch(acsp, /'unsafe-eval'(?!.)|[^-]'unsafe-eval'/);
    const legacy = await fetch(srv.base + '/', { headers: { cookie } });
    assert.doesNotMatch(legacy.headers.get('content-security-policy') || '', /wasm-unsafe-eval/);
  });

  test('Python runtime files are served with the right types', async () => {
    const w = await fetch(srv.base + '/academy/pyodide/pyodide.asm.wasm', { headers: { cookie } });
    assert.equal(w.status, 200);
    assert.equal(w.headers.get('content-type'), 'application/wasm');
    assert.match(w.headers.get('cache-control'), /max-age=604800/);
    const m = await fetch(srv.base + '/academy/pyodide/pyodide.mjs', { headers: { cookie } });
    assert.match(m.headers.get('content-type'), /javascript/);
  });

  test('health reports honestly that no AI model is used', async () => {
    const r = await fetch(srv.base + '/api/academy/health', { headers: { cookie } });
    assert.equal(r.status, 200);
    const data = await r.json();
    assert.equal(data.ok, true);
    assert.equal(data.built, true);
    assert.equal(data.aiMode, 'none');
  });

  test('unknown academy API paths are 404, not forwarded anywhere', async () => {
    const r = await fetch(srv.base + '/api/academy/teacher', { headers: { cookie } });
    assert.equal(r.status, 404);
  });

  test('legacy routes are untouched by the mount', async () => {
    const home = await fetch(srv.base + '/', { headers: { cookie } });
    assert.equal(home.status, 200);
    assert.match(await home.text(), /star-adventure-v4/);
    const tutor = await fetch(srv.base + '/api/tutor/status', { headers: { cookie } });
    assert.equal(tutor.status, 200);
  });
});

test('without a build, /academy/ explains how to build and the legacy app still works', async () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-empty-'));
  const srv = await startServer({ ACADEMY_DIST: empty });
  try {
    const { cookie } = await login(srv.base);
    const r = await fetch(srv.base + '/academy/', { headers: { cookie } });
    assert.equal(r.status, 503);
    assert.match(await r.text(), /build:academy/);
    const home = await fetch(srv.base + '/', { headers: { cookie } });
    assert.equal(home.status, 200);
  } finally {
    await srv.stop();
    fs.rmSync(empty, { recursive: true, force: true });
  }
});
