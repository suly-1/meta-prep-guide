// Meta Prep Guide — Service Worker (Offline-first cache strategy)
const CACHE_NAME = "meta-prep-v2";

// App shell files to pre-cache on install
const PRECACHE_URLS = ["/", "/manifest.json", "/favicon.ico"];

// ── Install: pre-cache shell ────────────────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ─────────────────────────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ────────────────────
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Never intercept API calls — always go to network
  if (url.pathname.startsWith("/api/")) return;

  // For navigation requests (HTML pages): network-first, fall back to cache
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // For static assets (JS, CSS, fonts, images): stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});
