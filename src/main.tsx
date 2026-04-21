import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent right click globally
document.addEventListener("contextmenu", (e) => e.preventDefault());

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW Registered", reg))
      .catch((err) => console.log("SW registration failed", err));
  });
}
