"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
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
const FILTER_BUTTON =
  "rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs text-amber-50 shadow-[0_0_12px_rgba(0,0,0,0.55)] transition hover:bg-white/10";
const CHIP =
  "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors";
const PAGE_SIZE = 50;
const VIEW_MODES = ["table", "cards", "visual"] as const;

type ViewMode = (typeof VIEW_MODES)[number];

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

function parseMultiValueParam(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isViewMode(value: string | null): value is ViewMode {
  return VIEW_MODES.includes((value ?? "") as ViewMode);
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" }),
  );
}

function createPageHref(
  pathname: string,
  searchParams: ReadonlyURLSearchParams,
  page: number,
) {
  const params = new URLSearchParams(searchParams.toString());

  if (page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function formatCardStats(card: CardCatalogSummary) {
  if (card.power == null && card.might == null && card.hp == null) {
    return "No combat stats";
  }

  return `${card.power ?? "-"} / ${card.might ?? "-"} / ${card.hp ?? "-"}`;
}

function CardNameLink({ card }: { card: CardCatalogSummary }) {
  return card.externalUrl ? (
    <a
      href={card.externalUrl}
      target="_blank"
      rel="noreferrer"
      className="hover:text-amber-200"
    >
      {card.name}
    </a>
  ) : (
    <>{card.name}</>
  );
}

function CardArt({
  card,
  className,
}: {
  card: CardCatalogSummary;
  className: string;
}) {
  if (!card.imageUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-950/70 px-4 text-center text-xs text-amber-100/60`}>
        No image yet
      </div>
    );
  }

  return (
    <div
      aria-label={card.name}
      className={className}
      style={{
        backgroundImage: `url("${card.imageUrl}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    />
  );
}

export default function CardGalleryPage({ game }: CardsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );
  const config = getGameBySlug(game);
  const selectedDomains = parseMultiValueParam(searchParams.get("domains"));
  const selectedRarities = parseMultiValueParam(searchParams.get("rarities"));
  const selectedSets = parseMultiValueParam(searchParams.get("sets"));
  const rawView = searchParams.get("view");
  const viewMode: ViewMode = isViewMode(rawView) ? rawView : "visual";

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
        setError(err instanceof Error ? err.message : "Failed to load cards.");
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
  const availableDomains = uniqueSorted(cards.flatMap((card) => card.domains));
  const availableRarities = uniqueSorted(
    cards
      .map((card) => card.rarity)
      .filter((value): value is string => Boolean(value)),
  );
  const availableSets = uniqueSorted(
    cards
      .map((card) => card.setName ?? card.setCode)
      .filter((value): value is string => Boolean(value)),
  ).slice(0, 12);
  const filteredCards = cards.filter((card) => {
    if (
      selectedDomains.length > 0 &&
      !selectedDomains.some((value) => card.domains.includes(value))
    ) {
      return false;
    }

    if (
      selectedRarities.length > 0 &&
      !selectedRarities.includes(card.rarity ?? "")
    ) {
      return false;
    }

    const setValue = card.setName ?? card.setCode ?? "";
    if (selectedSets.length > 0 && !selectedSets.includes(setValue)) {
      return false;
    }

    return true;
  });
  const activeFilterCount =
    selectedDomains.length + selectedRarities.length + selectedSets.length;

  function updateSearchParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function toggleMultiFilter(
    key: "domains" | "rarities" | "sets",
    value: string,
  ) {
    updateSearchParams((params) => {
      const next = new Set(parseMultiValueParam(params.get(key)));
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      if (next.size > 0) {
        params.set(key, [...next].join(","));
      } else {
        params.delete(key);
      }
    });
  }

  function clearFilters() {
    updateSearchParams((params) => {
      params.delete("domains");
      params.delete("rarities");
      params.delete("sets");
    });
  }

  function setViewMode(nextView: ViewMode) {
    updateSearchParams((params) => {
      if (nextView === "visual") {
        params.delete("view");
      } else {
        params.set("view", nextView);
      }
    });
  }

  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <header className="mb-4 space-y-1">
            <h1 className="text-2xl font-semibold text-amber-50 sm:text-3xl">
              {config?.shortName ?? "Card"} Card Gallery
            </h1>
            <p className="max-w-2xl text-sm text-amber-50/80">
              {getGameBodyCopy(game)}
            </p>
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

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-amber-100/70">
              {q ? `Search query: "${q}" · ` : ""}Showing {startIndex}-{endIndex} of{" "}
              {total} card{total === 1 ? "" : "s"}
              {loading ? " · Loading..." : ""}
              {error ? ` · ${error}` : ""}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <details className="group relative">
                <summary className={`${FILTER_BUTTON} list-none cursor-pointer`}>
                  Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </summary>

                <div className="absolute right-0 z-20 mt-2 w-[min(92vw,24rem)] rounded-2xl border border-white/20 bg-black/90 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.88)] backdrop-blur-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                      Quick Filters
                    </div>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[11px] text-amber-100/70 hover:text-white"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <div className={LABEL}>{getGameLabel(game)}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {availableDomains.length ? (
                          availableDomains.map((value) => {
                            const active = selectedDomains.includes(value);
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => toggleMultiFilter("domains", value)}
                                className={`${CHIP} ${
                                  active
                                    ? "border-amber-300/80 bg-amber-400/90 text-slate-950"
                                    : "border-white/20 bg-white/[0.05] text-amber-50 hover:bg-white/[0.1]"
                                }`}
                              >
                                {value}
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-xs text-amber-100/60">
                            No quick color/domain values on this page yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className={LABEL}>Rarity</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {availableRarities.length ? (
                          availableRarities.map((value) => {
                            const active = selectedRarities.includes(value);
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => toggleMultiFilter("rarities", value)}
                                className={`${CHIP} ${
                                  active
                                    ? "border-amber-300/80 bg-amber-400/90 text-slate-950"
                                    : "border-white/20 bg-white/[0.05] text-amber-50 hover:bg-white/[0.1]"
                                }`}
                              >
                                {value}
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-xs text-amber-100/60">
                            No rarity values on this page yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className={LABEL}>Set</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {availableSets.length ? (
                          availableSets.map((value) => {
                            const active = selectedSets.includes(value);
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => toggleMultiFilter("sets", value)}
                                className={`${CHIP} ${
                                  active
                                    ? "border-amber-300/80 bg-amber-400/90 text-slate-950"
                                    : "border-white/20 bg-white/[0.05] text-amber-50 hover:bg-white/[0.1]"
                                }`}
                              >
                                {value}
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-xs text-amber-100/60">
                            No set values on this page yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </details>

              <div className="inline-flex items-center rounded-full border border-white/20 bg-black/55 p-1 shadow-[0_0_12px_rgba(0,0,0,0.55)]">
                {VIEW_MODES.map((mode) => {
                  const active = viewMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors ${
                        active
                          ? "bg-amber-400 text-slate-950"
                          : "text-amber-50/85 hover:bg-white/10"
                      }`}
                    >
                      {mode === "table"
                        ? "Table"
                        : mode === "cards"
                          ? "Cards"
                          : "Visual"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mb-3 text-[11px] text-amber-100/70">
            Quick filters show {filteredCards.length} of {cards.length} card
            {cards.length === 1 ? "" : "s"} on this page.
          </div>

          {viewMode === "table" ? (
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-black/60">
              <div className="border-b border-white/15 px-4 py-2 text-[11px] uppercase tracking-wide text-amber-100/70">
                {filteredCards.length} visible card
                {filteredCards.length === 1 ? "" : "s"}
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
                    {filteredCards.map((card) => (
                      <tr
                        key={card.id}
                        className="border-t border-white/10 hover:bg-white/5"
                      >
                        <td className="px-4 py-2 align-top">
                          <div className="font-medium text-amber-50">
                            <CardNameLink card={card} />
                          </div>
                          {card.text ? (
                            <div className="line-clamp-2 text-xs text-amber-100/75">
                              {card.text}
                            </div>
                          ) : null}
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

                    {!loading && filteredCards.length === 0 && !error ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-sm text-amber-100/65"
                        >
                          No cards match the current filters on this page.
                        </td>
                      </tr>
                    ) : null}

                    {error ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-sm text-red-300/90"
                        >
                          {error}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCards.map((card) => (
                <article
                  key={card.id}
                  className="overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-[0_0_22px_rgba(0,0,0,0.65)]"
                >
                  <div className="grid gap-4 p-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                    <CardArt
                      card={card}
                      className="aspect-[3/4] rounded-xl border border-white/10"
                    />

                    <div className="min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold text-amber-50">
                            <CardNameLink card={card} />
                          </h2>
                          <p className="text-sm text-amber-100/75">
                            {card.type ?? "No type label"}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-wide text-amber-200/85">
                          {card.rarity ?? "Unknown rarity"}
                        </span>
                      </div>

                      {card.domains.length ? (
                        <div className="flex flex-wrap gap-2">
                          {card.domains.map((domain) => (
                            <button
                              key={`${card.id}-${domain}`}
                              type="button"
                              onClick={() => toggleMultiFilter("domains", domain)}
                              className={`${CHIP} ${
                                selectedDomains.includes(domain)
                                  ? "border-amber-300/80 bg-amber-400/90 text-slate-950"
                                  : "border-white/20 bg-white/[0.05] text-amber-50 hover:bg-white/[0.1]"
                              }`}
                            >
                              {domain}
                            </button>
                          ))}
                        </div>
                      ) : null}

                      <div className="grid gap-2 text-xs text-amber-100/75 sm:grid-cols-2">
                        <div>Cost: {card.energyCost ?? "—"}</div>
                        <div>Stats: {formatCardStats(card)}</div>
                        <div>Set: {card.setName ?? card.setCode ?? "—"}</div>
                        <div>Artist: {card.artist ?? "—"}</div>
                      </div>

                      {card.text ? (
                        <p className="line-clamp-4 text-sm text-amber-50/85">
                          {card.text}
                        </p>
                      ) : (
                        <p className="text-sm text-amber-100/60">
                          No rules text on this card.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}

              {!loading && filteredCards.length === 0 && !error ? (
                <div className="rounded-2xl border border-white/15 bg-black/55 px-4 py-6 text-center text-sm text-amber-100/65 md:col-span-2 xl:col-span-3">
                  No cards match the current filters on this page.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCards.map((card) => (
                <article
                  key={card.id}
                  className="overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-[0_0_22px_rgba(0,0,0,0.62)]"
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    <CardArt card={card} className="aspect-[3/4]" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/65 to-transparent p-3">
                      <div className="text-sm font-semibold text-amber-50">
                        <CardNameLink card={card} />
                      </div>
                      <div className="mt-1 text-[11px] text-amber-100/80">
                        {card.type ?? "No type"} · {card.setCode ?? card.setName ?? "No set"}
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {!loading && filteredCards.length === 0 && !error ? (
                <div className="rounded-2xl border border-white/15 bg-black/55 px-4 py-6 text-center text-sm text-amber-100/65 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                  No cards match the current filters on this page.
                </div>
              ) : null}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-amber-100/80">
            <div>
              Page {page} of {Math.max(totalPages, 1)}
            </div>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={createPageHref(pathname, searchParams, page - 1)}
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
                  href={createPageHref(pathname, searchParams, page + 1)}
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
