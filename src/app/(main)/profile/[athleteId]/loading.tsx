import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <>
      <Card emphasis className="flex flex-col items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-16" />
        <div className="flex w-full justify-between gap-1 pt-1">
          {[0, 1, 2, 3, 4, 5, 6].map((index) => (
            <Skeleton key={index} className="h-8 w-8 rounded-full" />
          ))}
        </div>
      </Card>

      <Card className="mt-5 grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex flex-col items-center gap-1.5">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        ))}
      </Card>

      <div className="mt-5 flex items-center gap-3">
        <Skeleton className="h-4 w-24" />
        <div className="h-px flex-1 bg-hairline" />
      </div>
      <Skeleton className="mt-3 h-16 w-full" />

      <Skeleton className="mt-5 h-64 w-full" />

      <div className="mt-5 flex items-center gap-3">
        <Skeleton className="h-4 w-28" />
        <div className="h-px flex-1 bg-hairline" />
      </div>
      <Card className="mt-3 flex flex-col gap-2.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-full" />
      </Card>
    </>
  );
}
