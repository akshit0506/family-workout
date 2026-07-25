type NumberTileProps = {
  value: number;
  size?: "sm" | "md";
};

const SIZE_CLASSES: Record<NonNullable<NumberTileProps["size"]>, string> = {
  sm: "h-8 w-7 text-base",
  md: "h-11 w-9 text-xl",
};

export function NumberTile({ value, size = "md" }: NumberTileProps) {
  const digits = Math.max(0, Math.trunc(value)).toString().padStart(2, "0").split("");

  return (
    <div className="flex gap-1">
      {digits.map((digit, index) => (
        <span
          key={index}
          className={`flex items-center justify-center rounded-md bg-ink font-bold text-paper ${SIZE_CLASSES[size]}`}
        >
          {digit}
        </span>
      ))}
    </div>
  );
}
