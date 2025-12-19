import openDB from "./db.js";

// Log telemetry events
export async function logTelemetryEvent(eventName, data) {
  const db = await openDB();
  const transaction = db.transaction("telemetry", "readwrite");
  const telemetryStore = transaction.objectStore("telemetry");

  const event = {
    eventName,
    data,
    timestamp: Date.now(),
  };

  telemetryStore.add(event);
}

// // Example of logging an event
// logTelemetryEvent("order_created_offline", { orderId: 123, customer: "John Doe" });
