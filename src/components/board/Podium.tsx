import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { INTERACTIVE_CLASSES } from "@/lib/interactive";

type PodiumEntry = {
  athleteId: string;
  name: string;
  workoutDays: number;
};

type PodiumProps = {
  entries: PodiumEntry[];
};

type Variant = {
  place: number;
  sphereGradient: string;
  pedestalGradient: string;
  sphereSize: string;
  pedestalHeight: string;
  showCrown: boolean;
};

const VARIANTS: Variant[] = [
  {
    place: 1,
    sphereGradient: "from-[#f5da7a] via-[#e6b93f] to-[#a97a1c]",
    pedestalGradient: "from-[#f0cf6a] to-[#c99a2f]",
    sphereSize: "h-20 w-20 text-2xl",
    pedestalHeight: "h-36",
    showCrown: true,
  },
  {
    place: 2,
    sphereGradient: "from-[#eef0f2] via-[#c3c7cd] to-[#8b909a]",
    pedestalGradient: "from-[#dfe2e6] to-[#a7acb4]",
    sphereSize: "h-16 w-16 text-lg",
    pedestalHeight: "h-28",
    showCrown: false,
  },
  {
    place: 3,
    sphereGradient: "from-[#e3b287] via-[#c07f4a] to-[#7c4d24]",
    pedestalGradient: "from-[#d99a66] to-[#9c6636]",
    sphereSize: "h-16 w-16 text-lg",
    pedestalHeight: "h-28",
    showCrown: false,
  },
];

// Display order left-to-right is 2nd / 1st / 3rd, matching the reference layout.
const DISPLAY_ORDER = [1, 0, 2];

export function Podium({ entries }: PodiumProps) {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-end justify-center gap-3">
        {DISPLAY_ORDER.map((entryIndex) => {
          const entry = entries[entryIndex];
          const variant = VARIANTS[entryIndex];
          if (!entry) return null;

          return (
            <Link
              key={entry.athleteId}
              href={`/profile/${entry.athleteId}`}
              className={`flex flex-1 flex-col items-center gap-2 rounded-lg hover:opacity-90 ${INTERACTIVE_CLASSES}`}
            >
              <div className="relative flex flex-col items-center gap-1">
                {variant.showCrown && (
                  <span className="absolute -top-5 text-lg" aria-hidden>
                    👑
                  </span>
                )}
                <div
                  className={`flex items-center justify-center rounded-full bg-gradient-to-br font-bold text-card shadow-md ${variant.sphereGradient} ${variant.sphereSize}`}
                >
                  {entry.workoutDays}
                </div>
                <Eyebrow>Days</Eyebrow>
              </div>
              <div
                className={`flex w-full flex-col items-center justify-center gap-1 rounded-t-lg bg-gradient-to-b px-2 pt-3 ${variant.pedestalGradient} ${variant.pedestalHeight}`}
              >
                <span className="text-3xl font-bold text-ink/80">{variant.place}</span>
                <span className="text-center text-xs font-bold uppercase tracking-wide text-ink/80">
                  {entry.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="h-1 w-full rounded-full bg-ink" />
    </div>
  );
}
