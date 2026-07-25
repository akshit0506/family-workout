function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatEntryTimestamp(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameCalendarDay(date, now)) return `Today • ${time}`;
  if (isSameCalendarDay(date, yesterday)) return `Yesterday • ${time}`;

  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return `${dateLabel} • ${time}`;
}
