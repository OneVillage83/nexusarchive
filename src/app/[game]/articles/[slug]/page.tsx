import Link from "next/link";

import { buildGamePath, getGameBySlug } from "@/lib/games";
import { requireGame } from "@/lib/server-game";

type GameArticlePageProps = {
  params: Promise<{ game: string; slug: string }>;
};

export default async function GameArticlePage({
  params,
}: GameArticlePageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const game = await requireGame(Promise.resolve({ game: resolvedParams.game }));
  const config = getGameBySlug(game);
  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  if (!config) {
    return null;
  }

  return (
    <main className="py-10">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <div className="inline-flex items-center rounded-full border border-white/20 bg-black/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
          {config.shortName} article stub
        </div>

        <h1 className="text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
          {title}
        </h1>

        <div className="rounded-3xl border border-white/15 bg-black/60 p-6 shadow-[0_0_28px_rgba(0,0,0,0.7)]">
          <p className="text-sm text-slate-300">
            This article route exists so the new game-scoped content tree is
            complete. The detailed write-up for <strong>{title}</strong> has not
            been written yet, but the room is reserved and the dramatic title card
            already made it on stage.
          </p>

          <p className="mt-4 text-sm text-slate-300">
            For now, head back to the {config.shortName} article index, or keep
            wandering the archive like someone who definitely intended to open
            twelve tabs.
          </p>
        </div>

        <Link
          href={buildGamePath(game, "articles")}
          prefetch={false}
          className="inline-flex text-sm font-medium text-amber-200 hover:text-white"
        >
          ← Back to {config.shortName} articles
        </Link>
      </div>
    </main>
  );
}
