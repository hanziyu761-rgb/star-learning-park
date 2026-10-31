// Cache only authorized learning assets after visiting the app while online.
const VERSION='star-park-v6.2-interactive-world-20261031';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('star-park-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname==='/health'||url.pathname==='/login'||url.pathname==='/logout')return;
 event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(resp=>{
  if(resp.ok&&resp.type==='basic')caches.open(VERSION).then(cache=>cache.put(request,resp.clone()));
  return resp;
 }).catch(()=>request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});
