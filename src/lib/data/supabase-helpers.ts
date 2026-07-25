import { redirect } from "next/navigation";
import { createServerSupabaseClient, getAuthUser } from "@/lib/supabase/server";
import type { Athlete, FeedEntry } from "@/lib/types";

type ActivityRow = {
  id: string;
  athlete_id: string;
  logged_at: string;
  duration_label: string | null;
  notes: string | null;
  achievement_note: string | null;
  activity_entry_types: { activity_types: { label: string } | null }[] | null;
  kudos: { athlete_id: string }[] | null;
};

const ACTIVITY_SELECT = `
  id,
  athlete_id,
  logged_at,
  duration_label,
  notes,
  achievement_note,
  activity_entry_types ( activity_types ( label ) ),
  kudos ( athlete_id )
`;

function toFeedEntry(row: ActivityRow): FeedEntry {
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
  };
}

/**
 * Reconstructs FeedEntry[] from activities + their joined types and kudos —
 * the one join every list-shaped lib/data/* read is built from, so the
 * mapping only lives in one place.
 */
export async function fetchActivitiesAsFeedEntries(options?: {
  athleteId?: string;
  since?: Date;
}): Promise<FeedEntry[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .order("logged_at", { ascending: false });

  if (options?.athleteId) query = query.eq("athlete_id", options.athleteId);
  if (options?.since) query = query.gte("logged_at", options.since.toISOString());

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => toFeedEntry(row as unknown as ActivityRow));
}

/**
 * Resolves "the current athlete" from the actual signed-in session —
 * proxy.ts guarantees every (main) request has one before this runs.
 * auth_user_id is populated by claiming a profile (see /login and the
 * claim_athlete() RPC in 20260725161000_auth_claim.sql), so this is a
 * direct lookup, not a guess.
 *
 * A session can legitimately exist with no linked athlete yet: sign-up is
 * no longer invite-gated, so someone can verify an OTP and then abandon
 * the "pick your name" step (close the tab, lose connection, etc.) before
 * claiming completes. That's not a hard failure — send them back to
 * /login to resume claiming, rather than crashing to error.tsx.
 */
export async function fetchCurrentAthlete(): Promise<Athlete> {
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
    throw new Error(`Could not resolve the current athlete for ${user.email ?? user.id}.`, {
      cause: error,
    });
  }

  if (!data) {
    // ?resume=1 tells /login to skip straight to the "pick your name" step
    // instead of asking this already-authenticated session to sign in again.
    redirect("/login?resume=1");
  }

  return data;
}

export async function fetchAllAthletes(): Promise<Athlete[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("athletes")
    .select("id, name")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
