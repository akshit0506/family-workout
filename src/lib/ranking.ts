export function computeCompetitionRanks<T extends { workoutDays: number }>(
  rows: T[]
): (T & { rank: number })[] {
  const sorted = [...rows].sort((a, b) => b.workoutDays - a.workoutDays);
  let rank = 0;
  let lastValue: number | null = null;
  let position = 0;

  return sorted.map((row) => {
    position += 1;
    if (row.workoutDays !== lastValue) {
      rank = position;
      lastValue = row.workoutDays;
    }
    return { ...row, rank };
  });
}
