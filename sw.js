/* sw.js — deixa o app abrir sem rede (quedas curtas). Não guarda nada do servidor (script.google.com). */
var CACHE = 'producao-F2.0';
var BASE = ['./', 'index.html', 'manifest.json', 'icone-192.png', 'icone-512.png'];
var ZXING = 'https://unpkg.com/@zxing/library@0.20.0/umd/index.min.js';

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(BASE).then(function () { return c.add(ZXING).catch(function () {}); });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                          // chamadas ao servidor (POST): nunca pelo cache
  if (url.hostname.indexOf('google') >= 0) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    // página: tenta a rede primeiro (pega versão nova); sem rede, usa a guardada
    e.respondWith(fetch(req).then(function (r) {
      var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put('index.html', cp); }); return r;
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (r) {
    return r || fetch(req).then(function (resp) {
      if (resp.ok && (url.origin === location.origin || url.href === ZXING)) { var cp = resp.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
      return resp;
    });
  }));
});
