// Service Worker para Checklist TI (PWA)
// Versão do cache de assets estáticos da aplicação
const CACHE_NAME = 'checklist-ti-v2';

// Lista de rotas / assets essenciais para cache offline inicial
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  // Ativação imediata para nova versão
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Falha no pré-cache:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Limpa versões antigas do cache para que novas publicações sejam aplicadas de imediato
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // REGRA CRÍTICA: NUNCA interceptar requisições do Firebase, Firestore, Auth ou APIs externas
  // Os dados operacionais (equipamentos, ordens, histórico) trafegam direto pelo SDK Firestore em tempo real.
  if (
    request.method !== 'GET' ||
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('identitytoolkit.googleapis.com') ||
    url.origin.includes('firebaseio.com') ||
    url.origin.includes('googleapis.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Estratégia Network-First para arquivos da aplicação (HTML, JS, CSS):
  // Busca na rede primeiro. Se obtiver sucesso, atualiza o cache e entrega o código novo.
  // Se estiver offline ou a rede falhar, utiliza o cache local.
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback offline a partir do cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
