"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DesktopNav() {
  const pathname = usePathname();

  // Hide on homepage — tiles handle navigation there
  if (pathname === "/") return null;

  const TOOL_LINKS = [
    { href: "/cards", label: "Card Gallery" },
    { href: "/deckbuilder", label: "Deck Builder" },
    { href: "/combos", label: "Synergy & Combo Finder" },
    { href: "/decklists", label: "Deck Lists" },
    { href: "/collection", label: "Collection" },
    { href: "/rules", label: "Game Rules" },
  ];

  return (
    <nav className="flex items-center gap-4 text-xs font-medium text-amber-50/90">
      {TOOL_LINKS.map((link) => {
        const isActive = pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              "transition-colors " +
              (isActive
                ? "text-amber-200 font-semibold"
                : "hover:text-amber-200")
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
