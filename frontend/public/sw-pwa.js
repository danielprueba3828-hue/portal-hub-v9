// Service Worker minimal para PWA e integraciones futuras de Notificaciones Push
const CACHE_NAME = 'portal-hub-cache-v1';

self.addEventListener('install', (event) => {
  // Saltar la espera para activar de inmediato
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// fetch listener vacío para cumplir con los requisitos de instalación de la PWA
self.addEventListener('fetch', (event) => {
  // No cacheamos nada para evitar problemas de caché agresiva (Network Only)
  // Pero el evento fetch DEBE estar presente para que el navegador permita instalar la PWA
});

// Listener para notificaciones push en el futuro
self.addEventListener('push', (event) => {
  let data = { title: 'Portal Hub', body: 'Nueva actualización disponible.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Portal Hub', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Manejar clic en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      const urlToOpen = event.notification.data?.url || '/';
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
