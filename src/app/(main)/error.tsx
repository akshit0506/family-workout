"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";

export default function MainError({
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
    <div className="flex flex-1 items-center py-12">
      <Card className="flex w-full flex-col items-center gap-3 py-12 text-center">
        <Eyebrow color="rust">Something went wrong</Eyebrow>
        <p className="text-sm text-muted">
          We couldn&apos;t load this screen. Check your connection and try again.
        </p>
        <Button variant="solid" onClick={unstable_retry} className="mt-2">
          Try again
        </Button>
      </Card>
    </div>
  );
}
