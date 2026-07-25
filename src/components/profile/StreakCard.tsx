"use client";

import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useAppState } from "@/components/providers/AppStateProvider";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function encouragementFor(streakDays: number): string {
  if (streakDays <= 0) return "Log today to start a new streak.";
  const dayWord = streakDays === 1 ? "day" : "days";
  return `${streakDays} ${dayWord} and counting — keep it up!`;
}

export function StreakCard() {
  const { summary } = useAppState();
  const { streakDays, weekStatus } = summary;

  return (
    <Card emphasis className="flex flex-col items-center gap-3 text-center">
      <span className="text-4xl" aria-hidden>
        🔥
      </span>
      <div>
        <p className="text-5xl font-bold text-ink transition-all">{streakDays}</p>
        <Eyebrow>Day streak</Eyebrow>
      </div>
      <div className="flex w-full justify-between gap-1 pt-1">
        {weekStatus.map((isChecked, index) => (
          <div key={index} className="flex flex-col items-center gap-1.5">
            <Eyebrow>{DAY_LABELS[index]}</Eyebrow>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm text-card transition-colors duration-300 ${
                isChecked ? "border-success bg-success" : "border-hairline bg-transparent"
              }`}
            >
              {isChecked && "✓"}
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm font-bold text-olive">{encouragementFor(streakDays)}</p>
    </Card>
  );
}
