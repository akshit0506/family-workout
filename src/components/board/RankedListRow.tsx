import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NumberTile } from "@/components/ui/NumberTile";
import { INTERACTIVE_CLASSES } from "@/lib/interactive";

type RankedListRowProps = {
  athleteId: string;
  rank: number;
  name: string;
  isCurrentUser: boolean;
  workoutDays: number;
  recentCountLabel?: string;
  streakLabel?: string;
};

export function RankedListRow({
  athleteId,
  rank,
  name,
  isCurrentUser,
  workoutDays,
  recentCountLabel,
  streakLabel,
}: RankedListRowProps) {
  const noteText = streakLabel ?? recentCountLabel;

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <Link
        href={`/profile/${athleteId}`}
        className={`flex items-center gap-3 rounded-md hover:opacity-70 ${INTERACTIVE_CLASSES}`}
      >
        <span className="w-5 text-right text-sm font-bold text-rust">
          {rank.toString().padStart(2, "0")}
        </span>
        <Avatar name={name} size="sm" accent={isCurrentUser} />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-ink">{name}</p>
            {isCurrentUser && <Chip variant="filled">You</Chip>}
          </div>
          {noteText && (
            <Eyebrow color="olive">{streakLabel ? `🔥 ${noteText}` : noteText}</Eyebrow>
          )}
        </div>
      </Link>
      <NumberTile value={workoutDays} size="sm" />
    </div>
  );
}
