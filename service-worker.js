const CACHE='wartenberg360-v3';
const CORE=['./','./index.html','./style.css','./app.js','./news.json','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key!==CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const req=event.request; if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin) return;
  const url=new URL(req.url);
  const isNews=url.pathname.endsWith('/news.json');
  const cacheKey=isNews?'./news.json':req;
  event.respondWith(fetch(req).then(res=>{
    if(res.ok){const clone=res.clone();caches.open(CACHE).then(cache=>cache.put(cacheKey,clone));}
    return res;
  }).catch(()=>caches.match(cacheKey).then(cached=>cached||(req.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
