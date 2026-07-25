import { addDays, startOfDay, toDateKey } from "@/lib/date";
import type { FeedEntry } from "@/lib/types";

export function getLoggedDateKeys(entries: FeedEntry[], athleteId: string): Set<string> {
  const keys = new Set<string>();
  for (const entry of entries) {
    if (entry.athleteId !== athleteId) continue;
    keys.add(toDateKey(new Date(entry.loggedAt)));
  }
  return keys;
}

export function isDayLogged(loggedDateKeys: Set<string>, date: Date): boolean {
  return loggedDateKeys.has(toDateKey(date));
}

export function computeCurrentStreak(loggedDateKeys: Set<string>, today: Date): number {
  let cursor = startOfDay(today);
  if (!loggedDateKeys.has(toDateKey(cursor))) {
    // Today not logged yet doesn't break a streak that's still "active" until the day ends.
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  while (loggedDateKeys.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function computeBestStreak(loggedDateKeys: Set<string>): number {
  const sortedDays = Array.from(loggedDateKeys)
    .map((key) => {
      const [year, month, day] = key.split("-").map(Number);
      return new Date(year, month, day).getTime();
    })
    .sort((a, b) => a - b);

  let best = 0;
  let current = 0;
  let previous: number | null = null;
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (const time of sortedDays) {
    current = previous !== null && time - previous === oneDayMs ? current + 1 : 1;
    best = Math.max(best, current);
    previous = time;
  }

  return best;
}

export function buildTrailingWindow(
  loggedDateKeys: Set<string>,
  today: Date,
  days: number
): number[] {
  const result: number[] = [];
  const start = startOfDay(today);
  for (let i = days - 1; i >= 0; i--) {
    result.push(isDayLogged(loggedDateKeys, addDays(start, -i)) ? 1 : 0);
  }
  return result;
}

export function buildWeekStatus(loggedDateKeys: Set<string>, today: Date): boolean[] {
  return buildTrailingWindow(loggedDateKeys, today, 7).map((value) => value === 1);
}

export function countLoggedDaysInWindow(
  loggedDateKeys: Set<string>,
  today: Date,
  days: number
): number {
  return buildTrailingWindow(loggedDateKeys, today, days).reduce((sum, v) => sum + v, 0);
}

export function computeKudosReceived(entries: FeedEntry[], athleteId: string): number {
  return entries
    .filter((entry) => entry.athleteId === athleteId)
    .reduce((sum, entry) => sum + entry.kudosFromAthleteIds.length, 0);
}
