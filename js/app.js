/**
 * App entry – Service Worker, offline status, DB init
 */

import { initDB } from "./db.js";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js", { scope: "./" })
      .then((reg) => console.log("Service Worker registered:", reg.scope))
      .catch((err) => console.error("SW register error:", err));
  });
}

function updateOnlineStatus() {
  const banner = document.getElementById("offlineBanner");
  if (banner) banner.style.display = navigator.onLine ? "none" : "block";
}

updateOnlineStatus();
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

initDB().catch((err) => console.error("DB init error:", err));
