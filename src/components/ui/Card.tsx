import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md";
  emphasis?: boolean;
};

const PADDING_CLASSES: Record<NonNullable<CardProps["padding"]>, string> = {
  sm: "p-4",
  md: "p-5",
};

export function Card({
  children,
  className = "",
  padding = "md",
  emphasis = false,
}: CardProps) {
  const borderClasses = emphasis ? "border-2 border-ink/20" : "border border-ink/10";

  return (
    <div
      className={`rounded-xl ${borderClasses} bg-card ${PADDING_CLASSES[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
