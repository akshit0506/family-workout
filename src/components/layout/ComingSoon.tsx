import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";

type ComingSoonProps = {
  title: string;
};

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <Card className="flex flex-col items-center gap-2 py-12 text-center">
      <Eyebrow color="rust">{title}</Eyebrow>
      <p className="text-sm text-muted">
        This screen is coming in a later milestone.
      </p>
    </Card>
  );
}
