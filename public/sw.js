/**
 * Bay Navigator Service Worker
 * Provides offline support and caching for PWA functionality
 */

const CACHE_NAME = 'baynavigator-v1';
const STATIC_CACHE = 'baynavigator-static-v1';
const API_CACHE = 'baynavigator-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/about',
  '/eligibility',
  '/assets/images/logo/logo.webp',
  '/assets/images/favicons/favicon-192.webp',
  '/assets/images/favicons/favicon-512.webp',
  '/offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/programs.json',
  '/api/categories.json',
  '/api/groups.json',
  '/api/areas.json',
  '/api/metadata.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache API data
      caches.open(API_CACHE).then((cache) => {
        console.log('[SW] Caching API data');
        return cache.addAll(API_ENDPOINTS);
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('baynavigator-') &&
                   name !== STATIC_CACHE &&
                   name !== API_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except CDN)
  if (url.origin !== location.origin &&
      !url.origin.includes('cdn.jsdelivr.net')) {
    return;
  }

  // Handle API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstWithCache(request, API_CACHE)
    );
    return;
  }

  // Handle page navigation - network first
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirstWithOfflineFallback(request)
    );
    return;
  }

  // Handle static assets - cache first
  event.respondWith(
    cacheFirstWithNetwork(request, STATIC_CACHE)
  );
});

// Strategy: Network first, cache fallback
async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Strategy: Network first with offline fallback
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful page responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for navigation:', request.url);

    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to offline page
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }

    // Last resort - return error
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Strategy: Cache first, network fallback
async function cacheFirstWithNetwork(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Return cache and update in background
    updateCacheInBackground(request, cacheName);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for asset:', request.url);
    throw error;
  }
}

// Background cache update
async function updateCacheInBackground(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silent fail for background updates
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});
