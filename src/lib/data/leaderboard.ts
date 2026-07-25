import { startOfDay } from "@/lib/date";
import { computeCompetitionRanks } from "@/lib/ranking";
import { computeCurrentStreak, countLoggedDaysInWindow, getLoggedDateKeys } from "@/lib/stats";
import type { LeaderboardRow, PeriodOption, PeriodProgress, PeriodRankSummary } from "@/lib/types";
import {
  fetchActivitiesAsFeedEntries,
  fetchAllAthletes,
  fetchCurrentAthlete,
} from "@/lib/data/supabase-helpers";

const DAY_MS = 24 * 60 * 60 * 1000;

function quarterIndexOf(date: Date): number {
  return Math.floor(date.getMonth() / 3);
}

// Periods are pure calendar math, not user data — no Supabase call needed.
// Replaces what used to be hardcoded mock values ("Q3", day 24 of 92) with
// whatever quarter "today" actually falls in, so this never goes stale.
export async function getPeriodOptions(): Promise<PeriodOption[]> {
  const today = new Date();
  const year = today.getFullYear();
  const currentQuarterIndex = quarterIndexOf(today);

  const options: PeriodOption[] = [];
  for (let quarter = 0; quarter <= currentQuarterIndex; quarter++) {
    options.push({
      id: `q${quarter + 1}-${year}`,
      label: `Q${quarter + 1} '${String(year).slice(2)}`,
    });
  }
  options.push({ id: String(year), label: String(year) });
  options.push({ id: String(year - 1), label: String(year - 1) });
  return options;
}

export async function getCurrentPeriodId(): Promise<string> {
  const today = new Date();
  return `q${quarterIndexOf(today) + 1}-${today.getFullYear()}`;
}

export async function getPeriodProgress(): Promise<PeriodProgress> {
  const today = new Date();
  const quarterIndex = quarterIndexOf(today);
  const quarterStart = new Date(today.getFullYear(), quarterIndex * 3, 1);
  const quarterEnd = new Date(today.getFullYear(), quarterIndex * 3 + 3, 1);

  return {
    periodLabel: `Q${quarterIndex + 1}`,
    currentDay: Math.floor((startOfDay(today).getTime() - quarterStart.getTime()) / DAY_MS) + 1,
    totalDays: Math.round((quarterEnd.getTime() - quarterStart.getTime()) / DAY_MS),
  };
}

/**
 * "Workout days this period" is defined the same way AppStateProvider
 * already defines it client-side (countLoggedDaysInWindow trailing back
 * periodDaysElapsed days from today) rather than a calendar quarter-boundary
 * query, so the SSR value and the client's live recompute never disagree.
 * At this scale (7 athletes, a few hundred rows) fetching full history and
 * ranking in JS via the existing pure helpers is simpler and cheaper than a
 * new SQL aggregate, and reuses code already covered by the client path.
 */
export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  try {
    const [athletes, periodProgress, entries] = await Promise.all([
      fetchAllAthletes(),
      getPeriodProgress(),
      fetchActivitiesAsFeedEntries(),
    ]);

    const today = new Date();
    const rows = athletes.map((athlete) => {
      const loggedDateKeys = getLoggedDateKeys(entries, athlete.id);
      const streakDays = computeCurrentStreak(loggedDateKeys, today);
      const hasActiveStreak = streakDays >= 2;

      return {
        athleteId: athlete.id,
        workoutDays: countLoggedDaysInWindow(loggedDateKeys, today, periodProgress.currentDay),
        streakLabel: hasActiveStreak ? `${streakDays}-day streak` : undefined,
        recentCountLabel: hasActiveStreak
          ? undefined
          : `${countLoggedDaysInWindow(loggedDateKeys, today, 30)} in the last 30`,
      };
    });

    return computeCompetitionRanks(rows).sort((a, b) => a.rank - b.rank);
  } catch {
    return [];
  }
}

// Deeper historical ranking (past quarters) is an open decision per
// BACKEND_PLAN.md §8 — honestly reporting null/0 for non-current periods
// rather than inventing a ranking system this milestone didn't ask for.
export async function getMyPeriodRankings(): Promise<PeriodRankSummary[]> {
  try {
    const [periodOptions, currentPeriodId, leaderboard, currentAthlete] = await Promise.all([
      getPeriodOptions(),
      getCurrentPeriodId(),
      getLeaderboard(),
      fetchCurrentAthlete(),
    ]);

    const myRow = leaderboard.find((row) => row.athleteId === currentAthlete.id);

    return periodOptions.map((option) =>
      option.id === currentPeriodId
        ? {
            periodId: option.id,
            rank: myRow?.rank ?? null,
            workoutDays: myRow?.workoutDays ?? 0,
          }
        : { periodId: option.id, rank: null, workoutDays: 0 }
    );
  } catch {
    return [];
  }
}
