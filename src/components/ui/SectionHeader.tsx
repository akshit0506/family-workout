import { Eyebrow } from "@/components/ui/Eyebrow";

type SectionHeaderProps = {
  children: string;
  variant?: "eyebrow" | "heading";
  color?: "muted" | "rust" | "olive";
};

export function SectionHeader({
  children,
  variant = "eyebrow",
  color = "rust",
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      {variant === "eyebrow" ? (
        <Eyebrow color={color}>{children}</Eyebrow>
      ) : (
        <h2 className="whitespace-nowrap text-xl font-bold text-ink">{children}</h2>
      )}
      <div className="h-px flex-1 bg-hairline" />
    </div>
  );
}
