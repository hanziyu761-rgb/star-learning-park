'use strict';
// Regression tests for the existing 星星闯关乐园 (V6.7.1).
// They must pass before and after every AI 少年学院 change.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { startServer, login, ROOT } = require('../helpers/server');

// Fingerprints of the legacy front-end files at v6.7.1-stable (5c867d5).
// If one of these changes, it must be a deliberate, separately reviewed commit.
const LEGACY_FILES = {
  'index.html': '5ed91eeb3394eff1b002f1eedcbe903f754457f795eb723193a954e4c68f8a81',
  'sw.js': '51c572187e911ef101023a931fda5cc62ea70902cf72748c26218009b9483e78',
  'manifest.webmanifest': 'cf97e1714b3565374588783e6cc912583a84c038b6c1203e6ef3f386f2d2790f',
  'icon-192.png': '968becff8054c8afd5a33b9059d6100b09619315b108ac1a66459b307723b5c4',
  'icon-512.png': '5109b35fa34aabe4b6290de48563a657a47b18661a66b07efdf1ece919c1adaa',
};

const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, p))).digest('hex');

test('legacy front-end files are byte-for-byte unchanged', () => {
  for (const [file, hash] of Object.entries(LEGACY_FILES)) {
    assert.equal(sha256(file), hash, `${file} was modified`);
  }
});

test('legacy app still uses its own storage key and is not touched by the academy', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /const STORE='star-adventure-v4'/);
});

test.describe('legacy server behaviour', () => {
  let srv;
  test.before(async () => { srv = await startServer(); });
  test.after(async () => { await srv.stop(); });

  test('health check is public', async () => {
    const r = await fetch(srv.base + '/health');
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
  });

  test('home page redirects to login without a session', async () => {
    const r = await fetch(srv.base + '/', { redirect: 'manual' });
    assert.equal(r.status, 302);
    assert.equal(r.headers.get('location'), '/login');
  });

  test('login page renders with security headers', async () => {
    const r = await fetch(srv.base + '/login');
    assert.equal(r.status, 200);
    assert.match(await r.text(), /家长访问码/);
    assert.match(r.headers.get('content-security-policy') || '', /default-src 'self'/);
    assert.equal(r.headers.get('x-frame-options'), 'DENY');
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  });

  test('wrong access code is rejected', async () => {
    const { response, cookie } = await login(srv.base, 'definitely-wrong-code');
    assert.equal(response.status, 401);
    assert.equal(cookie, '');
  });

  test('correct access code issues an HttpOnly session cookie', async () => {
    const { response } = await login(srv.base);
    assert.equal(response.status, 303);
    const setCookie = response.headers.get('set-cookie') || '';
    assert.match(setCookie, /^star_session=/);
    assert.match(setCookie, /HttpOnly/);
  });

  test('logged-in session gets the unchanged legacy files', async () => {
    const { cookie } = await login(srv.base);
    for (const [route, file] of [['/', 'index.html'], ['/index.html', 'index.html'], ['/sw.js', 'sw.js'], ['/manifest.webmanifest', 'manifest.webmanifest'], ['/icon-192.png', 'icon-192.png'], ['/icon-512.png', 'icon-512.png']]) {
      const r = await fetch(srv.base + route, { headers: { cookie } });
      assert.equal(r.status, 200, route);
      const body = Buffer.from(await r.arrayBuffer());
      assert.ok(body.equals(fs.readFileSync(path.join(ROOT, file))), `${route} content differs`);
    }
  });

  test('files outside the whitelist are not served', async () => {
    const { cookie } = await login(srv.base);
    for (const route of ['/server.js', '/package.json', '/render.yaml', '/.env', '/../server.js']) {
      const r = await fetch(srv.base + route, { headers: { cookie } });
      assert.equal(r.status, 404, route);
    }
  });

  test('tutor API requires a session', async () => {
    const r = await fetch(srv.base + '/api/tutor/status');
    assert.equal(r.status, 401);
  });

  test('tutor status reports no key when none is configured', async () => {
    const { cookie } = await login(srv.base);
    const r = await fetch(srv.base + '/api/tutor/status', { headers: { cookie } });
    assert.equal(r.status, 200);
    const data = await r.json();
    assert.equal(data.available, false);
  });

  test('tutor chat without a key returns 503, never a fake answer', async () => {
    const { cookie } = await login(srv.base);
    const r = await fetch(srv.base + '/api/tutor/chat', {
      method: 'POST', headers: { cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '你好', context: { subject: 'math' } }),
    });
    assert.equal(r.status, 503);
  });

  test('cross-origin POST is blocked', async () => {
    const { cookie } = await login(srv.base);
    const r = await fetch(srv.base + '/api/tutor/chat', {
      method: 'POST', headers: { cookie, origin: 'https://evil.example', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hi' }),
    });
    assert.equal(r.status, 403);
  });
});

test('login is rate-limited after repeated wrong codes', async () => {
  const srv = await startServer();
  try {
    let last;
    for (let i = 0; i < 8; i++) last = (await login(srv.base, 'wrong-code-' + i)).response;
    assert.equal(last.status, 429);
  } finally {
    await srv.stop();
  }
});
