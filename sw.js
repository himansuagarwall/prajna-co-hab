/* Prajna Co-hab — service worker (v71)
   Caches the app shell for offline reading.

   What changed in v71:
   - the 7.4MB tour video, the social covers and the poster images are no
     longer precached. A first visit used to download 7.77MB before the
     worker finished installing, on a phone, on mobile data. Shell is now
     roughly 260KB of HTML, CSS, JS and fonts.
   - each entry installs independently, so one missing file can no longer
     abort the whole install and leave the old worker in place.
   - precache fetches use cache:'reload', so a version bump cannot refill the
     new cache with the previous deploy's bytes.
   - blog.html and testimonials.html are in the shell.
   - a navigation miss retries by pathname, so ?utm_source=... still works. */

var V = 'prajna-v71';

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
  './blog.html',
  './testimonials.html',
  './404.html',
  './offline.html',
  './manifest.webmanifest',
  './config.js?v=70',
  './assets/style.css?v=71',
  './assets/pond.css?v=71',
  './assets/site.js?v=71',
  './assets/fluid.js?v=70',
  './assets/motion.js?v=70',
  './assets/gallery.js?v=70',
  './assets/pond.js?v=70',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/favicon-16x16.png',
  './assets/favicon-32x32.png',
  './assets/favicon-48x48.png',
  './assets/lotus.svg',
  './assets/fonts/marcellus-latin.woff2',
  './assets/fonts/alegreya-sans-latin.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(V).then(function (c) {
      /* one by one, not addAll: a single 404 must not abort the install */
      return Promise.all(SHELL.map(function (url) {
        return fetch(new Request(url, { cache: 'reload' }))
          .then(function (res) {
            if (res && res.ok) return c.put(url, res);
          })
          .catch(function () { /* skip, the runtime cache will fill it */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === V ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'skip') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  var isDoc = req.mode === 'navigate' || req.destination === 'document' || /\.html?$/.test(url.pathname);

  if (isDoc) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var cp = res.clone();
          caches.open(V).then(function (c) { c.put(req, cp); });
        }
        return res;
      }).catch(function () {
        return caches.match(req)
          .then(function (hit) { return hit || caches.match(url.pathname); })
          .then(function (hit) { return hit || caches.match('./offline.html'); });
      })
    );
    return;
  }

  /* static assets: cache-first, refreshed in the background */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) {
          var cp = res.clone();
          caches.open(V).then(function (c) { c.put(req, cp); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
