// Service Worker for caching static assets
const CACHE_NAME = 'kopitapau-v1';
const STATIC_CACHE = 'kopitapau-static-v1';
const DYNAMIC_CACHE = 'kopitapau-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/src/assets/hero-matcha-drink.png',
  '/src/assets/drinks/hojichalatte.png',
  '/src/assets/drinks/strawberrymatcha.png',
  '/src/assets/drinks/matchacocco.png',
  '/src/assets/drinks/layered-matcha.png',
  '/src/assets/drinks/matcha-latte.jpg',
  '/src/assets/drinks/iced-latte.jpg',
  '/src/assets/drinks/iced-mocha.jpg',
  '/src/assets/drinks/hot-cappuccino.jpg',
  '/src/assets/drinks/strawberrymatcha.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE;
            })
            .map((cacheName) => {
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache images and static assets
            if (request.destination === 'image' || 
                request.url.includes('/assets/') ||
                request.url.includes('.png') ||
                request.url.includes('.jpg') ||
                request.url.includes('.jpeg') ||
                request.url.includes('.webp')) {
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for analytics
self.addEventListener('sync', (event) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(
      // Send queued analytics data
      sendQueuedAnalytics()
    );
  }
});

// Push notifications (if needed)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Helper function to send queued analytics
async function sendQueuedAnalytics() {
  // Implementation for sending queued analytics data
  // This would typically involve IndexedDB and fetch API
  console.log('Sending queued analytics data...');
}
