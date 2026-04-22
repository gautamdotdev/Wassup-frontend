import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent right click globally
document.addEventListener("contextmenu", (e) => e.preventDefault());

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Workers
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // PWA Service Worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("PWA SW Registered", reg))
      .catch((err) => console.log("PWA SW registration failed", err));

    // Firebase Messaging Service Worker
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((reg) => console.log("FCM SW Registered", reg))
      .catch((err) => console.log("FCM SW registration failed", err));
  });
}
