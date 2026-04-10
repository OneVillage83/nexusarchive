"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { DeckSummary } from "@/lib/decks/query";
import { buildGamePath, type GameSlug } from "@/lib/games";

const PANEL =
  "rounded-3xl border border-white/15 bg-black/70 shadow-[0_0_35px_rgba(0,0,0,0.78)]";

type DeckListsPageProps = {
  game: GameSlug;
  signedIn: boolean;
  communityDecks: DeckSummary[];
  myDecks: DeckSummary[];
};

export function DeckListsPage({
  game,
  signedIn,
  communityDecks,
  myDecks,
}: DeckListsPageProps) {
  const [tab, setTab] = useState<"community" | "mine">("community");
  const [searchText, setSearchText] = useState("");
  const query = searchText.trim().toLowerCase();

  const visibleDecks = useMemo(() => {
    const source = tab === "community" ? communityDecks : myDecks;
    if (!query) {
      return source;
    }

    return source.filter((deck) =>
      [deck.name, deck.description ?? "", deck.authorLabel, deck.formatKey]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [communityDecks, myDecks, query, tab]);

  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[1440px] px-4">
        <section className={`${PANEL} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-200/80">
                Deck Lists
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-amber-50 sm:text-3xl">
                Community brews and saved decks
              </h1>
              <p className="mt-2 text-sm text-amber-50/75">
                Public decks land in Community by default. Private saves stay in My Decks only.
              </p>
            </div>

            <Link
              href={buildGamePath(game, "deckbuilder")}
              className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(0,0,0,0.45)] transition hover:bg-amber-300"
            >
              Start a new deck
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-white/10 bg-black/55 p-1">
              <button
                type="button"
                onClick={() => setTab("community")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  tab === "community"
                    ? "bg-amber-400 text-slate-950"
                    : "text-amber-50/75 hover:bg-white/10"
                }`}
              >
                Community
              </button>
              <button
                type="button"
                onClick={() => setTab("mine")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  tab === "mine"
                    ? "bg-amber-400 text-slate-950"
                    : "text-amber-50/75 hover:bg-white/10"
                }`}
              >
                My Decks
              </button>
            </div>

            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="min-w-[260px] flex-1 rounded-2xl border border-white/15 bg-black/55 px-4 py-3 text-sm text-amber-50 placeholder:text-amber-50/35"
              placeholder="Search by deck name, format, or brewer..."
            />
          </div>
        </section>

        <section className="mt-6">
          {tab === "mine" && !signedIn ? (
            <div className={`${PANEL} p-5 text-sm text-amber-50/75`}>
              Sign in to see your saved decks. Community decks stay open to browse either way.
            </div>
          ) : visibleDecks.length === 0 ? (
            <div className={`${PANEL} p-5 text-sm text-amber-50/60`}>
              No decks are showing here yet. That usually means the pile is empty, private, or still waiting on its first brave brewer.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleDecks.map((deck) => (
                <article key={deck.id} className={`${PANEL} p-4`}>
                  <div className="flex gap-3">
                    <div className="relative h-28 w-20 overflow-hidden rounded-2xl border border-white/10 bg-black/45">
                      {deck.coverImageUrl ? (
                        <Image
                          src={deck.coverImageUrl}
                          alt={deck.name}
                          fill
                          sizes="80px"
                          className="object-contain"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-amber-50/45">
                          No cover art
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5 text-[10px] text-amber-100/70">
                        <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1">
                          {deck.formatKey}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1">
                          {deck.totalCards} cards
                        </span>
                        {deck.visibility === "PRIVATE" ? (
                          <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1">
                            Private
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-2 truncate text-lg font-semibold text-amber-50">
                        {deck.name}
                      </h2>
                      <p className="mt-1 text-sm text-amber-50/65">{deck.authorLabel}</p>
                      <p className="mt-2 line-clamp-3 text-sm text-amber-50/60">
                        {deck.description || "No description yet. The cardboard is doing the talking."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] text-amber-100/70">
                    {deck.sectionPreview.slice(0, 4).map((section) => (
                      <span
                        key={section.key}
                        className="rounded-full border border-white/10 bg-black/45 px-2 py-1"
                      >
                        {section.label}: {section.count}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={buildGamePath(game, `decklists/${deck.id}`)}
                      className="rounded-full border border-white/15 bg-black/55 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10"
                    >
                      View deck
                    </Link>
                    {deck.owner ? (
                      <Link
                        href={buildGamePath(game, `deckbuilder/${deck.id}`)}
                        className="rounded-full bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300"
                      >
                        Edit deck
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
