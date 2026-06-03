const CACHE_NAME = 'cic-qlda-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.css',
  '/logo-ddcn.png'
];

// Cài đặt Service Worker và lưu trữ tài nguyên tĩnh vào cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Kích hoạt Service Worker và dọn dẹp cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// Chiến lược Cache First, fallback to Network cho các asset tĩnh
self.addEventListener('fetch', (event) => {
  // Chỉ cache các request HTTP/HTTPS và phương thức GET
  if (
    !event.request.url.startsWith(self.location.origin) ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Trả về response trực tiếp nếu lỗi hoặc là bên thứ 3
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache động cho các tài nguyên tĩnh khác
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((err) => {
        console.log('[Service Worker] Fetch failed, network offline:', err);
      });
    })
  );
});
