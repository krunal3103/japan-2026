/* Japan 2026 — Service Worker
   Strategy: Cache-first with background revalidation (stale-while-revalidate)
   - First open: fetches and caches everything
   - Subsequent opens: serves instantly from cache, silently updates in background
   - Offline: serves from cache with no network needed
*/

const CACHE = 'japan-2026-v2';
const ASSETS = [
  './',
  './japan_itinerary_2026.html'
];

/* Install: cache all assets immediately */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

/* Activate: delete old cache versions */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* Fetch: serve from cache instantly, revalidate in background */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.open(CACHE).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        var networkFetch = fetch(e.request).then(function(response) {
          if (response && response.status === 200) {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(function() { return cached; });

        /* Serve cached immediately; network updates cache silently */
        return cached || networkFetch;
      });
    })
  );
});
