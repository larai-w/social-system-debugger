// 社会＆地域インフラ・デバッガー — Service Worker
// 方針: メインドキュメントは network-first（新デプロイを必ず優先し、古いキャッシュに固定されない）。
//       静的アセット/CDN は cache-first（オフライン動作）。
const CACHE = 'ssd-cache-v6-348';
const CORE = ['./', './index.html', './manifest.json', './icon.svg',
  './css/app.css', './js/i18n.js', './js/engine.js', './js/native.js', './js/ui.js'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // ドキュメント/ナビゲーション: network-first（最新を優先、オフライン時はキャッシュへ）
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // その他（icon / Chart.js CDN 等）: cache-first、無ければネットワーク取得してキャッシュ
  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached)
    )
  );
});
