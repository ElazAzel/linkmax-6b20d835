const CACHE_VERSION = 'v3';
const STATIC_CACHE_NAME = `lnkmx-static-${CACHE_VERSION}`;
const RUNTIME_IMAGE_CACHE_NAME = `lnkmx-images-${CACHE_VERSION}`;

const STATIC_ASSETS_TO_CACHE = [
  '/favicon.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        const isLnkmxCache = cacheName.startsWith('lnkmx-') || cacheName.startsWith('linkmax-');
        const isCurrent = cacheName === STATIC_CACHE_NAME || cacheName === RUNTIME_IMAGE_CACHE_NAME;
        if (isLnkmxCache && !isCurrent) {
          return caches.delete(cacheName);
        }
        return Promise.resolve();
      })
    ))
  );

  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const isSameOrigin = request.url.startsWith(self.location.origin);

  if (!isSameOrigin || request.method !== 'GET') return;

  // Navigation/documents must be network-first to avoid stale app shell/chunk mismatches
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache only images with stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(RUNTIME_IMAGE_CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
