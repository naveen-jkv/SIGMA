/**
 * AQUASENSE Progressive Web App (PWA) Service Worker
 * 
 * SECURITY & PRIVACY MANDATE:
 * - Only safe static assets (HTML shell, CSS, JS, fonts, app icons) are cached.
 * - NEVER cache authentication endpoints, tokens, patient records, clinical data,
 *   or sensitive surveillance APIs.
 * - Offline requests to API endpoints return an explicit offline error — NEVER
 *   mocking or faking successful persistence when disconnected.
 */

const CACHE_NAME = 'aquasense-static-v1.0.0';

// Core static assets for the application shell
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png'
];

// URLs that must NEVER be cached under any circumstances
const SENSITIVE_PATTERNS = [
  '/api/',
  '/auth/',
  '/cases',
  '/alerts',
  '/analytics',
  '/dashboard',
  '/map/'
];

// Installation: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[AQUASENSE SW] Partial pre-cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activation: Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[AQUASENSE SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor: Strict Partitioning
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Non-GET requests (POST, PUT, DELETE, etc.) -> Direct Network Only
  if (request.method !== 'GET') {
    return;
  }

  // 2. Sensitive APIs (Auth, Patient Cases, Alerts, Analytics) -> Strictly bypass cache
  const isSensitive = SENSITIVE_PATTERNS.some((pattern) => url.pathname.includes(pattern));
  if (isSensitive) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return clear, truthful offline response for API calls
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            error: 'You are currently offline. Active network connectivity is required for real-time epidemiological surveillance and AI risk calculation.'
          }),
          {
            status: 503,
            statusText: 'Service Unavailable (Offline)',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 3. Navigation Requests (Page reloads / SPA routing) -> Network first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('/index.html');
        return cachedIndex || fetch(request);
      })
    );
    return;
  }

  // 4. Static Assets (JS, CSS, Images, Fonts) -> Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('unpkg.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
