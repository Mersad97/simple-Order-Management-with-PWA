// IndexedDB setup and interaction logic
const dbName = "orders-db";
const dbVersion = 1;
export default async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("telemetry")) {
        db.createObjectStore("telemetry", { keyPath: "id", autoIncrement: true });
      }

      if (!db.objectStoreNames.contains("orders")) {
        db.createObjectStore("orders", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onerror = (e) => reject(e.target.error);
    request.onsuccess = (e) => resolve(e.target.result);
  });
}

// Get all orders from IndexedDB
export async function getOrdersFromIndexedDB() {
  const db = await openDB();
  const transaction = db.transaction("orders", "readonly");
  const store = transaction.objectStore("orders");
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = (e) => reject(e.target.error);
    request.onsuccess = (e) => resolve(e.target.result);
  });
}

// Function to remove an order from the outbox after successful sync
async function removeOrderFromOutbox(orderId) {
  const db = await openDB();
  const transaction = db.transaction("outbox", "readwrite");
  const store = transaction.objectStore("outbox");
  store.delete(orderId); // Delete the order from outbox after successful sync
}
