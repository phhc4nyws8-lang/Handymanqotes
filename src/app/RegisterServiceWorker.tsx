"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability is a progressive enhancement — a failed registration
        // (e.g. unsupported browser, dev-mode quirk) shouldn't affect the app.
      });
    }
  }, []);

  return null;
}
