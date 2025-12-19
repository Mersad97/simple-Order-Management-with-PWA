export function checkOnlineStatus() {
  return navigator.onLine;
}

export function setConnectionStatus(status) {
  const statusText = status ? "Online" : "Offline";
  // document.getElementById("connection-status").textContent = `Connection Status: ${statusText}`;
  // document.getElementById("connection-status").classList.add(status ? "green" : "red");
  // document.getElementById("connection-status").classList.remove(status ? "red" : "green");
  document.getElementById("connection-status-span").textContent = `${statusText}`;
  document.getElementById("connection-status-span").classList.add(status ? "green" : "red");
  document.getElementById("connection-status-span").classList.remove(status ? "red" : "green");
}
