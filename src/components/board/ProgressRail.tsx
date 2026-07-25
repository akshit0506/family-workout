import { Eyebrow } from "@/components/ui/Eyebrow";
import type { PeriodProgress } from "@/lib/types";

type ProgressRailProps = {
  progress: PeriodProgress;
};

export function ProgressRail({ progress }: ProgressRailProps) {
  const { periodLabel, currentDay, totalDays } = progress;
  const percentComplete = Math.min(100, Math.max(0, (currentDay / totalDays) * 100));
  const daysRemaining = Math.max(0, totalDays - currentDay);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-1.5 rounded-full bg-hairline">
        <div
          className="h-full rounded-full bg-ink"
          style={{ width: `${percentComplete}%` }}
        />
        <div
          className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-rust"
          style={{ left: `${percentComplete}%` }}
          aria-hidden
        />
      </div>
      <div className="flex items-center justify-between">
        <Eyebrow>{`${periodLabel} · Day ${currentDay} of ${totalDays}`}</Eyebrow>
        <Eyebrow>{`${daysRemaining} days remain`}</Eyebrow>
      </div>
    </div>
  );
}
