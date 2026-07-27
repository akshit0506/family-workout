import { cache } from "react";
import { addDays, startOfDay } from "@/lib/date";
import { getPeriodProgress, getLeaderboard } from "@/lib/data/leaderboard";
import {
  fetchActivitiesAsFeedEntries,
  fetchAllAthletes,
  fetchCurrentAthlete,
} from "@/lib/data/supabase-helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildTrailingWindow,
  buildWeekStatus,
  computeBestStreak,
  computeCurrentStreak,
  computeKudosReceived,
  countLoggedDaysInWindow,
  getLoggedDateKeys,
  isDayLogged,
} from "@/lib/stats";
import type { ActivityBreakdownItem, Athlete, CurrentUserSummary } from "@/lib/types";

const EMPTY_SUMMARY: CurrentUserSummary = {
  periodLabel: "",
  entriesThisPeriod: 0,
  last30Days: 0,
  rank: 0,
  sparkline: [],
  streakDays: 0,
  weekStatus: [false, false, false, false, false, false, false],
  allTimeEntries: 0,
  bestStreak: 0,
  kudosReceived: 0,
  todayLogged: false,
};

// A missing/unlinked session is a genuine error, not a valid app state —
// middleware.ts should already have redirected to /login before this can
// run, so this stays a hard failure rather than a fabricated identity,
// propagating to (main)/error.tsx instead of silently guessing who's signed in.
export const getCurrentUser = cache(async function getCurrentUser(): Promise<Athlete> {
  return fetchCurrentAthlete();
});

/**
 * Every number here comes from the same lib/stats.ts pure functions
 * AppStateProvider already uses client-side, run over the current athlete's
 * real activities — including AppStateProvider's exact window definitions
 * (entriesThisPeriod = workout days in the trailing periodDaysElapsed days,
 * not a calendar quarter-boundary count; bestStreak floored by the current
 * streak) — so the SSR-seeded value and the client's live recompute always
 * agree and there's no flash of different numbers on hydration.
 *
 * Note AppStateProvider's own useMemo re-derives every field here except
 * periodLabel and rank from its `entries` prop (getFeed()'s result) on
 * first render, SSR included — those two are the only fields that actually
 * reach the UI unmodified from this function. The rest still has to be
 * correct in its own right (this return value is a fully valid
 * CurrentUserSummary), it's just not the copy that ends up on screen.
 */
export const getCurrentUserSummary = cache(async function getCurrentUserSummary(): Promise<
  CurrentUserSummary
> {
  try {
    const currentAthlete = await fetchCurrentAthlete();
    const today = new Date();

    const [entries, periodProgress, leaderboard] = await Promise.all([
      fetchActivitiesAsFeedEntries({ athleteId: currentAthlete.id }),
      getPeriodProgress(),
      getLeaderboard(),
    ]);

    const loggedDateKeys = getLoggedDateKeys(entries, currentAthlete.id);
    const myRow = leaderboard.find((row) => row.athleteId === currentAthlete.id);
    const streakDays = computeCurrentStreak(loggedDateKeys, today);

    return {
      periodLabel: periodProgress.periodLabel,
      entriesThisPeriod: myRow?.workoutDays ?? 0,
      last30Days: countLoggedDaysInWindow(loggedDateKeys, today, 30),
      rank: myRow?.rank ?? 0,
      sparkline: buildTrailingWindow(loggedDateKeys, today, 30),
      streakDays,
      weekStatus: buildWeekStatus(loggedDateKeys, today),
      allTimeEntries: loggedDateKeys.size,
      bestStreak: Math.max(computeBestStreak(loggedDateKeys), streakDays),
      kudosReceived: computeKudosReceived(entries, currentAthlete.id),
      todayLogged: isDayLogged(loggedDateKeys, today),
    };
  } catch {
    return EMPTY_SUMMARY;
  }
});

// Absence (bad id in the URL) and failure (dead connection) are different:
// maybeSingle() makes "not found" resolve to undefined, the graceful case
// the profile route already renders for; anything else throws to error.tsx.
export const getAthlete = cache(async function getAthlete(id: string): Promise<Athlete | undefined> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("athletes")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ?? undefined;
});

export const getAthletes = cache(async function getAthletes(): Promise<Athlete[]> {
  try {
    return await fetchAllAthletes();
  } catch {
    return [];
  }
});

/**
 * Period-scoped (matches the window shown elsewhere on the same Profile
 * screen via entriesThisPeriod) rather than all-time, so the breakdown and
 * the stat strip above it are always talking about the same days. Percent
 * is relative to workout days, not entry rows, so it can total over 100% on
 * multi-activity days — the same shape the original mock data had.
 */
export const getActivityBreakdown = cache(async function getActivityBreakdown(): Promise<
  ActivityBreakdownItem[]
> {
  try {
    const currentAthlete = await fetchCurrentAthlete();
    const periodProgress = await getPeriodProgress();
    const today = new Date();
    const since = addDays(startOfDay(today), -(periodProgress.currentDay - 1));

    const entries = await fetchActivitiesAsFeedEntries({
      athleteId: currentAthlete.id,
      since,
    });

    const loggedDateKeys = getLoggedDateKeys(entries, currentAthlete.id);
    const totalDays = countLoggedDaysInWindow(loggedDateKeys, today, periodProgress.currentDay);
    if (totalDays === 0) return [];

    const counts = new Map<string, number>();
    for (const entry of entries) {
      for (const activity of entry.activities) {
        counts.set(activity, (counts.get(activity) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: Math.round((count / totalDays) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
});
