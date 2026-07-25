import Link from "next/link";
import { getAthletes, getCurrentUser } from "@/lib/data/athletes";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { APP_NAME } from "@/lib/config";
import { INTERACTIVE_CLASSES } from "@/lib/interactive";

export async function Masthead() {
  const [currentUser, athletes] = await Promise.all([
    getCurrentUser(),
    getAthletes(),
  ]);

  return (
    <header
      className="flex flex-col gap-1.5 px-4 sm:px-6"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1.25rem)" }}
    >
      <div className="flex items-start justify-between">
        <Eyebrow>{`Est. 2026 · ${athletes.length} athletes`}</Eyebrow>
        <Link
          href="/settings"
          aria-label="Settings"
          className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink/20 text-lg leading-none hover:bg-ink/5 ${INTERACTIVE_CLASSES}`}
        >
          ⚙️
        </Link>
      </div>
      <h1 className="font-display text-3xl uppercase leading-none tracking-tight text-ink sm:text-4xl">
        {APP_NAME}
      </h1>
      <p className="font-accent text-xl text-rust">{currentUser.name}&rsquo;s records</p>
    </header>
  );
}
