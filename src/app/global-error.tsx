"use client";

import { useEffect } from "react";
import { APP_NAME } from "@/lib/config";
import "./globals.css";

// (main)/error.tsx does not catch errors thrown by (main)/layout.tsx itself
// (an error.js boundary never wraps the layout.js in its own segment) — and
// that layout is exactly where getCurrentUser() runs. This is the boundary
// that actually catches a failed Supabase connection at that point, so it
// has to define its own <html>/<body> and can't rely on the root layout's
// providers or fonts, which is why it stays deliberately plain.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-full flex-col items-center justify-center gap-3 bg-paper px-6 text-center text-ink">
        <span className="text-xs font-bold uppercase tracking-widest text-rust">
          Something went wrong
        </span>
        <p className="max-w-xs text-sm text-muted">
          {APP_NAME} couldn&apos;t load. Check your connection and try again.
        </p>
        <button
          onClick={unstable_retry}
          className="mt-2 rounded-lg border-2 border-rust bg-rust px-5 py-3 text-sm font-bold uppercase tracking-widest text-card"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
