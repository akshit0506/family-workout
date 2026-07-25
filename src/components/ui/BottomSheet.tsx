"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { INTERACTIVE_CLASSES } from "@/lib/interactive";

const TRANSITION_MS = 200;

function subscribeNever() {
  return () => {};
}

// Portals need `document.body`, which only exists client-side. This is the
// standard hydration-safe way to detect "has the client mounted" without an
// effect-triggered re-render.
function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  zIndexClassName?: string;
};

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  zIndexClassName = "z-50",
}: BottomSheetProps) {
  const mounted = useHasMounted();
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      // Two-phase commit is required for the slide-up transition to play:
      // mount in the hidden position first, then flip to visible on the next
      // frame so the browser has a starting state to animate from.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRendered(true);
      const frame = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    const timeout = setTimeout(() => setIsRendered(false), TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!isRendered) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isRendered, onClose]);

  if (!mounted || !isRendered) return null;

  return createPortal(
    <div className={`fixed inset-0 flex items-end justify-center ${zIndexClassName}`}>
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[80dvh] w-full max-w-md flex-col rounded-t-2xl border border-ink/10 bg-card p-4 shadow-lg transition-transform duration-200 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
      >
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className={`flex h-9 w-9 items-center justify-center rounded-md border border-ink/15 text-ink hover:bg-ink/5 ${INTERACTIVE_CLASSES}`}
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>,
    document.body
  );
}
