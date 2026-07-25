import type { ReactNode } from "react";
import { INTERACTIVE_CLASSES } from "@/lib/interactive";

type ChipProps = {
  children: ReactNode;
  variant?: "filled" | "outline";
  tone?: "ink" | "success";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  "aria-pressed"?: boolean;
};

export function Chip({
  children,
  variant = "filled",
  tone = "ink",
  className = "",
  onClick,
  disabled = false,
  ...rest
}: ChipProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide";

  const styles =
    variant === "filled"
      ? tone === "success"
        ? "border-success bg-success text-paper"
        : "border-ink bg-ink text-paper"
      : "border-hairline bg-transparent text-muted";

  if (!onClick) {
    return <span className={`${base} ${styles} ${className}`}>{children}</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${INTERACTIVE_CLASSES} ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-80"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
