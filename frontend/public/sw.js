importScripts('https://cdn.webpushr.com/sw-server.min.js');

const CACHE_NAME = 'marathon-portal-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// Instalar SW y precargar assets estáticos básicos
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activar SW y limpiar cachés viejos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (e) => {
  // Solo interceptar peticiones GET de la misma procedencia (assets y páginas locales)
  // No interceptar peticiones de la API de Supabase o externos para evitar roturas
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Enviar respuesta cacheada y revalidar en segundo plano (stale-while-revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {/* Silenciar fallos de red */});
        return cachedResponse;
      }

      // Si no está en caché, buscar en red y cachear
      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Si no hay internet y es una navegación HTML, retornar la raíz/index.html
        if (e.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
