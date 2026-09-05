// Bump this version when changing the offline shell or its icons.
const CACHE_PREFIX = "rosys-kitchen-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function canStore(response) {
  return (
    response.status === 200 &&
    !response.redirected &&
    response.type === "basic" &&
    !/\b(?:private|no-store)\b/i.test(response.headers.get("cache-control") || "")
  );
}

function saveResponse(event, request, response) {
  const copy = response.clone();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {}),
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Let Next.js manage API responses and its RSC/router cache. Treating these
  // as static files can replay stale content and metadata after admin edits.
  if (
    /^\/api(?:\/|$)/.test(url.pathname) ||
    request.headers.has("rsc") ||
    request.headers.has("next-router-prefetch") ||
    url.searchParams.has("_rsc")
  ) return;

  if (request.mode === "navigate") {
    const privateRoute = /^\/(?:backend|cart|checkout|auth|login|register|search)(?:\/|$)/.test(url.pathname);
    const publicDocument = !privateRoute && !url.search;

    // Refresh documents on every navigation. Never retain private pages,
    // query variants, errors, redirects, or responses marked no-store.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (publicDocument && canStore(response)) {
            saveResponse(event, request, response);
          }
          return response;
        })
        .catch(async () => {
          const cached = publicDocument ? await caches.match(request) : undefined;
          return cached || (await caches.match(OFFLINE_URL)) || Response.error();
        }),
    );
    return;
  }

  // Only immutable framework assets and the versioned offline shell use
  // cache-first. Image optimization and SEO endpoints keep their HTTP policy.
  const immutableAsset = url.pathname.startsWith("/_next/static/");
  const shellAsset = !url.search && PRECACHE_URLS.includes(url.pathname);
  if (!immutableAsset && !shellAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (canStore(response)) saveResponse(event, request, response);
        return response;
      });
    }),
  );
});
