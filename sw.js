/**
 * sw.js — Service Worker Kill-Switch
 *
 * Unregisters any previously installed Workbox service worker and clears all
 * caches. The old SW may be serving stale cached files with outdated chunk
 * hashes, causing a blank white page.
 *
 * Uses postMessage to ask the page to reload (guarded by sessionStorage) so
 * the reload only happens once per session, preventing infinite reload loops.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear ALL caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // Claim all clients immediately
      await clients.claim();

      // Unregister this SW so it never intercepts future requests
      await self.registration.unregister();

      // Ask each window client to reload — the page guards against loops
      // via sessionStorage so it only reloads once per session
      const allClients = await clients.matchAll({ type: 'window' });
      for (const client of allClients) {
        client.postMessage({ type: 'SW_KILL_SWITCH_ACTIVATED' });
      }
    })()
  );
});
