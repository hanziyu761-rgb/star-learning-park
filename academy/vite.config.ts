/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Pyodide (Python in the browser) is served from our own site, never a CDN.
const PYODIDE_FILES = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
const PYODIDE_VERSION = JSON.parse(readFileSync(join(__dirname, 'node_modules/pyodide/package.json'), 'utf8')).version as string;
function copyPyodide(): Plugin {
  return {
    name: 'copy-pyodide',
    apply: 'build',
    writeBundle(opts) {
      const out = join(opts.dir ?? 'dist', 'pyodide');
      mkdirSync(out, { recursive: true });
      for (const f of PYODIDE_FILES) copyFileSync(join(__dirname, 'node_modules/pyodide', f), join(out, f));
    },
  };
}

// Emits /academy/sw.js with the exact list of built files, so every lesson
// opened once keeps working offline. The cache name is derived from the file
// list, so a new build replaces the old cache. Cache prefix is "ai-academy-"
// to stay clear of the legacy app's "star-park-" caches.
function academyServiceWorker(): Plugin {
  return {
    name: 'academy-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const assets = ['./', ...files.filter((f) => f !== 'index.html').map((f) => './' + f)];
      const version = 'ai-academy-' + createHash('sha256').update(files.sort().join('|')).digest('hex').slice(0, 12);
      const code = `// Generated at build time. Scope: /academy/ only.
const VERSION=${JSON.stringify(version)};
const PY_CACHE=${JSON.stringify('academy-pyodide-' + PYODIDE_VERSION)};
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ai-academy-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith('/academy/'))return;
 if(req.mode==='navigate'){e.respondWith(fetch(req).catch(()=>caches.match('./')));return;}
 // Python runtime (~13 MB): cached on first use, kept across app updates.
 if(url.pathname.startsWith('/academy/pyodide/')){e.respondWith(caches.open(PY_CACHE).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r;}))));return;}
 e.respondWith(caches.match(req).then(hit=>hit||fetch(req)));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: code });
    },
  };
}

// App mode (`vite build --mode app`) builds the Android app's bundle: served
// from the app's own root, no service worker (everything is already inside the
// installed app), and a strict content policy in the page itself, because in
// the app there is no server to send one. connect-src 'self' means the page
// cannot contact any outside website.
const APP_CSP = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";
function appCsp(): Plugin {
  return {
    name: 'app-csp',
    transformIndexHtml: (html) => html.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${APP_CSP}" />`),
  };
}

export default defineConfig(({ mode }) => ({
  base: mode === 'app' ? '/' : '/academy/',
  plugins: mode === 'app' ? [react(), appCsp(), copyPyodide()] : [react(), academyServiceWorker(), copyPyodide()],
  worker: { format: 'es' },
  build: { outDir: mode === 'app' ? 'dist-app' : 'dist', emptyOutDir: true, sourcemap: false, target: 'es2020' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
}));
