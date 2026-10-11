const CACHE = 'wartenberg360-v11-places90';
const CORE = ['./', './index.html', './style.css?v=20261011-places90', './app.js?v=20261011-places90', './news.json','./data/events.json', './data/places.json', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => Promise.allSettled(CORE.map(url => cache.add(url)))).then(() => self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(name => name !== CACHE ? caches.delete(name) : Promise.resolve()))).then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const names = {'/news.json':'./news.json','/data/events.json':'./data/events.json','/data/places.json':'./data/places.json'};
  const path = url.pathname;
  const canonical = Object.keys(names).find(suffix => path.endsWith(suffix));
  const key = canonical ? names[canonical] : req;
  event.respondWith(
    fetch(req).then(response => {
      if(response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(key, copy)).catch(() => {}));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(key);
      if (cached) return cached;
      if (req.mode === 'navigate') return (await caches.match('./index.html')) || Response.error();
      return Response.error();
    })
  );
});
