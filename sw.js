/* sw.js — offline cache. Network first (so edits show up), cache as the fallback when offline.
   Only works when the site is served over http(s), e.g. python3 -m http.server. Not used with file://. */
const CACHE = 'masume-v5';
const FILES = ['./', 'index.html', 'styles.css', 'fonts/klee-kana-400.woff2', 'fonts/klee-kana-600.woff2', 'js/config.js', 'js/firebase-config.js', 'js/store.js', 'audio/manifest.js', 'js/kana-data.js', 'js/srs.js', 'js/ui.js', 'js/keyboard.js', 'js/practice.js', 'js/session.js', 'js/english.js', 'js/images.js', 'js/shared.js', 'js/topics.js', 'js/app.js', 'data/strokes.js', 'data/content.js', 'data/vocab-sets.js', 'data/english-data.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // web fonts etc. are optional: let the browser handle them
  e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req).then((r) => r || caches.match('index.html'))));
});
