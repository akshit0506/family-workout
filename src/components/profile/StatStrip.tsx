"use client";

import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useAppState } from "@/components/providers/AppStateProvider";

export function StatStrip() {
  const { summary } = useAppState();

  return (
    <Card className="grid grid-cols-4 gap-2 text-center">
      <div className="flex flex-col items-center gap-1">
        <p className="text-2xl font-bold text-ink transition-all">
          {summary.entriesThisPeriod}
        </p>
        <Eyebrow>{`This ${summary.periodLabel}`}</Eyebrow>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-2xl font-bold text-ink transition-all">
          {summary.allTimeEntries}
        </p>
        <Eyebrow>All-time</Eyebrow>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-2xl font-bold text-ink transition-all">{summary.bestStreak}</p>
        <Eyebrow>Best streak</Eyebrow>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-2xl font-bold text-ink">{summary.kudosReceived} 👏</p>
        <Eyebrow>Kudos</Eyebrow>
      </div>
    </Card>
  );
}
