/* DoNext service worker — makes the app work offline.
   Bump CACHE_VERSION whenever you change any app file so users get the update. */
const CACHE_VERSION = 'donext-v1';
const APP_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: answer from the cache instantly, refresh the cache in the background.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  const network = fetch(req)
    .then(async (res) => {
      if (res && res.ok) {
        const copy = res.clone();
        const cache = await caches.open(CACHE_VERSION);
        await cache.put(req, copy);
      }
      return res;
    })
    .catch(() => null);
  event.waitUntil(network);

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    const res = await network;
    if (res) return res;
    if (req.mode === 'navigate') {
      const shell = await caches.match('./index.html');
      if (shell) return shell;
    }
    return Response.error();
  })());
});
