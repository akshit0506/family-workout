"use client";

import { usePathname } from "next/navigation";
import { PrimaryLogButton } from "@/components/home/PrimaryLogButton";

export function PersistentAction() {
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <div className="px-4 pb-2 pt-1 sm:px-6">
      <PrimaryLogButton />
    </div>
  );
}
