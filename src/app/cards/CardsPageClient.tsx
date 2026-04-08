"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type {
  CardCatalogMeta,
  CardCatalogSummary,
} from "@/lib/cards/catalog";
import { buildGamePath, getGameBySlug, type GameSlug } from "@/lib/games";

const PANEL =
  "rounded-3xl border border-white/25 bg-black/75 shadow-[0_0_45px_rgba(0,0,0,0.98)] px-5 py-5 sm:px-8 sm:py-7";
const LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-amber-100/80";
const INPUT =
  "h-10 flex-1 rounded-md border border-white/25 bg-black/60 px-3 text-sm text-amber-50 placeholder:text-amber-200/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/80";
const PAGE_SIZE = 50;

type CardsPageClientProps = {
  game: GameSlug;
};

type CardsResponse = {
  cards: CardCatalogSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  meta: CardCatalogMeta;
};

function getGameBodyCopy(game: GameSlug) {
  switch (game) {
    case "magic-the-gathering":
      return "Browse imported Magic cards from Scryfall. Search by name, oracle text, set, artist, or whatever other cardboard chaos your brain is chasing.";
    case "one-piece":
      return "Browse imported One Piece cards from OPTCG API. Search leaders, events, traits, and other pirate-adjacent troublemakers without needing to sign in first.";
    case "riftbound":
    default:
      return "Browse Riftbound cards and filter by name or rules text. This gallery now runs on the RiftCodex API with a small official-gallery token backfill so the card pool stays complete.";
  }
}

function getGameLabel(game: GameSlug) {
  switch (game) {
    case "riftbound":
      return "Domains";
    case "magic-the-gathering":
    case "one-piece":
    default:
      return "Colors";
  }
}

function getGameNote(game: GameSlug) {
  switch (game) {
    case "magic-the-gathering":
      return "This gallery is now running on imported Scryfall bulk data. Redis handles the fast search layer while the raw upstream dump gets archived separately, because paying hot-storage rates for every byte would be wildly unserious.";
    case "one-piece":
      return "This gallery is now running on OPTCG API imports. The search index is live, the raw snapshot gets archived separately, and the sign-in wall remains reserved for save-to-account features instead of basic browsing.";
    case "riftbound":
    default:
      return "Riftbound is now running through RiftCodex's structured API, with the official Riot gallery filling the handful of missing tokens so search results stay complete without going back to brittle HTML scraping.";
  }
}

