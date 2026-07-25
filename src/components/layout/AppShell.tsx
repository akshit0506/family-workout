import type { ReactNode } from "react";
import { Masthead } from "@/components/layout/Masthead";
import { NavBar } from "@/components/layout/NavBar";
import { PersistentAction } from "@/components/layout/PersistentAction";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col">
      <Masthead />
      <main className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 pb-4 pt-5 sm:px-6">
        {children}
      </main>
      <PersistentAction />
      <NavBar />
    </div>
  );
}
