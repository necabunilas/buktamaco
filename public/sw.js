// Minimal service worker — enables "install to home screen" (PWA).
// Network-first pass-through; no offline caching yet.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // Let the browser handle requests normally.
});