/**
 * STEAM Foundry Service Worker
 * Enables offline support, caching, and PWA features
 *
 * v2 — fixed a bug where the HTML shell (`/`) was cached with cache-first
 * and never revalidated, so every visitor kept loading the index.html from
 * their FIRST ever visit, forever — even after new deploys. That stale HTML
 * referenced content-hashed JS/CSS filenames from the old build, which
 * Vercel deletes on every deploy. Requesting a deleted hashed asset hit
 * Vercel's SPA rewrite (any unmatched path -> index.html), so the browser
 * got back an HTML document where it expected a JS module and refused to
 * execute it (strict MIME-type check) — the app never mounted.
 *
 * Fix: navigation requests and index.html are now network-first, so the
 * shell is always current and its asset references always resolve. Only
 * genuinely immutable, content-hashed files under /assets/ use cache-first
 * — safe, because a given hash's content never changes.
 */

const CACHE_NAME = 'steam-foundry-v2';

// Install: activate this worker as soon as it's done installing, instead of
// waiting for every open tab to close first.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/manifest.json').catch(() => {})),
  );
});

// Activate: take control of already-open tabs immediately, and delete every
// cache that isn't this version (this is what actually clears out the old
// permanently-stale shell cache from returning visitors' browsers).
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((names) =>
        Promise.all(
          names.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            }
          }),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests.
  if (url.origin !== location.origin) return;

  // API/auth/data requests: always network-first, never cached stale.
  if (url.pathname.includes('/api/') || url.pathname.includes('/auth/') || url.pathname.includes('/rest/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Content-hashed build assets (/assets/index-<hash>.js etc.) are
  // immutable per filename — safe and fast to cache-first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else — the navigation request, /index.html, /manifest.json,
  // and any client-side route the SPA rewrite serves index.html for — must
  // stay network-first, or a stale shell gets pinned forever like it just was.
  event.respondWith(networkFirst(request));
});

/** Cache-first: safe only for immutable, content-hashed URLs. */
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache-first failed:', error);
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

/** Network-first: always prefer the live server; cache is only an offline fallback. */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[SW] Network request failed, trying cache:', error);
    const cached = await caches.match(request);
    return cached || new Response('Offline - request failed', { status: 503 });
  }
}

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const options = {
    body: event.data.text(),
    icon: '/manifest.json',
    badge: '/manifest.json',
    vibrate: [200, 100, 200],
    tag: 'steam-foundry-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification('STEAM Foundry', options)
  );
});
