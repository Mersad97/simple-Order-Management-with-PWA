import openDB, { getOrdersFromIndexedDB } from "./db.js";

// Save order to IndexedDB and Outbox
export async function saveOrder(order) {
  const db = await openDB();
  const transaction = db.transaction(["orders", "outbox"], "readwrite");
  const ordersStore = transaction.objectStore("orders");
  const outboxStore = transaction.objectStore("outbox");

  // Add order to orders store
  const request = ordersStore.add(order);
  request.onsuccess = () => {
    // If order is successfully added, create an outbox entry
    if (order?.status && order?.status === "pending") {
      const outboxOrder = {
        order,
        status: "pending",
        attempts: 0,
        nextRetryAt: Date.now(),
        createdAt: Date.now(),
      };
      outboxStore.add(outboxOrder);
    }
  };
}

// Generate idempotency key to ensure no duplicate orders are processed
export function generateIdempotencyKey() {
  return "order-" + Date.now() + Math.random().toString(36).substring(2);
}

// Retry failed requests from Outbox
export async function retryFailedRequests() {
  const db = await openDB();
  const transaction = db.transaction("outbox", "readwrite");
  const outboxStore = transaction.objectStore("outbox");
  const failedRequests = await getFailedRequests();
  failedRequests.forEach(async (request) => {
    if (request.attempts < 3) {
      // Limit retry attempts
      await attemptToSend(request, outboxStore);
    } else {
      request.status = "failed";
      outboxStore.put(request);
    }
  });
}

// Get failed requests from Outbox
export async function getFailedRequests(store) {
  const db = await openDB();
  const transaction = db.transaction("outbox", "readwrite");
  const outboxStore = transaction.objectStore("outbox");
  return new Promise((resolve, reject) => {
    const request = outboxStore.getAll();
    request.onerror = (e) => reject(e.target.error);
    request.onsuccess = (e) => {
      resolve(e.target.result);
    };
  });
}

// Attempt to send request to backend (with exponential backoff)
export async function attemptToSend(request, outboxStore) {
  const delay = calculateBackoffDelay(request.attempts);

  setTimeout(async () => {
    try {
      const response = await sendRequestToServer({ ...request.order, status: "synced" });
      const db = await openDB();
      const tx = db.transaction("outbox", "readwrite");
      const store = tx.objectStore("outbox");

      if (response?.status === 201) {
        request.status = "synced";
        store.delete(request.id);

        const transaction = db.transaction("orders", "readwrite");
        const storeOrders = transaction.objectStore("orders");
        const ordersRequest = storeOrders.getAll();
        ordersRequest.onsuccess = () => {
          ordersRequest.result.forEach((order) => {
            if (order?.idempotencyKey === request.order?.idempotencyKey) {
              order.status = "synced";
              storeOrders.put(order);
            }
          });
          displayOrders();
        };
        ordersRequest.onerror = (event) => {
          console.error("Failed to fetch orders", event.target.error);
        };
      } else {
        request.status = "failed";
        store.put(request);
        if (response.status === 409) {
          store.delete(request.id);
        }
      }
    } catch (err) {
      request.status = "failed";
      const db = await openDB();
      const tx = db.transaction("outbox", "readwrite");
      tx.objectStore("outbox").put(request);
    }
  }, delay);
}

// Calculate exponential backoff with jitter
function calculateBackoffDelay(attempts) {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const jitter = Math.floor(Math.random() * 1000);
  const delay = Math.min(baseDelay * Math.pow(2, attempts) + jitter, maxDelay);
  return delay;
}

// Send request to the server (replace with actual API call)
async function sendRequestToServer(request) {
  const response = await fetch("http://localhost:3000/api/orders", {
    // const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  // return response.json();
  const data = await response.json();
  return { status: response.status, body: data };
}

// Display orders in the list (updating from the server or IndexedDB)
export async function displayOrders() {
  const ordersFromServer = await fetchOrdersFromServer(); // Fetch from the server first
  const ordersList = document.getElementById("orders");
  // ordersList.innerHTML = "";

  // If we get orders from the server, display them
  if (ordersFromServer.length > 0) {
    ordersList.innerHTML = "";
    ordersFromServer.forEach((order) => {
      const li = document.createElement("li");
      li.textContent = `${order.customerName} - ${order.item} - ${order.status}`;
      ordersList.appendChild(li);
    });
  } else {
    // If no orders from server, fall back to IndexedDB
    const ordersFromIndexedDB = await getOrdersFromIndexedDB();
    ordersList.innerHTML = "";
    ordersFromIndexedDB.forEach((order) => {
      const li = document.createElement("li");
      li.textContent = `${order.customerName} - ${order.item} - ${order.status}`;
      ordersList.appendChild(li);
    });
  }
}

// Fetch orders from the server
export async function fetchOrdersFromServer() {
  try {
    // const response = await fetch("/api/orders");
    const response = await fetch("http://localhost:3000/api/orders");
    if (response.ok) {
      const orders = await response.json();
      return orders;
    } else {
      throw new Error("Failed to fetch orders");
    }
  } catch (err) {
    console.error("Error fetching orders from server:", err);
    return [];
  }
}
