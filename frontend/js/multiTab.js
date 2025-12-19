const channel = new BroadcastChannel("sync-channel");

// Send a message to other tabs when an order is added
channel.postMessage({ type: "new-order", orderId: 123 });

// Receive messages from other tabs
channel.addEventListener("message", (e) => {
  if (e.data.type === "new-order") {
    // Update orders list in the current tab
    updateOrdersList();
  }
});
export default channel;
