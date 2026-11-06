// Returnly service worker: fetch fresh website files when online, cache for offline use.
// Does not touch localStorage, saved returns, or retailer settings.
const CACHE_NAME = 'returnly-v5-network-first';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './auth.js', './note.js', './manifest.json', './icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('returnly-') && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request, {cache: 'no-store'});
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (err) {
      const cached = await cache.match(request, {ignoreSearch: request.mode === 'navigate'});
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
