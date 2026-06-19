// ግብርና ሱቅ — Service Worker (offline support)
// አስፈላጊ ሲሆን ቁጥሩን ቀይር (ለምሳሌ v1 → v2) እያንዳንዱ ጊዜ index.html ብታሻሽል፣ ይህ የድሮውን ካሽ ያጸዳል
const CACHE_NAME = 'grb-shop-v1';
const APP_SHELL = [
  './',
  './index.html'
];

// መጫን ላይ: ዋናውን ገጽ ቀድሞ ካሽ ውስጥ አስቀምጥ
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

// ማስጀመር ላይ: የድሮ ካሽዎችን አጽዳ
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch: በፍጥነት ካሽ ምልስ፣ ከዚያ ከኢንተርኔት አሻሽል (stale-while-revalidate)።
// ኢንተርኔት ከሌለ ካሽ የተቀመጠውን ብቻ ይመልሳል — አፑ ስለዚህ ያለ ኢንተርኔት ይከፈታል።
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const networkFetch = fetch(e.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          }
          return response;
        })
        .catch(() => cached || caches.match('./index.html'));

      // ካሽ ካለ ቶሎ ምልስ (ከኔትወርክ ጭነት ሳይጠብቅ)፣ ካልሆነ ኔትወርክ ጠብቅ
      return cached || networkFetch;
    })
  );
});
