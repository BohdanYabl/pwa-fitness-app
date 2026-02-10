/**
 * Service Worker – offline, Cache API
 * HTML: Network First, fallback to cache
 * Static: Cache First
 */

const CACHE_VERSION = "v14";
const CACHE_NAME = `fitness-tracker-${CACHE_VERSION}`;
const OFFLINE_FALLBACK_URL = "./index.html";

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./progress.html",
  "./profile.html",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "./css/main.css",
  "./css/dashboard.css",
  "./css/progress.css",
  "./css/profile.css",
  "./js/app.js",
  "./js/db.js",
  "./js/utils.js",
  "./js/stats.js",
  "./js/dashboard.js",
  "./js/progress.js",
  "./js/profile.js",
  "./manifest.webmanifest",
  "./images/icons/icon-192x192.png",
  "./images/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
      .catch((err) => console.error("[SW] Install failed:", err)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : null)),
        ),
      )
      .then(() => self.clients.claim())
      .catch((err) => console.error("[SW] Activate failed:", err)),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith("http")) return;

  const isNavigation = event.request.mode === "navigate";

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res?.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match(OFFLINE_FALLBACK_URL)),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          if (res?.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request));
    }),
  );
});
