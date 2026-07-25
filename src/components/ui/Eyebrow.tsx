import type { ReactNode } from "react";

type EyebrowProps = {
  children: ReactNode;
  color?: "muted" | "rust" | "olive";
  className?: string;
};

const COLOR_CLASSES: Record<NonNullable<EyebrowProps["color"]>, string> = {
  muted: "text-muted",
  rust: "text-rust",
  olive: "text-olive",
};

export function Eyebrow({ children, color = "muted", className = "" }: EyebrowProps) {
  return (
    <span
      className={`text-xs font-bold uppercase tracking-widest ${COLOR_CLASSES[color]} ${className}`}
    >
      {children}
    </span>
  );
}
