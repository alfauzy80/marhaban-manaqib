const CACHE_NAME = 'marhaban-manaqib-v6';
const PRECACHE_URLS = [
  './',
  './index.html',
  './logo.png',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500&family=Amiri:wght@400;700&display=swap',
  'https://cdn.tailwindcss.com'
];

// 1. Simpan semua aset penting saat pertama kali dibuka
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Pre-caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Hapus cache lama saat ada versi baru
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Strategi Cache-First untuk Navigasi & Aset
self.addEventListener('fetch', (event) => {
  // Abaikan request non-GET
  if (event.request.method !== 'GET') return;

  // Cek apakah ini request navigasi (membuka halaman)
  const isNavigation = event.request.mode === 'navigate';

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika ada di cache, langsung kembalikan (untuk offline)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Jika tidak ada di cache, coba ambil dari network
      return fetch(event.request).then((networkResponse) => {
        // Simpan response baru ke cache (jika berhasil)
        return caches.open(CACHE_NAME).then((cache) => {
          // Hanya cache response yang OK (status 200) atau opaque (cross-origin)
          if (networkResponse.ok || networkResponse.type === 'opaque') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      }).catch(() => {
        // Jika network GAGAL dan ini adalah request navigasi, kembalikan index.html
        if (isNavigation) {
          return caches.match('./index.html');
        }
        // Jika bukan navigasi, biarkan gagal
        return new Response('Offline', { status: 503 });
      });
    })
  );
});