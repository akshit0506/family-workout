"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useAppState } from "@/components/providers/AppStateProvider";
import { startOfDay, toDateKey } from "@/lib/date";
import { INTERACTIVE_CLASSES } from "@/lib/interactive";
import { getLoggedDateKeys } from "@/lib/stats";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmpty = (firstOfMonth.getDay() + 6) % 7; // week starts Monday

  return [
    ...Array(leadingEmpty).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
}

export function MonthCalendar() {
  const { entries, currentUser, openAddActivity, openDayDetails } = useAppState();
  const loggedDateKeys = getLoggedDateKeys(entries, currentUser.id);

  const today = new Date();
  const todayMidnight = startOfDay(today);

  const [monthOffset, setMonthOffset] = useState(0);

  const viewedDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const viewedYear = viewedDate.getFullYear();
  const viewedMonth = viewedDate.getMonth();
  const cells = buildMonthCells(viewedYear, viewedMonth);

  const monthCount = cells.filter(
    (day) => day !== null && loggedDateKeys.has(toDateKey(new Date(viewedYear, viewedMonth, day)))
  ).length;

  function handleDayClick(day: number) {
    const key = toDateKey(new Date(viewedYear, viewedMonth, day));
    if (loggedDateKeys.has(key)) {
      openDayDetails(key);
    } else {
      openAddActivity(key);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-bold text-ink">
          {viewedDate.toLocaleDateString("en-US", { month: "long" })}{" "}
          <span className="text-muted">{viewedYear}</span>
        </h3>
        <div className="flex items-center gap-2">
          <Chip variant="filled" tone="success">{`${monthCount} this month`}</Chip>
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonthOffset((offset) => offset - 1)}
            className={`flex h-9 w-9 items-center justify-center rounded-md border border-ink/15 text-ink hover:bg-ink/5 ${INTERACTIVE_CLASSES}`}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonthOffset((offset) => offset + 1)}
            className={`flex h-9 w-9 items-center justify-center rounded-md border border-ink/15 text-ink hover:bg-ink/5 ${INTERACTIVE_CLASSES}`}
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAY_LABELS.map((label, index) => (
          <Eyebrow key={index}>{label}</Eyebrow>
        ))}

        {cells.map((day, index) => {
          if (day === null) return <div key={index} />;

          const cellDate = new Date(viewedYear, viewedMonth, day);
          const isFuture = cellDate > todayMidnight;
          const isToday = cellDate.getTime() === todayMidnight.getTime();
          const isLogged = loggedDateKeys.has(toDateKey(cellDate));

          return (
            <div key={index} className="flex justify-center">
              <button
                type="button"
                disabled={isFuture}
                onClick={() => handleDayClick(day)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors duration-150 ${
                  isLogged
                    ? "bg-success text-card hover:bg-success/90"
                    : isFuture
                      ? "cursor-default text-hairline"
                      : isToday
                        ? "border-2 border-ink/40 text-ink hover:bg-ink/5"
                        : "text-ink hover:bg-ink/5"
                } ${isFuture ? "" : INTERACTIVE_CLASSES}`}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs font-bold uppercase tracking-wide text-muted">
        Tap a day to add or review activities
      </p>
    </Card>
  );
}
