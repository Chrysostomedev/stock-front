// Service Worker for SP Service PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through handler: allows the browser to count the app as offline-capable
  // without interfering with dynamic real-time API queries.
});
