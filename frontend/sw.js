// Service Worker for PWA

import openDB from "/js/db.js";
import { getFailedRequests, attemptToSend } from "/js/order.js";

const PRECACHE = "precache-v1";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/offline.html",
  "/css/styles.css",
  "/app.js",
  // "/js/app.js",
  "/manifest.webmanifest",
  // "/icons/icon-192.png",
  // "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  console.log("Service Worker install loaded");

  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);

      // ✅ به جای addAll: تک‌تک اضافه کن تا بفهمی کدوم fail می‌شه
      for (const url of PRECACHE_URLS) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) throw new Error(`${url} -> ${res.status}`);
          await cache.put(url, res);
          console.log("✅ precached:", url);
        } catch (e) {
          console.error("❌ precache failed:", e.message);
          // اینجا تصمیم می‌گیری: یا ادامه بده (پیشنهاد من) یا install را fail کن
        }
      }

      self.skipWaiting();
    })()
  );
});

console.log("Service Worker install loaded");
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== "order-cache") {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
console.log("Service Worker activate loaded");
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
console.log("Service Worker fetch loaded");
// Background Sync
self.addEventListener("sync", (e) => {
  if (e.tag === "sync-orders") {
    e.waitUntil(syncOrders());
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SYNC_NOW") event.waitUntil(syncOrders());
});

// Sync orders from Outbox
async function syncOrders() {
  const db = await openDB();
  const transaction = db.transaction("outbox", "readwrite");
  const outboxStore = transaction.objectStore("outbox");
  const orders = await getFailedRequests(outboxStore);

  // Try sending all orders in the outbox
  orders.forEach(async (order) => {
    await attemptToSend(order, outboxStore);
    // مثال: وقتی sync موفق شد
    await notifyClients({ type: "toast", level: "success", message: "سینک سفارش‌ها انجام شد" });
  });
}

async function notifyClients(payload) {
  const clientsArr = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const c of clientsArr) c.postMessage(payload);
}
