import {
  displayOrders,
  fetchOrdersFromServer,
  generateIdempotencyKey,
  saveOrder,
} from "./js/order.js";
import { setConnectionStatus } from "./js/utils.js";
import { logTelemetryEvent } from "./js/telemetry.js";
import channel from "./js/multiTab.js"; // Importing multiTab.js
import { openModal } from "./js/modalBox.js";

// Handle order form submission
const orderForm = document.getElementById("order-form");
orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const customerName = document.getElementById("customer-name").value;
  const item = document.getElementById("item").value;
  const quantity = document.getElementById("quantity").value;
  const price = document.getElementById("price").value;
  const description = document.getElementById("description").value;

  const order = {
    customerName,
    item,
    quantity,
    price,
    description,
    status: "pending",
    idempotencyKey: generateIdempotencyKey(),
  };

  // Then send the order to the server
  try {
    const response = await createOrder({ ...order, status: "synced" });
    orderForm.reset();
    if (response.ok) {
      const newOrder = await response.json(); // Get the order from the server (with status)

      openModal(
        response?.message || response?.statusText || "Order created successfully",
        "success"
      );

      await saveOrder({ ...order, status: "synced" });

      await logTelemetryEvent("order_created_online", { orderId: newOrder.id, status: "synced" });
      // Notify other tabs about the new order
      channel.postMessage({ type: "new-order", orderId: newOrder.id });

      displayOrders(); // Re-fetch and display the orders from IndexedDB
    } else {
      await saveOrder(order);
      displayOrders(); // Re-fetch and display the orders from IndexedDB
      openModal(response?.message || "Order creation Faild - Server error", "error");
      await logTelemetryEvent("order_creation_failed", {
        orderId: order.id,
        error: "Server error",
      });
    }
  } catch (err) {
    await saveOrder(order);
    orderForm.reset();
    displayOrders(); // Re-fetch and display the orders from IndexedDB
    // If network error occurs, log and proceed with local save
    await logTelemetryEvent("order_creation_failed", { orderId: order.id, error: err.message });
  }
});

// Listen for messages from other tabs
channel.addEventListener("message", (e) => {
  if (e.data.type === "new-order") {
    displayOrders();
  }
});

// Check online/offline status
// window.addEventListener("online", () => setConnectionStatus(true));
window.addEventListener("offline", () => setConnectionStatus(false));

window.addEventListener("online", async () => {
  try {
    setConnectionStatus(true);
    const reg = await navigator.serviceWorker.ready;

    if ("sync" in reg) {
      await reg.sync.register("sync-orders");
    } else if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SYNC_NOW" });
    }
  } catch (e) {
    console.warn("online sync trigger failed:", e);
  }
});

async function init() {
  displayOrders();
  if (navigator.onLine) {
    setConnectionStatus(true);
  } else {
    setConnectionStatus(false);
  }
}

async function createOrder(body) {
  const response = await fetch("http://localhost:3000/api/orders", {
    // const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return response;
}
async function updateOrder(body) {
  const response = await fetch("http://localhost:3000/api/orders", {
    // const response = await fetch("/api/orders", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return response;
}

window.addEventListener("load", async () => {
  // await registerSW();
  try {
    const ordersFromServer = await fetchOrdersFromServer();
    if (ordersFromServer.length > 0) {
      ordersFromServer.forEach(async (order) => {
        await saveOrder(order);
      });
    }
  } catch (error) {}

  await init();
});

async function registerSW() {
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.register("/sw.js", { type: "module" });

    // ✅ این مهمه: صبر کن SW واقعاً active بشه
    const readyReg = await navigator.serviceWorker.ready;
    console.log("✅ SW ready. scope =", readyReg.scope);

    // ✅ Background Sync فقط بعد از ready
    if ("sync" in readyReg) {
      await readyReg.sync.register("sync-orders");
      console.log("✅ Sync registered: sync-orders");
    } else {
      console.log("⚠️ Background Sync not supported.");
    }

    if ("periodicSync" in readyReg) {
      try {
        await readyReg.periodicSync.register("sync-orders", {
          minInterval: 12 * 60 * 60 * 1000, // 12 ساعت (کمتر معمولاً رد می‌شود)
        });
        console.log("✅ Periodic Sync registered");
      } catch (e) {
        console.log("⚠️ Periodic Sync register failed (normal on many browsers):", e);
      }
    } else {
      console.log("⚠️ Periodic Sync not supported.");
    }

    navigator.serviceWorker.addEventListener("message", (e) => {
      const data = e.data;
      if (!data) return;

      if (data.type === "toast") {
        openModal(data.message, data.level === "error" ? "error" : "success");
      }
    });
  } catch (e) {
    console.error("❌ SW register failed:", e);
  }
}

window.addEventListener("load", registerSW);
