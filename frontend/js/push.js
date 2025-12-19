// Request permission for push notifications
export async function requestPushPermission() {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    console.log("Notification permission granted");
    // Subscribe to push notifications if permission is granted
    subscribeToPush();
  } else {
    console.log("Notification permission denied");
  }
}

// Subscribe to push notifications
async function subscribeToPush() {
  const serviceWorker = await navigator.serviceWorker.ready;
  const subscription = await serviceWorker.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: "YOUR_PUBLIC_VAPID_KEY",
  });
  console.log("Subscribed to push:", subscription);
  // Save subscription to backend
  await saveSubscriptionToBackend(subscription);
}

// Save push subscription to the backend
async function saveSubscriptionToBackend(subscription) {
  const response = await fetch("http://localhost:3000/api/orders", {
    // const response = await fetch("/api/push-subscription", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subscription),
  });
  return response.json();
}

// استفاده از fallbackPushNotification
self.addEventListener("push", (e) => {
  const data = e.data.json();
  fallbackPushNotification(data.title, data.body);
});

// Handle click on push notification
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  // Open specific order page when notification is clicked
  e.waitUntil(clients.openWindow("/order/" + e.notification.tag));
});

// Fallback for iOS when Push Notifications are not supported
// Fallback function for iOS
function fallbackPushNotification(title, body) {
  if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
    // Display an in-app notification (example: using a modal or toast)
    showInAppNotification(title, body);
  } else {
    // For other platforms, we can use push notifications
    showPushNotification(title, body);
  }
}

function showInAppNotification(title, body) {
  // Example: Show a toast notification or modal in the app
  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.textContent = `${title}: ${body}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// Show push notification
function showPushNotification(title, body) {
  const options = {
    body: body,
    icon: "/images/notification-icon.png", // Icon for the notification
    badge: "/images/badge-icon.png", // Badge for the notification
    tag: "order-notification", // Tag to manage multiple notifications
  };

  // Display the notification
  self.registration.showNotification(title, options);
}
