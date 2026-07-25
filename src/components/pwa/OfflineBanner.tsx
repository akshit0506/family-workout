"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  // Assumed online during SSR (there's no navigator on the server) —
  // useSyncExternalStore reconciles this against the real client value
  // immediately after hydration, same pattern BottomSheet/Toast already
  // use for other browser-API-derived state.
  return true;
}

// Fixed at the very top of the viewport regardless of which route/layout
// is active (mounted once in the root layout) — connectivity loss can
// happen mid-onboarding just as easily as mid-app, and a fixed overlay
// doesn't require threading this through every page's own layout.
export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (isOnline) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-rust px-4 py-2 text-center text-xs font-bold uppercase tracking-wide text-card"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
    >
      📡 You&rsquo;re offline — some actions won&rsquo;t work until you&rsquo;re back
    </div>
  );
}
