"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppState } from "@/components/providers/AppStateProvider";
import { INTERACTIVE_CLASSES } from "@/lib/interactive";

export function NavBar() {
  const pathname = usePathname();
  const { currentUser } = useAppState();

  const navItems = [
    { href: "/", label: "Home", isActive: pathname === "/" },
    { href: "/board", label: "Board", isActive: pathname === "/board" },
    {
      href: `/profile/${currentUser.id}`,
      label: "Profile",
      isActive: pathname.startsWith("/profile"),
    },
  ];

  return (
    <nav
      className="sticky bottom-0 z-10 border-t border-hairline bg-paper"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`rounded-md border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${INTERACTIVE_CLASSES} ${
                item.isActive
                  ? "border-rust text-rust"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
