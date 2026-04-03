const CACHE_VERSION = 'v4';
const STATIC_CACHE_NAME = `lnkmx-static-${CACHE_VERSION}`;
const ASSETS_CACHE_NAME = `lnkmx-assets-${CACHE_VERSION}`;
const RUNTIME_IMAGE_CACHE_NAME = `lnkmx-images-${CACHE_VERSION}`;
const API_CACHE_NAME = `lnkmx-api-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS_TO_CACHE = [
  '/',
  '/favicon.png',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
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
        const isCurrent = [STATIC_CACHE_NAME, ASSETS_CACHE_NAME, RUNTIME_IMAGE_CACHE_NAME, API_CACHE_NAME].includes(cacheName);
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
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  
  // 1. Skip non-GET requests
  if (request.method !== 'GET') return;

  // 2. Navigation / HTML - Always Network-First
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // 3. Static Assets (JS, CSS) - Stale-While-Revalidate
  if (isSameOrigin && (url.pathname.includes('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
    event.respondWith(staleWhileRevalidate(request, ASSETS_CACHE_NAME));
    return;
  }

  // 4. Images - Stale-While-Revalidate
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_IMAGE_CACHE_NAME));
    return;
  }

  // 5. Supabase API / Data - Network-First with Cache Fallback
  // We only cache GET requests that look like data fetches
  if (url.hostname.includes('supabase.co') && request.headers.get('apikey')) {
    event.respondWith(
      fetch(request.clone())
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 6. Default - Network First
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

/**
 * Helper for Stale-While-Revalidate strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || networkPromise;
}