function formatImportedAt(value: string | null) {
  if (!value) {
    return "Unknown import time";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function createPageHref(pathname: string, q: string, page: number) {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function CardGalleryPage({ game }: CardsPageClientProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );
  const config = getGameBySlug(game);

  const [cards, setCards] = useState<CardCatalogSummary[]>([]);
  const [meta, setMeta] = useState<CardCatalogMeta | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        query.set("game", game);
        query.set("page", String(page));
        query.set("pageSize", String(PAGE_SIZE));
        if (q) {
          query.set("q", q);
        }

        const response = await fetch(`/api/cards?${query.toString()}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as CardsResponse;
        setCards(data.cards ?? []);
        setMeta(data.meta ?? null);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
      } catch (err: unknown) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load cards.",
        );
        setCards([]);
        setMeta(null);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [game, page, q]);

  const startIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = total === 0 ? 0 : startIndex + cards.length - 1;
  const sourceLine = meta
    ? `${meta.sourceLabel} · Imported ${formatImportedAt(meta.importedAt)}`
    : null;

  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl px-4 space-y-6 sm:space-y-8">
        <section className={PANEL}>
          <header className="mb-4 space-y-1">
            <h1 className="text-2xl font-semibold text-amber-50 sm:text-3xl">
              {config?.shortName ?? "Card"} Card Gallery
            </h1>
            <p className="max-w-2xl text-sm text-amber-50/80">
              {getGameBodyCopy(game)}
            </p>
            {sourceLine && (
              <p className="text-xs text-amber-100/70">{sourceLine}</p>
            )}
          </header>

          <form method="GET" className="mb-2 flex max-w-md gap-2">
            <div className="flex-1">
              <label className={LABEL} htmlFor="card-search">
                Search cards
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="card-search"
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search by name, rules text, set, or any keyword..."
                  className={INPUT}
                />
                <button
                  type="submit"
                  className="h-10 rounded-full bg-amber-400/95 px-4 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(0,0,0,0.9)] hover:bg-amber-300"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          <div className="mb-3 text-[11px] text-amber-100/70">
            Search query: “{q || "(none)"}” · Showing {startIndex}-{endIndex} of{" "}
            {total} card{total === 1 ? "" : "s"}
            {loading ? " · Loading..." : ""}
            {error ? ` · ${error}` : ""}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/20 bg-black/60">
            <div className="border-b border-white/15 px-4 py-2 text-[11px] uppercase tracking-wide text-amber-100/70">
              {total} card{total === 1 ? "" : "s"} found
              {q ? ` for "${q}"` : ""}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-black/70 text-xs uppercase text-amber-100/70">
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">{getGameLabel(game)}</th>
                    <th className="px-4 py-2 text-left">Cost</th>
                    <th className="px-4 py-2 text-left">Stats</th>
                    <th className="px-4 py-2 text-left">Set</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr
                      key={card.id}
                      className="border-t border-white/10 hover:bg-white/5"
                    >
                      <td className="px-4 py-2 align-top">
                        <div className="font-medium text-amber-50">
                          {card.externalUrl ? (
                            <a
                              href={card.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-amber-200"
                            >
                              {card.name}
                            </a>
                          ) : (
                            card.name
                          )}
                        </div>
                        {card.text && (
                          <div className="line-clamp-2 text-xs text-amber-100/75">
                            {card.text}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 align-top text-amber-50/85">
                        {card.type ?? "—"}
                      </td>
                      <td className="px-4 py-2 align-top text-amber-50/85">
                        {card.domains.length ? card.domains.join(", ") : "—"}
                      </td>
                      <td className="px-4 py-2 align-top text-amber-50/85">
                        {card.energyCost ?? "—"}
                      </td>
                      <td className="px-4 py-2 align-top text-amber-50/85">
                        {card.power != null ||
                        card.might != null ||
                        card.hp != null
                          ? `${card.power ?? "-"} / ${card.might ?? "-"} / ${
                              card.hp ?? "-"
                            }`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 align-top text-amber-50/85">
                        {card.setName ?? card.setCode ?? "—"}
                      </td>
                    </tr>
                  ))}

                  {!loading && cards.length === 0 && !error && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-sm text-amber-100/65"
                      >
                        No cards found.
                      </td>
                    </tr>
                  )}

                  {error && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-sm text-red-300/90"
                      >
                        {error}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-amber-100/80">
            <div>
              Page {page} of {Math.max(totalPages, 1)}
            </div>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={createPageHref(pathname, q, page - 1)}
                  prefetch={false}
                  className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/5"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-full border border-white/10 px-3 py-1 text-amber-100/40">
                  Previous
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={createPageHref(pathname, q, page + 1)}
                  prefetch={false}
                  className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/5"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-full border border-white/10 px-3 py-1 text-amber-100/40">
                  Next
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="rift-flicker mt-1 rounded-xl border border-amber-300/30 bg-black/55 px-4 py-3 text-[12px] text-amber-100/85 shadow-[0_0_15px_rgba(0,0,0,0.6)]">
          <p>
            <span className="font-semibold text-amber-200">
              Developer Note:
            </span>{" "}
            {getGameNote(game)}
          </p>
        </div>

        {meta?.notes?.length ? (
          <section className="rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-xs text-amber-100/80">
            <div className="font-semibold text-amber-200">Import Notes</div>
            <ul className="mt-2 space-y-1">
              {meta.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="pt-1">
          <Link
            href={buildGamePath(game)}
            prefetch={false}
            className="text-xs font-medium text-amber-200 hover:text-white"
          >
            ← Back to {config?.shortName ?? "game"} home
          </Link>
        </div>
      </div>
    </main>
  );
}
