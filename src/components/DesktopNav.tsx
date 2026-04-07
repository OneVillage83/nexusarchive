"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { GAME_TOOL_LINKS, GameSlug, buildGamePath } from "@/lib/games";

type DesktopNavProps = {
  game: GameSlug;
};

export function DesktopNav({ game }: DesktopNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4 text-xs font-medium text-amber-50/90">
      {GAME_TOOL_LINKS.map((link) => {
        const href = buildGamePath(game, link.href);
        const isActive = pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
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
