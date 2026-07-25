"use client";

import { useState } from "react";
import { FeedCard } from "@/components/home/FeedCard";
import { Button } from "@/components/ui/Button";
import { useAppState } from "@/components/providers/AppStateProvider";
import { formatEntryTimestamp } from "@/lib/format";

type AthleteActivityFeedProps = {
  athleteId: string;
  previewCount?: number;
};

export function AthleteActivityFeed({ athleteId, previewCount = 1 }: AthleteActivityFeedProps) {
  const { entries, athletes, currentUser } = useAppState();
  const [expanded, setExpanded] = useState(false);

  const author = athletes.find((athlete) => athlete.id === athleteId);
  const athleteEntries = entries
    .filter((entry) => entry.athleteId === athleteId)
    .sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1));

  const visibleEntries = expanded ? athleteEntries : athleteEntries.slice(0, previewCount);

  if (athleteEntries.length === 0) {
    return (
      <p className="rounded-lg border border-ink/10 bg-card px-4 py-6 text-center text-sm text-muted">
        No activity logged yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleEntries.map((entry) => (
        <FeedCard
          key={entry.id}
          entryId={entry.id}
          athleteId={entry.athleteId}
          authorName={author?.name ?? "Unknown"}
          isOwnEntry={entry.athleteId === currentUser.id}
          timestampLabel={formatEntryTimestamp(entry.loggedAt)}
          activities={entry.activities}
          durationLabel={entry.durationLabel}
          notes={entry.notes}
          achievementNote={entry.achievementNote}
        />
      ))}

      {!expanded && athleteEntries.length > previewCount && (
        <Button fullWidth onClick={() => setExpanded(true)}>
          {`Show all · ${athleteEntries.length}`}
        </Button>
      )}
    </div>
  );
}
