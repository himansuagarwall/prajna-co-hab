/* Prajna Co-hab — service worker (v69)
   Caches the local app shell for offline reading.
   Skips external resources (maps, CDNs, Apps Script). */
var V = 'prajna-v69';
var SHELL = [
  './',
  './index.html',
  './rooms.html',
  './about.html',
  './contact.html',
  './gallery.html',
  './autohub.html',
  './feedback.html',
  './tour3d.html',
  './pune.html',
  './discover.html',
  './404.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/style.css?v=69',
  './assets/pond.css?v=69',
  './assets/site.js?v=69',
  './assets/fluid.js',
  './assets/motion.js',
  './assets/gallery.js',
  './assets/depth-gallery.js',
  './assets/pond.js',
  './assets/reviews.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/favicon-16x16.png',
  './assets/favicon-32x32.png',
  './assets/favicon-48x48.png',
  './assets/lotus.svg',
  './assets/og-cover.png',
  './assets/og-cover.jpg',
  './assets/og-cover.webp',
  './assets/og-cover-optimized.webp',
  './assets/tour-poster.jpg',
  './assets/tour-poster.png',
  './assets/tour-poster.webp',
  './assets/house-card.jpg',
  './assets/fonts/marcellus-latin.woff2',
  './assets/tour.mp4'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(V).then(function(c) { return c.addAll(SHELL); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return k === V ? null : caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'skip') self.skipWaiting();
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  var isDoc = req.mode === 'navigate' || req.destination === 'document' || /\.html?$/.test(url.pathname);
  if (isDoc) {
    e.respondWith(
      fetch(req).then(function(res) {
        if (res && res.ok) {
          var cp = res.clone();
          caches.open(V).then(function(c) { c.put(req, cp); });
        }
        return res;
      }).catch(function() {
        return caches.match(req).then(function(hit) {
          return hit || caches.match('./offline.html');
        });
      })
    );
    return;
  }

  /* static assets: cache-first, updated in background */
  e.respondWith(
    caches.match(req).then(function(hit) {
      var net = fetch(req).then(function(res) {
        if (res && res.ok) {
          var cp = res.clone();
          caches.open(V).then(function(c) { c.put(req, cp); });
        }
        return res;
      }).catch(function() { return hit; });
      return hit || net;
    })
  );
});
