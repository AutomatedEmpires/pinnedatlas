/* PinnedAtlas service worker — offline support.
 *
 * Safety-first design: pages use NETWORK-FIRST so online visitors always get
 * fresh HTML (a stale-serving service worker is the classic way to "brick" a
 * site). Static assets, images, map tiles, and the geojson feed are cached so
 * previously-viewed spots and map areas keep working with no signal. Explicit
 * "download for offline" content lives in the unversioned `pa-offline-spots`
 * cache, which survives SW upgrades and is found by the global caches.match
 * fallback below.
 */

const V = 'pa-v2';
const SHELL = `${V}-shell`;
const PAGES = `${V}-pages`;
const STATIC = `${V}-static`;
const IMG = `${V}-img`;
const TILES = `${V}-tiles`;
const DATA = `${V}-data`;
const OFFLINE_CACHE = 'pa-offline-spots'; // written by the app's download feature

// A standalone, hydration-free HTML hub is the navigation fallback — serving a
// Next route's HTML for a different URL triggers a hydration mismatch and the
// app error boundary, so we use plain HTML that also lists downloaded spots.
const OFFLINE_URL = '/offline.html';
const PRECACHE = [
  OFFLINE_URL,
  '/offline',
  '/',
  '/spots',
  '/explore',
  '/downloaded',
  '/manifest.webmanifest',
];

const LIMITS = { [PAGES]: 60, [IMG]: 150, [TILES]: 600, [DATA]: 20, [STATIC]: 250 };

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // Precache best-effort — one failed URL must not abort install.
      await Promise.all(
        PRECACHE.map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('pa-') && !k.startsWith(V) && k !== OFFLINE_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const overflow = keys.length - max;
  for (let i = 0; i < overflow; i += 1) await cache.delete(keys[i]);
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res && (res.ok || res.type === 'opaque')) {
      cache.put(request, res.clone());
      trim(cacheName, max);
    }
    return res;
  } catch (err) {
    const any = await caches.match(request);
    if (any) return any;
    throw err;
  }
}

async function networkFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      cache.put(request, res.clone());
      trim(cacheName, max);
    }
    return res;
  } catch (err) {
    const hit = (await cache.match(request)) || (await caches.match(request));
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Page navigations: network-first, then any cache (incl. downloaded), then offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await networkFirst(request, PAGES, LIMITS[PAGES]);
        } catch {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
    return;
  }

  const sameOrigin = url.origin === self.location.origin;

  // Immutable hashed build assets.
  if (sameOrigin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC, LIMITS[STATIC]));
    return;
  }

  // Location geojson feed — network-first so the map refreshes when online.
  if (sameOrigin && url.pathname.startsWith('/api/locations/geojson')) {
    event.respondWith(networkFirst(request, DATA, LIMITS[DATA]));
    return;
  }

  // Other same-origin API routes: never cache (auth, mutations, dynamic) — pass through.
  if (sameOrigin && url.pathname.startsWith('/api/')) return;

  // Photos (Wikimedia / Cloudinary) and any image destination.
  if (
    request.destination === 'image' ||
    url.hostname.endsWith('wikimedia.org') ||
    url.hostname.endsWith('cloudinary.com')
  ) {
    event.respondWith(cacheFirst(request, IMG, LIMITS[IMG]));
    return;
  }

  // Map tiles / glyphs / sprite / style JSON.
  if (url.hostname.endsWith('cartocdn.com') || url.hostname.endsWith('openmaptiles.org')) {
    event.respondWith(cacheFirst(request, TILES, LIMITS[TILES]));
    return;
  }

  // Remaining same-origin GETs (fonts, icons, manifest): network-first with cache fallback.
  if (sameOrigin) {
    event.respondWith(networkFirst(request, PAGES, LIMITS[PAGES]));
  }
});
