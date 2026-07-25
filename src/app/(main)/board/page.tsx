import { getAthletes, getCurrentUser } from "@/lib/data/athletes";
import {
  getCurrentPeriodId,
  getLeaderboard,
  getPeriodOptions,
  getPeriodProgress,
} from "@/lib/data/leaderboard";
import { SegmentedTabBar } from "@/components/board/SegmentedTabBar";
import { ProgressRail } from "@/components/board/ProgressRail";
import { LiveLeaderboard } from "@/components/board/LiveLeaderboard";

export default async function BoardPage() {
  const [periods, currentPeriodId, progress, rows, athletes, currentUser] =
    await Promise.all([
      getPeriodOptions(),
      getCurrentPeriodId(),
      getPeriodProgress(),
      getLeaderboard(),
      getAthletes(),
      getCurrentUser(),
    ]);

  const athleteById = new Map(athletes.map((athlete) => [athlete.id, athlete]));
  const currentPeriod = periods.find((period) => period.id === currentPeriodId);

  const resolvedRows = rows.map((row) => ({
    ...row,
    name: athleteById.get(row.athleteId)?.name ?? "Unknown",
    isCurrentUser: row.athleteId === currentUser.id,
  }));

  return (
    <>
      <SegmentedTabBar periods={periods} currentPeriodId={currentPeriodId} />
      <ProgressRail progress={progress} />
      <LiveLeaderboard
        rows={resolvedRows}
        periodLabel={currentPeriod?.label ?? progress.periodLabel}
      />
    </>
  );
}
