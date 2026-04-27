import Link from "next/link";

import { DeckCanvas, DeckStatsPanel } from "@/components/decks/DeckPresentation";
import type { DeckDetail } from "@/lib/decks/query";
import { buildGamePath, type GameSlug } from "@/lib/games";

const PANEL =
  "rounded-3xl border border-white/15 bg-black/70 shadow-[0_0_35px_rgba(0,0,0,0.78)]";

export function DeckDetailPage({
  game,
  deck,
}: {
  game: GameSlug;
  deck: DeckDetail;
}) {
  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[1440px] px-4">
        <section className={`${PANEL} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-200/80">
                {deck.visibility === "PRIVATE" ? "Private Deck" : "Community Deck"}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-amber-50 sm:text-3xl">
                {deck.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-amber-100/75">
                <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5">
                  {deck.authorLabel}
                </span>
                <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5">
                  {deck.formatKey}
                </span>
                <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5">
                  {deck.totalCards} cards
                </span>
              </div>
              {deck.description ? (
                <p className="mt-4 text-sm text-amber-50/75">{deck.description}</p>
              ) : (
                <p className="mt-4 text-sm text-amber-50/55">
                  No description yet. The deck is doing its talking with cardboard.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={buildGamePath(game, "decklists")}
                className="rounded-full border border-white/15 bg-black/55 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10"
              >
                Back to deck lists
              </Link>
              {deck.canEdit ? (
                <Link
                  href={buildGamePath(game, `deckbuilder/${deck.id}`)}
                  className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(0,0,0,0.45)] transition hover:bg-amber-300"
                >
                  Edit deck
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-6">
          <DeckCanvas
            game={game}
            formatKey={deck.formatKey}
            entries={deck.entries}
          />

          <DeckStatsPanel
            game={game}
            formatKey={deck.formatKey}
            rulesMode={deck.rulesMode}
            entries={deck.entries}
          />
        </div>
      </div>
    </main>
  );
}
