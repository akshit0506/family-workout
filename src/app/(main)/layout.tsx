import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { getActivityTypes } from "@/lib/data/activityTypes";
import { getAthletes, getCurrentUser, getCurrentUserSummary } from "@/lib/data/athletes";
import { getAllComments } from "@/lib/data/comments";
import { getFeed } from "@/lib/data/feed";
import { getPeriodProgress } from "@/lib/data/leaderboard";

// Every screen under this layout reads live Supabase data (per-request, not
// buildable statically) — see FRONTEND_INTEGRATION.md for why.
export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const [summary, entries, athletes, currentUser, comments, periodProgress, activityTypes] =
    await Promise.all([
      getCurrentUserSummary(),
      getFeed(),
      getAthletes(),
      getCurrentUser(),
      getAllComments(),
      getPeriodProgress(),
      getActivityTypes(),
    ]);

  return (
    <AppStateProvider
      initialSummary={summary}
      initialEntries={entries}
      athletes={athletes}
      currentUser={currentUser}
      initialComments={comments}
      periodDaysElapsed={periodProgress.currentDay}
      initialActivityTypes={activityTypes}
    >
      <AppShell>{children}</AppShell>
    </AppStateProvider>
  );
}
