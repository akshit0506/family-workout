type ActivitySparklineProps = {
  values: number[];
};

export function ActivitySparkline({ values }: ActivitySparklineProps) {
  return (
    <div className="flex h-14 items-end gap-1">
      {values.map((value, index) => {
        const isToday = index === values.length - 1;

        return (
          <span
            key={index}
            aria-hidden
            className={`w-full flex-1 rounded-sm ${
              value ? "bg-success" : "bg-hairline"
            } ${isToday ? "ring-2 ring-ink ring-offset-1 ring-offset-paper" : ""}`}
            style={{ height: value ? "100%" : "30%" }}
          />
        );
      })}
    </div>
  );
}
