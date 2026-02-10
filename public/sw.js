/**
 * Bay Navigator Service Worker
 * Provides offline support and caching for PWA functionality
 * Version is updated at build time
 */

// Cache version - updated automatically at build time
const CACHE_VERSION = '2026-01-09';
const STATIC_CACHE = `baynavigator-static-${CACHE_VERSION}`;
const API_CACHE = `baynavigator-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `baynavigator-images-${CACHE_VERSION}`;
const MAP_CACHE = `baynavigator-map-${CACHE_VERSION}`;

// Static assets to cache on install (include both with and without trailing slash)
const STATIC_ASSETS = [
  '/',
  '/about',
  '/about/',
  '/alerts',
  '/alerts/',
  '/directory',
  '/directory/',
  '/eligibility',
  '/eligibility/',
  '/map',
  '/map/',
  '/favorites',
  '/favorites/',
  '/glossary',
  '/glossary/',
  '/assets/images/logo/logo.webp',
  '/assets/images/favicons/favicon-192.webp',
  '/assets/images/favicons/favicon-512.webp',
  '/offline.html',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/programs.json',
  '/api/categories.json',
  '/api/groups.json',
  '/api/areas.json',
  '/api/metadata.json',
  '/api/search-index.json',
  '/api/emergency.json', // Crisis resources for offline access
];

// Map-related resources to cache
const MAP_RESOURCES = [
  'https://unpkg.com/maplibre-gl@5.1.0/dist/maplibre-gl.js',
  'https://unpkg.com/maplibre-gl@5.1.0/dist/maplibre-gl.css',
  'https://unpkg.com/pmtiles@3.0.6/dist/pmtiles.js',
];

// Cache size limits
const MAX_IMAGE_CACHE_SIZE = 50;
const MAX_MAP_TILE_CACHE_SIZE = 200; // More tiles for offline map viewing

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
      caches.open(API_CACHE).then((cache) => cache.addAll(API_ENDPOINTS)),
      // Pre-cache map libraries (catch errors for cross-origin resources)
      caches
        .open(MAP_CACHE)
        .then((cache) => Promise.allSettled(MAP_RESOURCES.map((url) => cache.add(url)))),
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, API_CACHE, IMAGE_CACHE, MAP_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('baynavigator-') && !currentCaches.includes(name))
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except allowed CDNs)
  const allowedOrigins = [
    'cdn.jsdelivr.net',
    'unpkg.com',
    'baytidesstorage.blob.core.windows.net',
    'tiles.openfreemap.org',
    'api.maptiler.com',
  ];
  if (url.origin !== location.origin && !allowedOrigins.some((o) => url.origin.includes(o))) {
    return;
  }

  // Handle map tiles and resources (PMTiles, vector tiles, map libraries)
  if (
    url.pathname.includes('.pmtiles') ||
    url.pathname.includes('/tiles/') ||
    url.hostname.includes('maptiler') ||
    url.hostname.includes('openfreemap') ||
    (url.hostname.includes('unpkg.com') && url.pathname.includes('maplibre')) ||
    (url.hostname.includes('unpkg.com') && url.pathname.includes('pmtiles'))
  ) {
    event.respondWith(cacheFirstWithLimit(request, MAP_CACHE, MAX_MAP_TILE_CACHE_SIZE));
    return;
  }

  // Handle API requests - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Handle immutable build assets - cache first
  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
    return;
  }

  // Handle images - cache first with size limit
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|ico)$/i)
  ) {
    event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE));
    return;
  }

  // Handle page navigation - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Handle static assets - cache first
  event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
});

// Strategy: Network first with cache fallback
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(new Request(request, { cache: 'no-store' }));
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Strategy: Network first with offline fallback
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) return offlineResponse;

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Strategy: Cache first with network fallback
async function cacheFirstWithNetwork(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Network error', { status: 503 });
  }
}

// Strategy: Cache first with size limit (for images)
async function cacheFirstWithLimit(request, cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const keys = await cache.keys();
      if (keys.length >= maxItems) {
        await Promise.all(
          keys.slice(0, keys.length - maxItems + 1).map((key) => cache.delete(key))
        );
      }
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

// =====================================================
// PUSH NOTIFICATIONS
// =====================================================

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    // If not JSON, treat as plain text message
    data = {
      title: 'Bay Navigator',
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/assets/images/favicons/favicon-192.webp',
    badge: data.badge || '/assets/images/favicons/badge-72.webp',
    tag: data.tag || 'baynavigator-notification',
    data: data.data || {},
    actions: data.actions || [],
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
  };

  // Add notification timestamp for tracking
  options.data.timestamp = Date.now();
  options.data.notificationId = data.tag || `notif-${Date.now()}`;

  event.waitUntil(self.registration.showNotification(data.title || 'Bay Navigator', options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/';

  // Determine target URL based on notification type
  switch (data.type) {
    case 'weather':
      // Weather alerts could link to map or specific area
      targetUrl = data.url || '/map';
      break;
    case 'program':
      // New program or update - link to directory
      targetUrl = data.programId ? `/directory?highlight=${data.programId}` : '/directory';
      break;
    case 'status':
      // Application status - link to favorites
      targetUrl = data.programId ? `/favorites?highlight=${data.programId}` : '/favorites';
      break;
    case 'announcement':
      // General announcement - custom URL or home
      targetUrl = data.url || '/';
      break;
    case 'missing-persons':
      // Missing person alert - link to case page or alerts index
      targetUrl = data.url || '/alerts';
      break;
    default:
      targetUrl = data.url || '/';
  }

  // Handle action button clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
        // Default view action
        break;
      case 'dismiss':
        // Just close, don't navigate
        return;
      case 'settings':
        targetUrl = '/settings#notifications';
        break;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open a new window if none exists
      return clients.openWindow(targetUrl);
    })
  );
});

// Handle notification close (for analytics)
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {};
  // Could send analytics here if needed
  console.log('Notification closed:', data.notificationId);
});

// =====================================================
// MESSAGE HANDLING
// =====================================================

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  // Verify the message comes from a trusted client (same origin)
  // Service workers only receive messages from controlled clients,
  // but we add explicit origin check for defense-in-depth
  // SECURITY: Always require a valid source with verifiable origin
  if (!event.source || !event.source.url) {
    // Reject messages without a verifiable source
    return;
  }

  try {
    const sourceOrigin = new URL(event.source.url).origin;
    if (sourceOrigin !== self.location.origin) {
      console.warn('Rejected message from untrusted origin');
      return;
    }
  } catch {
    // If URL parsing fails, reject the message
    console.warn('Rejected message with invalid source URL');
    return;
  }

  // Only process messages after origin verification
  if (event.data === 'skipWaiting') self.skipWaiting();
  if (event.data === 'clearCache') {
    caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
  }
  if (event.data === 'getVersion' && event.ports[0]) {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});
