"use client";

import { useRef, useState } from "react";
import { useAppState } from "@/components/providers/AppStateProvider";
import { toDateKey } from "@/lib/date";

const HOLD_DURATION_MS = 600;

export function PrimaryLogButton() {
  const { summary, openAddActivity, openDayDetails } = useAppState();
  const [holding, setHolding] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasLoggedToday = summary.todayLogged;

  function startHold() {
    setHolding(true);
    timeoutRef.current = setTimeout(() => {
      setHolding(false);
      const todayKey = toDateKey(new Date());
      if (hasLoggedToday) {
        openDayDetails(todayKey);
      } else {
        openAddActivity(todayKey);
      }
    }, HOLD_DURATION_MS);
  }

  function cancelHold() {
    if (!holding) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHolding(false);
  }

  return (
    <button
      type="button"
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      className={`relative w-full overflow-hidden rounded-xl border-2 py-3.5 text-sm font-bold uppercase tracking-widest transition-colors active:scale-[0.99] ${
        hasLoggedToday ? "border-ink/10 bg-card text-ink" : "border-rust bg-card text-rust"
      }`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-rust/10"
        style={{
          width: holding ? "100%" : "0%",
          transitionProperty: "width",
          transitionDuration: holding ? `${HOLD_DURATION_MS}ms` : "150ms",
        }}
      />
      <span className="relative flex items-center justify-center gap-2">
        {hasLoggedToday && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-[11px] text-card">
            ✓
          </span>
        )}
        {hasLoggedToday ? "Hold to view today's activities" : "Hold to log today"}
      </span>
    </button>
  );
}
