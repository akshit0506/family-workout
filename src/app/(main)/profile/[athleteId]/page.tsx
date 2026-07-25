import { notFound } from "next/navigation";
import {
  getActivityBreakdown,
  getAthlete,
  getCurrentUser,
} from "@/lib/data/athletes";
import {
  getCurrentPeriodId,
  getLeaderboard,
  getMyPeriodRankings,
  getPeriodOptions,
} from "@/lib/data/leaderboard";
import { StreakCard } from "@/components/profile/StreakCard";
import { StatStrip } from "@/components/profile/StatStrip";
import { ActivityBreakdown } from "@/components/profile/ActivityBreakdown";
import { MonthCalendar } from "@/components/profile/MonthCalendar";
import { AthleteActivityFeed } from "@/components/profile/AthleteActivityFeed";
import { AthleteSummaryCard } from "@/components/profile/AthleteSummaryCard";
import { RankingsHistory } from "@/components/profile/RankingsHistory";
import { SectionHeader } from "@/components/ui/SectionHeader";

type AthleteProfilePageProps = {
  params: Promise<{ athleteId: string }>;
};

export default async function AthleteProfilePage({ params }: AthleteProfilePageProps) {
  const { athleteId } = await params;
  const [athlete, currentUser] = await Promise.all([getAthlete(athleteId), getCurrentUser()]);

  if (!athlete) notFound();

  const isSelf = athlete.id === currentUser.id;

  if (isSelf) {
    const [activityBreakdown, periods, currentPeriodId, myRankings] = await Promise.all([
      getActivityBreakdown(),
      getPeriodOptions(),
      getCurrentPeriodId(),
      getMyPeriodRankings(),
    ]);

    const periodById = new Map(periods.map((period) => [period.id, period]));
    const rankingsRows = myRankings.map((row) => ({
      periodId: row.periodId,
      periodLabel: periodById.get(row.periodId)?.label ?? row.periodId,
      isLive: row.periodId === currentPeriodId,
      rank: row.rank,
      workoutDays: row.workoutDays,
    }));

    return (
      <>
        <StreakCard />
        <StatStrip />

        <div className="flex flex-col gap-3">
          <SectionHeader>Activities</SectionHeader>
          <ActivityBreakdown items={activityBreakdown} />
        </div>

        <MonthCalendar />

        <div className="flex flex-col gap-3">
          <SectionHeader variant="heading">My Activity</SectionHeader>
          <AthleteActivityFeed athleteId={athlete.id} />
        </div>

        <div className="flex flex-col gap-3">
          <SectionHeader>Rankings</SectionHeader>
          <RankingsHistory rows={rankingsRows} />
        </div>
      </>
    );
  }

  const leaderboardRows = await getLeaderboard();
  const leaderboardRow = leaderboardRows.find((row) => row.athleteId === athlete.id);

  return (
    <>
      <AthleteSummaryCard athlete={athlete} leaderboardRow={leaderboardRow} />

      <div className="flex flex-col gap-3">
        <SectionHeader variant="heading">{`${athlete.name}'s Activity`}</SectionHeader>
        <AthleteActivityFeed athleteId={athlete.id} />
      </div>
    </>
  );
}
