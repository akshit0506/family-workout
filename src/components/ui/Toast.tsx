"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

function subscribeNever() {
  return () => {};
}

function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

type ToastProps = {
  message: string | null;
};

export function Toast({ message }: ToastProps) {
  const mounted = useHasMounted();
  const [displayedMessage, setDisplayedMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      // Same two-phase mount-then-animate pattern as BottomSheet: commit the
      // message first, then flip visible on the next frame so the transition
      // has a starting state to animate from.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayedMessage(message);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timeout = setTimeout(() => setDisplayedMessage(null), 200);
    return () => clearTimeout(timeout);
  }, [message]);

  if (!mounted || !displayedMessage) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4">
      <div
        className={`pointer-events-auto rounded-full border border-ink/10 bg-ink px-4 py-2.5 text-sm font-bold text-card shadow-lg transition-all duration-200 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {displayedMessage}
      </div>
    </div>,
    document.body
  );
}
