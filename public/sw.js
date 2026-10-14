// Service Worker para Checklist TI (PWA)
// Versão do cache de assets estáticos da aplicação
const CACHE_NAME = 'checklist-ti-v3';

// Lista de rotas essenciais para cache offline inicial
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  // Força ativação imediata sem esperar fechamento de abas
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Falha no pré-cache inicial:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Limpa todas as versões antigas do cache para que novas publicações sejam aplicadas de imediato
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Suporte a mensagens do cliente (ex: SKIP_WAITING)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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

  // Para navegação HTML (páginas): Network-First obrigatório com cache: 'no-store'
  // Isso impede que o browser use o disco local para index.html quando há conexão ativa
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
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
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const indexFallback = await caches.match('/index.html');
          if (indexFallback) {
            return indexFallback;
          }
          return new Response('Modo Offline - Checklist TI', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // Para assets estáticos (JS com hash, CSS, imagens): Network-first com fallback de cache
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
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
