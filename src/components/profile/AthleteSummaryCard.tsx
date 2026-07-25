import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NumberTile } from "@/components/ui/NumberTile";
import type { Athlete, LeaderboardRow } from "@/lib/types";

type AthleteSummaryCardProps = {
  athlete: Athlete;
  leaderboardRow?: LeaderboardRow;
};

export function AthleteSummaryCard({ athlete, leaderboardRow }: AthleteSummaryCardProps) {
  const note = leaderboardRow?.streakLabel
    ? `🔥 ${leaderboardRow.streakLabel}`
    : leaderboardRow?.recentCountLabel;

  return (
    <Card emphasis className="flex flex-col items-center gap-2 text-center">
      <Avatar name={athlete.name} size="md" />
      <p className="text-2xl font-bold text-ink">{athlete.name}</p>
      <Eyebrow>
        {leaderboardRow
          ? `Rank #${leaderboardRow.rank.toString().padStart(2, "0")} this quarter`
          : "No ranking yet this quarter"}
      </Eyebrow>

      {leaderboardRow && (
        <div className="mt-2 flex flex-col items-center gap-1">
          <NumberTile value={leaderboardRow.workoutDays} />
          <span className="text-xs font-bold uppercase tracking-wide text-ink/60">
            Workout days
          </span>
        </div>
      )}

      {note && <p className="mt-1 text-sm font-bold text-olive">{note}</p>}
    </Card>
  );
}
