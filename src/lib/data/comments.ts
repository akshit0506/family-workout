import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Comment } from "@/lib/types";

type CommentRow = {
  id: string;
  activity_id: string;
  athlete_id: string;
  text: string;
  posted_at: string;
};

export const getAllComments = cache(async function getAllComments(): Promise<
  Record<string, Comment[]>
> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("comments")
      .select("id, activity_id, athlete_id, text, posted_at")
      .order("posted_at", { ascending: true });

    if (error) throw error;

    const grouped: Record<string, Comment[]> = {};
    for (const row of (data ?? []) as CommentRow[]) {
      const list = grouped[row.activity_id] ?? (grouped[row.activity_id] = []);
      list.push({
        id: row.id,
        athleteId: row.athlete_id,
        text: row.text,
        postedAt: row.posted_at,
      });
    }
    return grouped;
  } catch {
    return {};
  }
});
