import type { ButtonHTMLAttributes } from "react";
import { INTERACTIVE_CLASSES } from "@/lib/interactive";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline";
  fullWidth?: boolean;
};

export function Button({
  variant = "outline",
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg border-2 px-5 py-3 text-sm font-bold uppercase tracking-widest transition-colors";

  const styles =
    variant === "solid"
      ? "border-rust bg-rust text-card hover:bg-rust/90"
      : "border-ink/20 bg-card text-ink hover:bg-ink/5";

  const width = fullWidth ? "w-full" : "";
  const disabledStyles = disabled ? "cursor-not-allowed opacity-40" : "";

  return (
    <button
      className={`${base} ${styles} ${width} ${disabledStyles} ${INTERACTIVE_CLASSES} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
