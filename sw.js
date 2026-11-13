const CACHE_NAME = 'marhaban-manaqib-v3';
const ASSETS = [
  './',
  './index.html',
  './logo.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500&family=Amiri:wght@400;700&display=swap',
  'https://cdn.tailwindcss.com'
];

// 1. Simpan aset ke cache saat pertama kali dibuka
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Hapus cache lama jika ada pembaruan versi
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Ambil dari cache dulu, jika tidak ada baru ambil dari internet
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Gunakan file offline jika ada
      }
      return fetch(e.request).then((networkResponse) => {
        // Simpan file baru ke cache jika belum ada
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // Jika internet mati dan file tidak ada di cache, tampilkan halaman utama (index.html)
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});