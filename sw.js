const CACHE_NAME = 'nevdarts-v1';
const ASSETS = [
  'index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        try {
          if (request.method === 'GET' && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
        } catch (e) { /* ignore */ }
        return response;
      }).catch(() => caches.match('index.html'));
    })
  );
});