"use client";

import { useEffect } from "react";

// Registered from the root layout so it runs regardless of auth state —
// the static shell (JS/CSS/icons) should start caching as early as
// possible, not just once someone's signed in. Skipped outside production:
// a service worker caching hashed dev bundles would make "why isn't my
// change showing up" a recurring, confusing question during `next dev`.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  }, []);

  return null;
}
