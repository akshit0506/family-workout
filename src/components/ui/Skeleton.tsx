type SkeletonProps = {
  className?: string;
};

/** A single pulsing placeholder block, styled to match the card/paper theme. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-ink/10 ${className}`} />;
}
