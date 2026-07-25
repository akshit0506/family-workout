"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NumberTile } from "@/components/ui/NumberTile";
import { ActivitySparkline } from "@/components/home/ActivitySparkline";
import { useAppState } from "@/components/providers/AppStateProvider";
import { INTERACTIVE_CLASSES } from "@/lib/interactive";

export function HomeStats() {
  const { summary, currentUser } = useAppState();

  return (
    <Card emphasis>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Eyebrow>{`Your ${summary.periodLabel}`}</Eyebrow>
          <span className="flex items-center gap-1 rounded-full bg-rust/10 px-2 py-0.5 text-xs font-bold text-rust transition-colors">
            {summary.streakDays}-day streak 🔥
          </span>
        </div>
        <Link
          href={`/profile/${currentUser.id}`}
          className={`rounded-md text-xs font-bold uppercase tracking-widest text-rust hover:opacity-70 ${INTERACTIVE_CLASSES}`}
        >
          Your ledger →
        </Link>
      </div>

      <div className="mt-2.5 grid grid-cols-[1.15fr_1fr_0.95fr] items-end divide-x divide-hairline">
        <div className="flex flex-col items-start gap-1 pr-3">
          <NumberTile value={summary.entriesThisPeriod} size="sm" />
          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-muted">
            Workout Days
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 px-3">
          <span className="text-3xl font-bold text-ink transition-all">
            {summary.last30Days}
          </span>
          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-muted">
            Last 30d
          </span>
        </div>
        <div className="flex flex-col items-end gap-1 pl-3">
          <span className="text-3xl font-bold text-ink">
            {`#${summary.rank.toString().padStart(2, "0")}`}
          </span>
          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-muted">
            {`Rank · ${summary.periodLabel}`}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <ActivitySparkline values={summary.sparkline} />
        <Eyebrow className="mt-1 block whitespace-nowrap text-center">Last 30d</Eyebrow>
      </div>
    </Card>
  );
}
