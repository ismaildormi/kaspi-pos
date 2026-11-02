const CACHE_NAME = "kaspi-pos-app-shell-v2";
const STATIC_CACHE = "kaspi-pos-static-v2";
const API_CACHE = "kaspi-pos-api-v2";

const PRECACHE_URLS = [
  "/",
  "/pos",
  "/ar/pos",
  "/fr/pos",
  "/en/pos",
  "/dashboard",
  "/download",
  "/logo.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url, { credentials: "same-origin" }).then((res) => {
            if (res.ok) {
              return cache.put(url, res);
            }
          })
        )
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k !== CACHE_NAME && k !== STATIC_CACHE && k !== API_CACHE
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 1. Static Assets (_next/static, images, fonts, icons): Cache-First + Stale-While-Revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              cache.put(request, res.clone());
            }
            return res;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  // 2. Read-only Catalog APIs (products, categories): Network-First with Offline Cache Fallback
  if (
    url.pathname.startsWith("/api/v1/products") ||
    url.pathname.startsWith("/api/v1/categories")
  ) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const res = await fetch(request);
          if (res && res.status === 200) {
            cache.put(request, res.clone());
          }
          return res;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ data: { products: [], categories: [] } }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      })
    );
    return;
  }

  // 3. HTML Page Navigations (/pos, /dashboard, /): Network-First with App Shell Fallback
  if (
    request.mode === "navigate" ||
    request.headers.get("accept")?.includes("text/html")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const res = await fetch(request);
          if (res && res.status === 200) {
            cache.put(request, res.clone());
          }
          return res;
        } catch {
          const exactMatch = await cache.match(request);
          if (exactMatch) return exactMatch;

          if (url.pathname.includes("/pos")) {
            const posFallback =
              (await cache.match("/pos")) || (await cache.match("/ar/pos"));
            if (posFallback) return posFallback;
          }

          const rootFallback = await cache.match("/");
          if (rootFallback) return rootFallback;

          return new Response(
            `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>KASPI POS — Offline Mode</title><style>body{background:#09090b;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}.card{background:#18181b;border:1px solid #27272a;padding:32px;border-radius:16px;max-width:420px}a{display:inline-block;margin-top:16px;padding:12px 24px;background:#fff;color:#000;font-weight:bold;border-radius:8px;text-decoration:none}</style></head><body><div class="card"><img src="/logo.png" width="64" height="64" style="border-radius:12px;margin-bottom:12px"/><h2>KASPI POS • وضع عدم الاتصال</h2><p style="color:#a1a1aa;font-size:14px">التطبيق يعمل محلياً عبر قاعدة بيانات Dexie.js.</p><a href="/pos">فتح نقطة البيع (POS)</a></div></body></html>`,
            {
              status: 200,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            }
          );
        }
      })
    );
  }
});
