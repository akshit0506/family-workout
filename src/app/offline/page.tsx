"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { APP_NAME } from "@/lib/config";

// Precached by the service worker (see public/sw.js) and served as the
// navigation fallback when a page fails to load with no network — never
// linked to from anywhere in the app itself. Deliberately static: no auth
// check, no data fetching, nothing that could itself fail offline.
export default function OfflinePage() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 sm:px-6">
      <div className="flex flex-col gap-1.5">
        <Eyebrow>{APP_NAME}</Eyebrow>
        <h1 className="font-display text-3xl uppercase leading-none tracking-tight text-ink">
          You&rsquo;re offline
        </h1>
      </div>

      <Card emphasis>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="text-3xl">📡</span>
          <p className="font-bold text-ink">No connection</p>
          <p className="text-sm text-muted">
            This screen hasn&rsquo;t been loaded before, so there&rsquo;s nothing saved to show
            offline. Reconnect and try again.
          </p>
          <Button
            variant="solid"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
        </div>
      </Card>
    </div>
  );
}
