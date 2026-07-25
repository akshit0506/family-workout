"use client";

import { Podium } from "@/components/board/Podium";
import { RankedList } from "@/components/board/RankedList";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useAppState } from "@/components/providers/AppStateProvider";
import { computeCompetitionRanks } from "@/lib/ranking";
import type { LeaderboardRow } from "@/lib/types";

type ResolvedRow = LeaderboardRow & { name: string; isCurrentUser: boolean };

type LiveLeaderboardProps = {
  rows: ResolvedRow[];
  periodLabel: string;
};

export function LiveLeaderboard({ rows, periodLabel }: LiveLeaderboardProps) {
  const { summary, currentUser } = useAppState();

  const liveRows = rows.map((row) => {
    if (row.athleteId !== currentUser.id) return row;
    return {
      ...row,
      workoutDays: summary.entriesThisPeriod,
      streakLabel: row.streakLabel ? `${summary.streakDays}-day streak` : row.streakLabel,
    };
  });

  const ranked = computeCompetitionRanks(liveRows).sort((a, b) => a.rank - b.rank);
  const top3 = ranked.slice(0, 3).map((row) => ({
    athleteId: row.athleteId,
    name: row.name,
    workoutDays: row.workoutDays,
  }));

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Eyebrow>The Podium</Eyebrow>
          <Eyebrow>{`${periodLabel} · Workout days`}</Eyebrow>
        </div>
        <Podium entries={top3} />
      </div>

      <RankedList entries={ranked} />
    </>
  );
}
