/* 오늘 뭐 해먹지 — 서비스 워커
 * - 정적 자산(_next/static, 폰트): cache-first (해시된 파일이라 안전)
 * - Supabase GET: network-first, 오프라인이면 마지막 응답 재사용
 * - 페이지 이동: network-first, 오프라인이면 캐시된 페이지 → 홈 순서로 폴백
 */
const VERSION = "v1";
const STATIC_CACHE = `static-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;
const PAGE_CACHE = `pages-${VERSION}`;
const KNOWN = [STATIC_CACHE, DATA_CACHE, PAGE_CACHE];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !KNOWN.includes(k)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Supabase 데이터: network-first (오프라인이면 마지막 데이터)
  if (url.hostname.endsWith(".supabase.co")) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // 폰트/정적 자산: cache-first
  if (
    url.hostname === "cdn.jsdelivr.net" ||
    url.pathname.startsWith("/_next/static/") ||
    /\.(png|ico|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 페이지 이동: network-first, 오프라인 폴백
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE, "/"));
    return;
  }
});
