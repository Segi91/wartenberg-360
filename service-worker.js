const CACHE='wartenberg360-v2';
const CORE=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key!==CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const req=event.request; if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin) return;
  event.respondWith(fetch(req).then(res=>{if(res.ok){const clone=res.clone();caches.open(CACHE).then(cache=>cache.put(req,clone));}return res;}).catch(()=>caches.match(req).then(cached=>cached||caches.match('./index.html'))));
});
