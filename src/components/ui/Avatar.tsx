type AvatarProps = {
  name: string;
  size?: "sm" | "md";
  accent?: boolean;
  className?: string;
};

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
};

export function Avatar({ name, size = "md", accent = false, className = "" }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase();
  const ringColor = accent ? "border-rust text-rust" : "border-ink/20 text-ink";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border-2 font-bold ${ringColor} ${SIZE_CLASSES[size]} ${className}`}
    >
      {initial}
    </div>
  );
}
