/* Service worker Nusantara DataHub — offline dasar tanpa library.
 *
 * Strategi:
 * - Navigasi (HTML): network-first, jatuh ke cache bila offline.
 * - Aset statis (/_next/static, ikon, manifest): cache-first.
 * - API (/api/*): network-only (data harus segar; jangan sajikan angka lama).
 */
const VERSION = "ndh-v1";
const PAGES_CACHE = `${VERSION}-pages`;
const ASSETS_CACHE = `${VERSION}-assets`;

const PRECACHE_PAGES = ["/", "/glosarium", "/gempa", "/cuaca", "/katalog"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) => cache.addAll(PRECACHE_PAGES).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // data selalu dari jaringan

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          return response;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match("/")) ?? Response.error()),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || /\.(css|js|svg|png|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(ASSETS_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
            return response;
          }),
      ),
    );
  }
});
