"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { buildGamePath, type GameSlug } from "@/lib/games";

type FinanceProductBackButtonProps = {
  game: GameSlug;
  fromGallery?: boolean;
};

export function FinanceProductBackButton({
  game,
  fromGallery = false,
}: FinanceProductBackButtonProps) {
  const router = useRouter();
  const financeHubHref = buildGamePath(game, "finance");

  if (!fromGallery) {
    return (
      <Link
        href={financeHubHref}
        prefetch={false}
        className="inline-flex rounded-full border border-white/20 px-3 py-1.5 text-xs text-amber-100 hover:bg-white/5"
      >
        ← Back to finance hub
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }

        router.push(financeHubHref);
      }}
      className="inline-flex rounded-full border border-white/20 px-3 py-1.5 text-xs text-amber-100 hover:bg-white/5"
    >
      ← Back to card search
    </button>
  );
}
