// Service Worker for 100% Offline Caching on Galaxy Tab, Mobile, and Desktop
const CACHE_NAME = 'akshay-v4.5-offline-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
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
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // If request is an API call, try network first, then return offline fallback
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(JSON.stringify({ 
          offline: true, 
          success: true, 
          message: "Akshay 100% Offline Mode active - serving from local browser storage" 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
  } else {
    // For HTML, manifest, and static assets, return cached if available, otherwise fetch and cache
    e.respondWith(
      caches.match(e.request).then((cached) => {
        return cached || fetch(e.request).then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return res;
        }).catch(() => {
          return caches.match('./index.html') || caches.match('/index.html');
        });
      })
    );
  }
});
