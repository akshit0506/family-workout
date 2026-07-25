"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CommentsSheet } from "@/components/home/CommentsSheet";
import { useAppState } from "@/components/providers/AppStateProvider";
import { INTERACTIVE_CLASSES } from "@/lib/interactive";

type FeedCardProps = {
  entryId: string;
  athleteId: string;
  authorName: string;
  isOwnEntry: boolean;
  timestampLabel: string;
  activities: string[];
  durationLabel?: string;
  notes?: string;
  achievementNote?: string;
};

function formatKudosLine(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return `${names[0]} gave kudos`;
  if (names.length === 2) return `${names[0]} and ${names[1]} gave kudos`;
  return `${names[0]}, ${names[1]} + ${names.length - 2} gave kudos`;
}

export function FeedCard({
  entryId,
  athleteId,
  authorName,
  isOwnEntry,
  timestampLabel,
  activities,
  durationLabel,
  notes,
  achievementNote,
}: FeedCardProps) {
  const { entries, athletes, currentUser, toggleKudos, commentsByEntryId, openEditActivity } =
    useAppState();
  const [commentsOpen, setCommentsOpen] = useState(false);

  const entry = entries.find((item) => item.id === entryId);
  const kudosFromAthleteIds = entry?.kudosFromAthleteIds ?? [];
  const athleteById = new Map(athletes.map((athlete) => [athlete.id, athlete]));
  const kudosGivers = kudosFromAthleteIds
    .map((id) => athleteById.get(id)?.name)
    .filter((name): name is string => Boolean(name));
  const kudosLine = formatKudosLine(kudosGivers);
  const hasGivenKudos = kudosFromAthleteIds.includes(currentUser.id);
  const commentsCount = commentsByEntryId[entryId]?.length ?? 0;

  return (
    <Card className="relative flex flex-col gap-2.5">
      {isOwnEntry && (
        <button
          type="button"
          aria-label="Edit entry"
          onClick={() => openEditActivity(entryId)}
          className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md border border-ink/15 text-xs hover:bg-ink/5 ${INTERACTIVE_CLASSES}`}
        >
          ✎
        </button>
      )}

      <Link
        href={`/profile/${athleteId}`}
        className={`flex w-fit items-center gap-3 rounded-md hover:opacity-70 ${INTERACTIVE_CLASSES}`}
      >
        <Avatar name={authorName} size="sm" accent={isOwnEntry} />
        <div>
          <p className="font-bold text-ink">{authorName}</p>
          <Eyebrow>{timestampLabel}</Eyebrow>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <Chip>{activities.join(" · ")}</Chip>
        {durationLabel && (
          <span className="text-sm font-bold text-muted">{durationLabel}</span>
        )}
        {achievementNote && (
          <span className="text-sm font-bold text-success">{achievementNote}</span>
        )}
      </div>

      {notes && <p className="text-sm text-ink">{notes}</p>}

      {kudosLine && <p className="text-sm font-bold text-rust">{kudosLine}</p>}

      <div className="flex items-center gap-2">
        <Chip
          variant={hasGivenKudos ? "filled" : "outline"}
          tone="success"
          onClick={() => toggleKudos(entryId)}
          disabled={isOwnEntry}
          aria-pressed={hasGivenKudos}
        >
          👏 {kudosFromAthleteIds.length} kudos
        </Chip>
        <Chip variant="outline" onClick={() => setCommentsOpen(true)}>
          💬 {commentsCount} comments
        </Chip>
      </div>

      <CommentsSheet
        entryId={entryId}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </Card>
  );
}
