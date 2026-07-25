import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";

type RankingsHistoryRow = {
  periodId: string;
  periodLabel: string;
  isLive: boolean;
  rank: number | null;
  workoutDays: number;
};

type RankingsHistoryProps = {
  rows: RankingsHistoryRow[];
};

export function RankingsHistory({ rows }: RankingsHistoryProps) {
  return (
    <Card className="divide-y divide-hairline" padding="sm">
      {rows.map((row) => (
        <div key={row.periodId} className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink">{row.periodLabel}</span>
            {row.isLive && (
              <span className="text-xs font-bold uppercase tracking-wide text-rust">
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-ink">
              {row.rank !== null ? `#${row.rank.toString().padStart(2, "0")}` : "—"}
            </span>
            <Eyebrow>{`${row.workoutDays} days`}</Eyebrow>
          </div>
        </div>
      ))}
    </Card>
  );
}
