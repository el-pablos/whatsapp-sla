/**
 * WhatsApp SLA PWA Service Worker
 * Provides offline capability for authentication flow
 */

const CACHE_NAME = "whatsapp-sla-v1";
const OFFLINE_URL = "/offline.html";

// Resources to cache for offline use
const CACHE_RESOURCES = [
  "/",
  "/whatsapp/auth",
  "/manifest.json",
  "/offline.html",
  // Icons
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  // Fonts (if using custom fonts)
  // Add any critical CSS/JS files here
];

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching essential resources");
        return cache.addAll(CACHE_RESOURCES);
      })
      .then(() => {
        console.log("Service Worker: Installation complete");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Installation failed", error);
      }),
  );
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("Service Worker: Activation complete");
        return self.clients.claim();
      }),
  );
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Only handle http/https requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  // Handle navigation requests (page loads)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches
          .open(CACHE_NAME)
          .then((cache) => cache.match(OFFLINE_URL));
      }),
    );
    return;
  }

  // Handle API requests - always try network first
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // For API failures, return custom offline response
        return new Response(
          JSON.stringify({
            error: true,
            message: "Tidak ada koneksi internet. Silakan coba lagi.",
            offline: true,
          }),
          {
            status: 503,
            statusText: "Service Unavailable",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }),
    );
    return;
  }

  // Handle other requests - cache first strategy
  event.respondWith(
    caches
      .match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          // Cache successful responses
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Return offline page for HTML requests
        if (event.request.headers.get("Accept").includes("text/html")) {
          return caches.match(OFFLINE_URL);
        }
      }),
  );
});

// Background sync for failed requests
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync here
      console.log("Service Worker: Background sync triggered"),
    );
  }
});

// Push notifications (for future use)
self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id,
    },
    actions: [
      {
        action: "explore",
        title: "Buka",
        icon: "/icons/checkmark.png",
      },
      {
        action: "close",
        title: "Tutup",
        icon: "/icons/xmark.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Handle background fetch (for large QR images)
self.addEventListener("backgroundfetch", (event) => {
  if (event.tag === "qr-image-fetch") {
    event.waitUntil(
      // Handle background fetch completion
      console.log("Service Worker: Background fetch completed"),
    );
  }
});

// Handle periodic background sync (for checking connection status)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-connection") {
    event.waitUntil(
      // Check connection status and update UI if needed
      console.log("Service Worker: Periodic sync triggered"),
    );
  }
});

// Message handling from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_QR") {
    // Cache QR image for offline viewing
    caches.open(CACHE_NAME).then((cache) => {
      cache.put("/qr-current", new Response(event.data.qrData));
    });
  }
});
