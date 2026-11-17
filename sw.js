// Service worker: caches the app shell on first visit so Route Rush works offline.
// Bump CACHE when you change any file, so returning players get the update.
const CACHE = 'route-rush-v8';
const ASSETS = [
  './', 'index.html', 'manifest.json', 'icon.svg', 'css/style.css',
  'lang/en.json', 'lang/fr.json',
  'js/main.js', 'js/app.js', 'js/config.js', 'js/dates.js', 'js/rng.js', 'js/puzzle.js', 'js/game.js',
  'js/solver.js', 'js/generator.js', 'js/share.js', 'js/streak.js', 'js/skins.js', 'js/achievements.js',
  'js/progress.js', 'js/career.js', 'js/levels.js', 'js/rush.js', 'js/storage.js', 'js/i18n.js', 'js/sound.js', 'js/tutorial.js',
  'fonts/Fredoka-600.ttf', 'fonts/Fredoka-700.ttf',
  'js/ui/dom.js', 'js/ui/art.js', 'js/ui/icons.js', 'js/ui/board.js', 'js/ui/home.js', 'js/ui/howto.js', 'js/ui/play.js',
  'js/ui/results.js', 'js/ui/stats.js', 'js/ui/career.js', 'js/ui/rush.js', 'js/ui/garage.js', 'js/ui/settings.js', 'js/ui/archive.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Stale-while-revalidate: answer from the cache instantly (works offline), and
// refresh the cached copy from the network in the background so players get
// updates on their next visit.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      const network = fetch(e.request).then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      });
      if (hit) {
        network.catch(() => {}); // offline: the cached copy is enough
        return hit;
      }
      return network.catch(() => (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()));
    }),
  );
});
