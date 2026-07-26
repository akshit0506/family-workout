"use client";

import { useEffect, useState } from "react";
import { APP_SHORT_NAME } from "@/lib/config";

const SEEN_KEY = "install-prompt-seen";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own non-standard flag — no `display-mode` media query
    // support there, so this is the only way to detect an installed launch.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Nudges a first-time visitor to install the app, once. Chrome/Android (and
 * desktop Chromium) get a real install button via `beforeinstallprompt` —
 * iOS never fires that event at all, by Apple's design, so it gets
 * instructions for the manual Share-sheet flow instead. Tracked in
 * localStorage so it only ever shows once per device, not on every visit.
 */
export function InstallPrompt() {
  const [variant, setVariant] = useState<"chromium" | "ios" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(SEEN_KEY)) return;

    if (isIOS()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVariant("ios");
      return;
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVariant("chromium");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(SEEN_KEY, "1");
    setVariant(null);
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    localStorage.setItem(SEEN_KEY, "1");
    setVariant(null);
  }

  if (!variant) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-md justify-center px-4"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
    >
      <div className="flex w-full items-center gap-3 rounded-xl border-2 border-rust bg-card px-4 py-3 shadow-lg">
        <span className="text-2xl" aria-hidden>
          📲
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-ink">Install {APP_SHORT_NAME}</p>
          <p className="text-xs text-muted">
            {variant === "ios"
              ? "Tap the Share icon, then “Add to Home Screen.”"
              : "Add it to your home screen for the full app experience."}
          </p>
        </div>
        {variant === "chromium" && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="shrink-0 rounded-lg border-2 border-rust bg-rust px-3 py-2 text-xs font-bold uppercase tracking-widest text-card"
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-lg leading-none text-muted hover:text-ink"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
