const CACHE_NAME = 'namaz-vakti-cache-v5'; // Versiyonu bilerek artırdım ki telefon değişikliği algılasın
const REPO_NAME = '/namaz-vakti-2'; // Proje adın buraya
const OFFLINE_URL = `${REPO_NAME}/index.html`; 

const urlsToCache = [
  `${REPO_NAME}/`,
  `${REPO_NAME}/index.html`,
  `${REPO_NAME}/style.css`,
  `${REPO_NAME}/app.js`,
  `${REPO_NAME}/manifest.json`,
  `${REPO_NAME}/icon-192.jpeg`,
  `${REPO_NAME}/icon-512.jpeg`
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache açıldı (v5)');
        return cache.addAll(urlsToCache)
          .then(() => {
            // Offline URL'yi ayrıca garantiye alalım
            return cache.add(OFFLINE_URL).catch(err => console.error("Offline URL eklenemedi:", err));
          });
      })
      .catch(err => {
        console.error('Cache (v5) install failed:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]; 
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Eski cache siliniyor:', cacheName);
            return caches.delete(cacheName); 
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  // API isteklerini cacheleme
  if (event.request.url.includes('api.collectapi.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).catch(() => {
        // Eğer internet yoksa ve sayfa açılmıyorsa offline sayfasını (index.html) döndür
        if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
