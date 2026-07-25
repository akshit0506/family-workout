"use client";

import { useState } from "react";
import type { PeriodOption } from "@/lib/types";
import { INTERACTIVE_CLASSES } from "@/lib/interactive";

type SegmentedTabBarProps = {
  periods: PeriodOption[];
  currentPeriodId: string;
};

export function SegmentedTabBar({ periods, currentPeriodId }: SegmentedTabBarProps) {
  const [selectedId, setSelectedId] = useState(currentPeriodId);

  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto pb-1">
      {periods.map((period) => {
        const isSelected = period.id === selectedId;
        const isCurrent = period.id === currentPeriodId;

        return (
          <button
            key={period.id}
            type="button"
            onClick={() => setSelectedId(period.id)}
            aria-pressed={isSelected}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${INTERACTIVE_CLASSES} ${
              isSelected
                ? "border-ink bg-ink text-card"
                : "border-ink/15 bg-card text-ink hover:bg-ink/5"
            }`}
          >
            {isCurrent && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rust" aria-hidden />
            )}
            {period.label}
          </button>
        );
      })}
    </div>
  );
}
