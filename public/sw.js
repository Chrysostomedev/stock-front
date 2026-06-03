// Service Worker — SP Services PWA
// Stratégie : cache-first pour assets statiques, network-first pour navigation

const CACHE_VERSION = "sp-v2";
const SHELL_CACHE   = `sp-shell-${CACHE_VERSION}`;
const STATIC_CACHE  = `sp-static-${CACHE_VERSION}`;

// Pages à précacher dès l'installation
const PRECACHE = ["/", "/login"];

// ── Install : précacher l'app shell ──────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // addAll en mode no-cors pour éviter les erreurs sur certains assets
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// ── Activate : supprimer les vieux caches ─────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch : stratégie par type de ressource ────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ignorer les requêtes non-GET
  if (request.method !== "GET") return;

  // 2. Ignorer les appels API externes (gérés par offline-wrapper.ts)
  if (url.hostname !== self.location.hostname) return;

  // 3. Assets Next.js (/_next/static/) → immuables → cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // 4. Navigation (HTML pages) → network-first, fallback cache → fallback "/"
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then((c) => c || caches.match("/"))
        )
    );
    return;
  }

  // 5. Autres ressources (images, fonts, etc.) → network-first avec fallback cache
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
