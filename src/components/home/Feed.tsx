"use client";

import { FeedCard } from "@/components/home/FeedCard";
import { useAppState } from "@/components/providers/AppStateProvider";
import { formatEntryTimestamp } from "@/lib/format";

export function Feed() {
  const { entries, athletes, currentUser } = useAppState();
  const athleteById = new Map(athletes.map((athlete) => [athlete.id, athlete]));
  const sortedEntries = [...entries].sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1));

  if (sortedEntries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        No activity yet — be the first to log a workout today.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sortedEntries.map((entry) => {
        const author = athleteById.get(entry.athleteId);

        return (
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
            photos={entry.photos}
          />
        );
      })}
    </div>
  );
}
