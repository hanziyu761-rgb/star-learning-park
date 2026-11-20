'use strict';
// AI 少年学院 (AI Kids Academy) routes. Mounted by server.js AFTER the family
// access-code check, so everything here is already behind the parent login.
// Handles only /academy and /api/academy/*; returns false for anything else so
// the legacy routes keep working exactly as before.
const fs = require('node:fs');
const path = require('node:path');

const DIST = path.resolve(process.env.ACADEMY_DIST || path.join(__dirname, '..', 'academy', 'dist'));
const VERSION = '2.0.0';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
};

// The academy runs Python (Pyodide, WebAssembly) in a same-origin worker. This
// needs 'wasm-unsafe-eval' and worker-src. It is applied ONLY to /academy/
// responses; the legacy app keeps its original, stricter policy.
const ACADEMY_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:; connect-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function notBuilt(res) {
  res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end('<!doctype html><meta charset="utf-8"><title>AI 少年学院</title><p style="font-family:system-ui;padding:24px">AI 少年学院还没有构建。请在项目目录运行 <code>npm run build:academy</code> 后重启。<br><a href="/">返回星星闯关乐园</a></p>');
}

// Resolve a request path under /academy/ to a file in academy/dist, refusing
// anything that escapes the folder (../, encoded slashes, dotfiles).
function resolveFile(pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname.slice('/academy/'.length)); } catch { return null; }
  if (rel === '') rel = 'index.html';
  if (rel.includes('\0') || rel.split('/').some((part) => part === '..' || part.startsWith('.'))) return null;
  const full = path.resolve(DIST, rel);
  if (full !== DIST && !full.startsWith(DIST + path.sep)) return null;
  return full;
}

function serveFile(req, res, full, isIndex) {
  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) return sendJson(res, 404, { error: 'not found' });
    const ext = path.extname(full);
    const immutable = full.includes(path.sep + 'assets' + path.sep);
    const pyodide = full.includes(path.sep + 'pyodide' + path.sep);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': (isIndex || path.basename(full) === 'sw.js') ? 'no-cache'
        : immutable ? 'private, max-age=31536000, immutable'
        : pyodide ? 'private, max-age=604800' : 'private, max-age=300',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(full).on('error', () => res.destroy()).pipe(res);
  });
}

/** @returns {boolean} true when this module handled the request */
function handle(req, res, pathname) {
  if (pathname === '/api/academy/health') {
    if (req.method !== 'GET') { sendJson(res, 405, { error: 'GET only' }); return true; }
    // V1 makes no AI calls. aiMode is reported honestly so the UI never
    // presents simulated content as a real model.
    sendJson(res, 200, { ok: true, version: VERSION, built: fs.existsSync(path.join(DIST, 'index.html')), aiMode: 'none' });
    return true;
  }
  if (pathname.startsWith('/api/academy/')) { sendJson(res, 404, { error: 'not found' }); return true; }
  if (pathname === '/academy') { res.writeHead(301, { Location: '/academy/' }); res.end(); return true; }
  if (!pathname.startsWith('/academy/')) return false;
  res.setHeader('Content-Security-Policy', ACADEMY_CSP);

  if (req.method !== 'GET' && req.method !== 'HEAD') { sendJson(res, 405, { error: 'Method not allowed' }); return true; }
  if (!fs.existsSync(path.join(DIST, 'index.html'))) { notBuilt(res); return true; }
  const full = resolveFile(pathname);
  if (!full) { sendJson(res, 404, { error: 'not found' }); return true; }
  // Unknown non-asset paths fall back to the app shell (client-side routes).
  if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    if (path.extname(full)) { sendJson(res, 404, { error: 'not found' }); return true; }
    serveFile(req, res, path.join(DIST, 'index.html'), true);
    return true;
  }
  serveFile(req, res, full, full === path.join(DIST, 'index.html'));
  return true;
}

module.exports = { handle, VERSION };
