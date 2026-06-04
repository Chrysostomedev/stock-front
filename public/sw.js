// Service Worker — SP Services PWA
// À tester UNIQUEMENT sur le build de production (npm run build)
// En mode dev (localhost), ce fichier est ignoré par PwaRegister.tsx

const CACHE_VERSION = "sp-v2";
const SHELL_CACHE   = `sp-shell-${CACHE_VERSION}`;
const STATIC_CACHE  = `sp-static-${CACHE_VERSION}`;

// ── Install : précacher les pages principales ─────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(["/", "/login"].map((url) => cache.add(url)))
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

// ── Fetch ──────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== "GET") return;

  // Ignorer les appels API externes (gérés par offline-wrapper.ts côté app)
  if (url.hostname !== self.location.hostname) return;

  // Ignorer les WebSocket HMR (développement uniquement)
  if (url.pathname.includes("webpack-hmr")) return;

  // ── Assets statiques Next.js (/_next/static/) ─────────────────
  // Immuables (hash dans le nom) → cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request)
          .then((res) => {
            if (res.status === 200) {
              // ⚠ Cloner SYNCHRONEMENT avant de retourner res.
              // Si on clone dans un .then() imbriqué (asynchrone), le navigateur
              // peut avoir déjà consommé le body → "Response body is already used".
              const clone = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
            }
            return res;
          })
          .catch(() => new Response("", { status: 408, statusText: "Offline" }));
      })
    );
    return;
  }

  // ── Navigation (pages HTML) ────────────────────────────────────
  // Network-first → cache fallback → racine "/"
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.status === 200) {
            const clone = res.clone(); // ← clone synchrone
            caches.open(SHELL_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(request)
            .then((c) => c || caches.match("/"))
            .then((c) => c || new Response("Hors ligne", { status: 503 }))
        )
    );
    return;
  }

  // ── Autres ressources (images, fonts, manifest…) ───────────────
  // Network-first avec fallback cache
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.status === 200) {
          const clone = res.clone(); // ← clone synchrone
          caches.open(SHELL_CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then((c) => c || new Response("", { status: 408 }))
      )
  );
});
