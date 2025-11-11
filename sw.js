const CACHE_NAME = 'nevdarts-dev-v3';
const CORE_ASSETS = ['index.html'];

self.addEventListener('install', (event) => {
  // Precache minimal core and take control immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Network-first strategy to ensure latest changes appear immediately during development
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return; // let non-GETs pass through

  event.respondWith(
    // Force revalidation for index.html to avoid showing stale app flow on deploys
    (request.url.endsWith('/index.html') || new URL(request.url).pathname.endsWith('/'))
      ? fetch(new Request(request, { cache: 'reload' }))
      : fetch(request)
      .then((response) => {
        // Cache a copy for offline fallback
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Last resort: cached index
        return caches.match('index.html');
      })
  );
});