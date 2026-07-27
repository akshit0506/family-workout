import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, getAuthUser } from "@/lib/supabase/server";
import { ACTIVITY_PHOTOS_BUCKET, SIGNED_URL_TTL_SECONDS } from "@/lib/photo";
import type { Athlete, FeedEntry } from "@/lib/types";

type ActivityPhotoRow = {
  id: string;
  storage_path: string;
  position: number;
};

type ActivityRow = {
  id: string;
  athlete_id: string;
  logged_at: string;
  duration_label: string | null;
  notes: string | null;
  achievement_note: string | null;
  activity_entry_types: { activity_types: { label: string } | null }[] | null;
  kudos: { athlete_id: string }[] | null;
  activity_photos: ActivityPhotoRow[] | null;
};

const ACTIVITY_SELECT = `
  id,
  athlete_id,
  logged_at,
  duration_label,
  notes,
  achievement_note,
  activity_entry_types ( activity_types ( label ) ),
  kudos ( athlete_id ),
  activity_photos ( id, storage_path, position )
`;

type FeedEntryDraft = Omit<FeedEntry, "photos"> & { photoRows: ActivityPhotoRow[] };

function toFeedEntryDraft(row: ActivityRow): FeedEntryDraft {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    loggedAt: row.logged_at,
    activities: (row.activity_entry_types ?? [])
      .map((entryType) => entryType.activity_types?.label)
      .filter((label): label is string => Boolean(label)),
    durationLabel: row.duration_label ?? undefined,
    notes: row.notes ?? undefined,
    achievementNote: row.achievement_note ?? undefined,
    kudosFromAthleteIds: (row.kudos ?? []).map((entry) => entry.athlete_id),
    photoRows: (row.activity_photos ?? []).slice().sort((a, b) => a.position - b.position),
  };
}

/**
 * The bucket is private, so every read needs a freshly signed URL — this
 * batches every distinct storage path across a whole feed page into one
 * `createSignedUrls` call instead of one round trip per photo. Paths that
 * fail to sign (deleted object, expired grant) are dropped rather than
 * failing the whole feed.
 */
async function resolvePhotoUrls(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  drafts: FeedEntryDraft[]
): Promise<FeedEntry[]> {
  const paths = Array.from(new Set(drafts.flatMap((draft) => draft.photoRows.map((p) => p.storage_path))));

  const urlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data, error } = await supabase.storage
      .from(ACTIVITY_PHOTOS_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

    if (!error && data) {
      for (const item of data) {
        if (item.signedUrl && item.path) urlByPath.set(item.path, item.signedUrl);
      }
    }
  }

  return drafts.map(({ photoRows, ...entry }) => ({
    ...entry,
    photos: photoRows
      .map((photo) => {
        const url = urlByPath.get(photo.storage_path);
        return url ? { id: photo.id, path: photo.storage_path, url } : null;
      })
      .filter((photo): photo is FeedEntry["photos"][number] => photo !== null),
  }));
}

/**
 * Reconstructs FeedEntry[] from activities + their joined types, kudos, and
 * photos — the one join every list-shaped lib/data/* read is built from, so
 * the mapping only lives in one place.
 *
 * Wrapped in React `cache()` so identical calls within the same request
 * (e.g. the layout and a page both asking for the full unfiltered feed)
 * dedupe into a single Supabase round trip instead of re-querying — this
 * was previously the single largest source of navigation latency, since
 * every page under (main) re-derived the same activity history from
 * scratch. See AGENTS.md re: this Next.js version's request memoization.
 */
export const fetchActivitiesAsFeedEntries = cache(async function fetchActivitiesAsFeedEntries(
  options?: {
    athleteId?: string;
    since?: Date;
  }
): Promise<FeedEntry[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .order("logged_at", { ascending: false });

  if (options?.athleteId) query = query.eq("athlete_id", options.athleteId);
  if (options?.since) query = query.gte("logged_at", options.since.toISOString());

  const { data, error } = await query;
  if (error) throw error;

  const drafts = (data ?? []).map((row) => toFeedEntryDraft(row as unknown as ActivityRow));
  return resolvePhotoUrls(supabase, drafts);
});

/**
 * Resolves "the current athlete" from the actual signed-in session —
 * proxy.ts guarantees every (main) request has one before this runs.
 * auth_user_id is populated by claim_athlete_with_phone() / login_with_phone()
 * in 20260726090000_phone_auth.sql, so this is a direct lookup, not a guess.
 *
 * A session can legitimately exist with no linked athlete yet: an anonymous
 * session gets created as soon as someone starts the claim/sign-in flow on
 * /login, and they might abandon it (close the tab, lose connection) before
 * a claim/login RPC actually links it to an athlete row. That's not a hard
 * failure — send them back to /login to pick up where they left off, rather
 * than crashing to error.tsx.
 */
export const fetchCurrentAthlete = cache(async function fetchCurrentAthlete(): Promise<Athlete> {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("athletes")
    .select("id, name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not resolve the current athlete for ${user.id}.`, {
      cause: error,
    });
  }

  if (!data) {
    redirect("/login");
  }

  return data;
});

export const fetchAllAthletes = cache(async function fetchAllAthletes(): Promise<Athlete[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("athletes")
    .select("id, name")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
});
