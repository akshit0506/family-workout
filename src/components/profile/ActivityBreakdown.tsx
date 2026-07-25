import { Card } from "@/components/ui/Card";
import type { ActivityBreakdownItem } from "@/lib/types";

type ActivityBreakdownProps = {
  items: ActivityBreakdownItem[];
};

export function ActivityBreakdown({ items }: ActivityBreakdownProps) {
  return (
    <Card className="divide-y divide-hairline" padding="sm">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 py-3">
          <span className="w-24 shrink-0 font-bold text-ink">{item.label}</span>

          <div className="h-2 flex-1 rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-success"
              style={{ width: `${item.percent}%` }}
            />
          </div>

          <span className="w-6 shrink-0 text-right font-bold text-ink">{item.count}</span>
          <span className="w-9 shrink-0 text-right text-xs text-muted">{`${item.percent}%`}</span>
        </div>
      ))}
    </Card>
  );
}
