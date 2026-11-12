/* Offline cache: the whole app works with no network once installed. Bump VERSION on every release. */
var VERSION = 'v6';
var FILES = ['./', 'index.html', 'css/app.css', 'js/art-kit.js', 'js/pages/starter.js', 'js/pages/animals.js', 'js/pages/fairy.js', 'js/pages/vehicles.js', 'js/pages/robots.js', 'js/pages/space.js', 'js/pages/monsters.js', 'js/pages/sea.js', 'js/pages/garden.js', 'js/pages/treats.js', 'js/fill.js', 'js/sound.js', 'js/photo.js', 'js/store.js', 'js/app.js',
  'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) { return hit || fetch(e.request); }));
});
