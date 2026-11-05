// Service Worker for 100% Offline Caching on Galaxy Tab, Mobile, and Desktop
const CACHE_NAME = 'akshay-v4.5-offline-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './portal-applied-view.html',
  './manifest.json',
  './data/applied_jobs_sample.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) {
            return caches.delete(k);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network first for APIs, fallback to cache for static shell
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        return cached || fetch(e.request).then((resp) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resp.clone());
            return resp;
          });
        });
      })
    );
  }
});
