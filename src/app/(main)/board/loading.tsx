import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BoardLoading() {
  return (
    <>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-16 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className="mt-5 flex items-end justify-center gap-3">
        <Skeleton className="h-20 w-16 rounded-lg" />
        <Skeleton className="h-28 w-16 rounded-lg" />
        <Skeleton className="h-16 w-16 rounded-lg" />
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((index) => (
          <Card key={index} padding="sm" className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 flex-1" />
            <Skeleton className="h-3 w-14" />
          </Card>
        ))}
      </div>
    </>
  );
}
