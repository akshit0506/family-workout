import { RankedListRow } from "@/components/board/RankedListRow";

type RankedListEntry = {
  athleteId: string;
  rank: number;
  name: string;
  isCurrentUser: boolean;
  workoutDays: number;
  recentCountLabel?: string;
  streakLabel?: string;
};

type RankedListProps = {
  entries: RankedListEntry[];
};

export function RankedList({ entries }: RankedListProps) {
  return (
    <div className="divide-y divide-hairline">
      {entries.map((entry) => (
        <RankedListRow
          key={entry.athleteId}
          athleteId={entry.athleteId}
          rank={entry.rank}
          name={entry.name}
          isCurrentUser={entry.isCurrentUser}
          workoutDays={entry.workoutDays}
          recentCountLabel={entry.recentCountLabel}
          streakLabel={entry.streakLabel}
        />
      ))}
    </div>
  );
}
