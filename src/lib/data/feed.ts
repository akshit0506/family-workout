import { addDays, startOfDay } from "@/lib/date";
import { fetchActivitiesAsFeedEntries } from "@/lib/data/supabase-helpers";
import type { FeedEntry } from "@/lib/types";

// AppStateProvider treats this list as the single source of truth for
// *everything* it derives client-side — including "all-time" stats and best
// streak (only periodLabel/rank come from the seeded summary; every other
// summary field is recomputed from these entries on first render, SSR
// included). So this can't be trimmed to a short "recent activity" window
// without silently truncating all-time stats once real history outgrows it.
// 400 days comfortably covers any period window (max ~92 days, a quarter)
// while still bounding the query instead of scanning the whole table.
const FEED_WINDOW_DAYS = 400;

export async function getFeed(): Promise<FeedEntry[]> {
  try {
    const since = addDays(startOfDay(new Date()), -FEED_WINDOW_DAYS);
    return await fetchActivitiesAsFeedEntries({ since });
  } catch {
    return [];
  }
}
