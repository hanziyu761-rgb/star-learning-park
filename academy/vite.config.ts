/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';

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
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ai-academy-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith('/academy/'))return;
 if(req.mode==='navigate'){e.respondWith(fetch(req).catch(()=>caches.match('./')));return;}
 e.respondWith(caches.match(req).then(hit=>hit||fetch(req)));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: code });
    },
  };
}

export default defineConfig({
  base: '/academy/',
  plugins: [react(), academyServiceWorker()],
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: false, target: 'es2020' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
