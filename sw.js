const CACHE_NAME = 'delivery-control-cache-v2';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './main.js',
  './manifest.webmanifest',
  './icon-192.png',
  'https://cdn.tailwindcss.com'
];

// Instala o service worker e armazena o shell do aplicativo em cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Força o novo service worker a se ativar
      .catch(err => {
        console.error('Falha ao armazenar recursos em cache:', err);
      })
  );
});

// Busca recursos primeiro do cache, depois da rede
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retorna a resposta
        if (response) {
          return response;
        }

        // Não está no cache - busca na rede e armazena em cache
        return fetch(event.request).then(
          networkResponse => {
            if(!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
               return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.log("Fetch failed; returning offline page instead.", error);
            // Poderia retornar uma página offline customizada aqui
        });
      })
  );
});

// Limpa caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Assume o controle de todas as abas abertas
  );
});