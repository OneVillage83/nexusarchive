"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  ComboBrowseResponse,
  ComboResultSummary,
} from "@/lib/combos/types";
import {
  buildDeckEntryFromCard,
  getDefaultDeckFormat,
  getDefaultRulesMode,
  inferDeckSection,
  type DeckVisibilityValue,
} from "@/lib/decks/config";
import { buildGamePath, type GameSlug } from "@/lib/games";

import { LABEL, ResultCard, SURFACE } from "./ComboUi";

type ComboLibraryResultsPageProps = {
  game: GameSlug;
};

function parseFilterList(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeFilterList(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .join(",");
}

function toggleString(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

export function ComboLibraryResultsPage({
  game,
}: ComboLibraryResultsPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const q = (searchParams.get("q") ?? "").trim();
  const selectedSlug = (searchParams.get("selected") ?? "").trim();
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );
  const includeCardsParam = searchParams.get("includeCards");
  const excludeCardsParam = searchParams.get("excludeCards");
  const tagsParam = searchParams.get("tags");
  const formatTagsParam = searchParams.get("formatTags");
  const includeCards = useMemo(
    () => parseFilterList(includeCardsParam),
    [includeCardsParam],
  );
  const excludeCards = useMemo(
    () => parseFilterList(excludeCardsParam),
    [excludeCardsParam],
  );
  const selectedTags = useMemo(() => parseFilterList(tagsParam), [tagsParam]);
  const selectedFormats = useMemo(
    () => parseFilterList(formatTagsParam),
    [formatTagsParam],
  );
  const completeOnly = searchParams.get("completeOnly") === "1";

  const [searchDraft, setSearchDraft] = useState(q);
  const [includeDraft, setIncludeDraft] = useState(includeCards.join(", "));
  const [excludeDraft, setExcludeDraft] = useState(excludeCards.join(", "));
  const [tagDraft, setTagDraft] = useState(selectedTags);
  const [formatDraft, setFormatDraft] = useState(selectedFormats);
  const [completeOnlyDraft, setCompleteOnlyDraft] = useState(completeOnly);
  const [comboData, setComboData] = useState<ComboBrowseResponse | null>(null);
  const [comboLoading, setComboLoading] = useState(false);
  const [comboError, setComboError] = useState<string | null>(null);

  useEffect(() => {
    setSearchDraft(q);
    setIncludeDraft(includeCards.join(", "));
    setExcludeDraft(excludeCards.join(", "));
    setTagDraft(selectedTags);
    setFormatDraft(selectedFormats);
    setCompleteOnlyDraft(completeOnly);
  }, [
    q,
    includeCards,
    excludeCards,
    selectedTags,
    selectedFormats,
    completeOnly,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCombos() {
      setComboLoading(true);
      setComboError(null);

      try {
        const params = new URLSearchParams(searchParamsKey);
        params.set("game", game);
        const response = await fetch(`/api/combos?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load combo library.");
        }

        setComboData((await response.json()) as ComboBrowseResponse);
      } catch (error) {
        if (!controller.signal.aborted) {
          setComboError(
            error instanceof Error
              ? error.message
              : "Failed to load combo library.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setComboLoading(false);
        }
      }
    }

    void loadCombos();
    return () => controller.abort();
  }, [game, searchParamsKey]);

  const selectedCombo = useMemo(
    () =>
      (comboData?.results ?? []).find((combo) => combo.slug === selectedSlug) ??
      null,
    [comboData?.results, selectedSlug],
  );

  const currentPage = comboData?.page ?? page;
  const workspacePath = buildGamePath(game, "combos");

  function updateSearchParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParamsKey);
    mutate(params);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function applyFilters(event?: FormEvent) {
    event?.preventDefault();
    updateSearchParams((params) => {
      params.delete("page");
      params.delete("selected");

      if (searchDraft.trim()) params.set("q", searchDraft.trim());
      else params.delete("q");

      const includeValue = serializeFilterList(includeDraft.split(","));
      if (includeValue) params.set("includeCards", includeValue);
      else params.delete("includeCards");

      const excludeValue = serializeFilterList(excludeDraft.split(","));
      if (excludeValue) params.set("excludeCards", excludeValue);
      else params.delete("excludeCards");

      const tagValue = serializeFilterList(tagDraft);
      if (tagValue) params.set("tags", tagValue);
      else params.delete("tags");

      const formatValue = serializeFilterList(formatDraft);
      if (formatValue) params.set("formatTags", formatValue);
      else params.delete("formatTags");

      if (completeOnlyDraft) params.set("completeOnly", "1");
      else params.delete("completeOnly");
    });
  }

  function clearFilters() {
    setSearchDraft("");
    setIncludeDraft("");
    setExcludeDraft("");
    setTagDraft([]);
    setFormatDraft([]);
    setCompleteOnlyDraft(false);
    updateSearchParams((params) => {
      [
        "q",
        "includeCards",
        "excludeCards",
        "tags",
        "formatTags",
        "completeOnly",
        "page",
        "selected",
      ].forEach((key) => params.delete(key));
    });
  }

  function selectCombo(slug: string) {
    updateSearchParams((params) => {
      params.set("selected", slug);
    });
  }

  function loadIntoDeckBuilder(combo: ComboResultSummary) {
    if (typeof window === "undefined") return;

    const formatKey = getDefaultDeckFormat(game);
    const pieces = combo.pieces.filter((piece) => piece.role !== "template");
    const entries = [];

    for (const piece of pieces) {
      const sectionKey = inferDeckSection(
        game,
        formatKey,
        {
          name: piece.cardName,
          type: piece.typeLine,
          domains: piece.domains,
          familyKey: piece.familyKey,
        },
        entries,
      );

      entries.push(
        buildDeckEntryFromCard(
          {
            game,
            id: piece.cardId ?? piece.familyKey,
            name: piece.cardName,
            type: piece.typeLine,
            text: piece.text,
            domains: piece.domains,
            energyCost: piece.energyCost,
            power: piece.power,
            might: piece.might,
            hp: piece.hp,
            setCode: null,
            setName: null,
            rarity: null,
            imageUrl: piece.imageUrl,
            versionLabel: null,
            familyKey: piece.familyKey,
          },
          sectionKey,
          entries.length,
        ),
      );
    }

    const draft = {
      deckId: null,
      name: `${combo.name} shell`,
      description: combo.summary ?? combo.resultText ?? "",
      visibility: "PUBLIC" as DeckVisibilityValue,
      formatKey,
      rulesMode: getDefaultRulesMode(game),
      entries,
      pendingSave: false,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      `nexusarchive:deck-draft:${game}:new`,
      JSON.stringify(draft),
    );
    router.push(buildGamePath(game, "deckbuilder"));
  }

  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4">
        <section className={`${SURFACE} px-5 py-5 sm:px-8 sm:py-7`}>
          <div className="inline-flex rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
            Combo Library
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-amber-50 sm:text-4xl">
            Search Results
          </h1>
          <p className="mt-3 max-w-4xl text-sm text-amber-100/78 sm:text-base">
            Browse curated combo lines on their own page, then hop back into the
            workspace when you want to compare them against a real deck.
          </p>
          <form onSubmit={applyFilters} className="mt-6 flex flex-wrap gap-3">
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search by combo name, card name, outcome, or tag..."
              className="h-12 min-w-[260px] flex-1 rounded-2xl border border-white/12 bg-black/45 px-4 text-sm text-amber-50 outline-none placeholder:text-amber-50/35"
            />
            <button
              type="submit"
              className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300"
            >
              Search
            </button>
            <Link
              href={workspacePath}
              prefetch={false}
              className="inline-flex items-center justify-center rounded-full border border-white/12 bg-black/45 px-5 py-3 text-sm font-semibold text-amber-50 hover:bg-white/10"
            >
              Back to Workspace
            </Link>
          </form>
        </section>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <section className={`${SURFACE} p-4 sm:p-5`}>
              <div className="mb-4">
                <div className={LABEL}>Advanced Search</div>
                <h2 className="mt-2 text-lg font-semibold text-amber-50">
                  Tighten the library query
                </h2>
              </div>
              <form onSubmit={applyFilters} className="space-y-4">
                <label className="block">
                  <div className={LABEL}>Include Cards</div>
                  <input
                    value={includeDraft}
                    onChange={(event) => setIncludeDraft(event.target.value)}
                    placeholder="Sol Ring, Nami"
                    className="mt-2 w-full rounded-2xl border border-white/12 bg-black/45 px-4 py-3 text-sm text-amber-50 outline-none placeholder:text-amber-50/35"
                  />
                </label>
                <label className="block">
                  <div className={LABEL}>Exclude Cards</div>
                  <input
                    value={excludeDraft}
                    onChange={(event) => setExcludeDraft(event.target.value)}
                    placeholder="Cards you do not want"
                    className="mt-2 w-full rounded-2xl border border-white/12 bg-black/45 px-4 py-3 text-sm text-amber-50 outline-none placeholder:text-amber-50/35"
                  />
                </label>
                <div>
                  <div className={LABEL}>Tags</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(comboData?.filterOptions.tags ?? []).slice(0, 14).map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setTagDraft((current) => toggleString(current, tag))
                          }
                          className={`rounded-full border px-3 py-1 text-[11px] ${
                            tagDraft.includes(tag)
                              ? "border-amber-300/80 bg-amber-400/90 text-slate-950"
                              : "border-white/12 bg-black/45 text-amber-50/85"
                          }`}
                        >
                          {tag}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <div>
                  <div className={LABEL}>Formats</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(comboData?.filterOptions.formatTags ?? []).slice(0, 14).map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setFormatDraft((current) =>
                              toggleString(current, tag),
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-[11px] ${
                            formatDraft.includes(tag)
                              ? "border-sky-300/80 bg-sky-400/90 text-slate-950"
                              : "border-white/12 bg-black/45 text-amber-50/85"
                          }`}
                        >
                          {tag}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-amber-50/80">
                  <input
                    type="checkbox"
                    checked={completeOnlyDraft}
                    onChange={(event) =>
                      setCompleteOnlyDraft(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-black/60"
                  />
                  <span>
                    <span className="block font-semibold text-amber-100">
                      Complete combos only
                    </span>
                    Hide unfinished or placeholder records.
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300"
                  >
                    Apply filters
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full border border-white/12 bg-black/55 px-4 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </section>
          </aside>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3 px-1">
              <div>
                <div className={LABEL}>Combo Library</div>
                <div className="mt-1 text-sm text-amber-100/72">
                  {comboLoading
                    ? "Loading combo library..."
                    : comboError ??
                      `Showing ${comboData?.results.length ?? 0} of ${
                        comboData?.total ?? 0
                      } curated combos`}
                </div>
              </div>
              {comboData ? (
                <div className="rounded-full border border-white/12 bg-black/45 px-3 py-2 text-xs text-amber-100/72">
                  Page {comboData.page} of {Math.max(comboData.totalPages, 1)}
                </div>
              ) : null}
            </div>

            {comboError ? (
              <div className={`${SURFACE} p-5 text-sm text-rose-100`}>
                {comboError}
              </div>
            ) : (
              <div className="space-y-3">
                {(comboData?.results ?? []).map((combo) => (
                  <ResultCard
                    key={combo.slug}
                    combo={combo}
                    selected={selectedSlug === combo.slug}
                    onSelect={selectCombo}
                    onLoad={loadIntoDeckBuilder}
                  />
                ))}
                {!comboLoading && (comboData?.results.length ?? 0) === 0 ? (
                  <div className={`${SURFACE} p-5 text-sm text-amber-100/72`}>
                    No curated combos matched the current filters.
                  </div>
                ) : null}
              </div>
            )}

            {comboData && comboData.totalPages > 1 ? (
              <div className="flex items-center justify-between gap-3 text-xs text-amber-100/72">
                {currentPage > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateSearchParams((params) => {
                        params.set("page", String(currentPage - 1));
                        params.delete("selected");
                      })
                    }
                    className="rounded-full border border-white/12 bg-black/55 px-4 py-2 hover:bg-white/10"
                  >
                    Previous
                  </button>
                ) : (
                  <span className="rounded-full border border-white/10 px-4 py-2 text-amber-100/35">
                    Previous
                  </span>
                )}
                {currentPage < comboData.totalPages ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateSearchParams((params) => {
                        params.set("page", String(currentPage + 1));
                        params.delete("selected");
                      })
                    }
                    className="rounded-full border border-white/12 bg-black/55 px-4 py-2 hover:bg-white/10"
                  >
                    Next
                  </button>
                ) : (
                  <span className="rounded-full border border-white/10 px-4 py-2 text-amber-100/35">
                    Next
                  </span>
                )}
              </div>
            ) : null}
          </section>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <section className={`${SURFACE} p-4 sm:p-5`}>
              <div className={LABEL}>Selected Combo</div>
              {selectedCombo ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="text-lg font-semibold text-amber-50">
                      {selectedCombo.name}
                    </div>
                    <p className="mt-2 text-sm text-amber-100/75">
                      {selectedCombo.summary ??
                        selectedCombo.resultText ??
                        "No detail selected."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadIntoDeckBuilder(selectedCombo)}
                    className="rounded-full border border-white/12 bg-black/55 px-4 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10"
                  >
                    Open in Deck Builder
                  </button>
                </div>
              ) : (
                <div className="mt-3 text-sm text-amber-100/65">
                  Pick a combo card to pin its details here.
                </div>
              )}
            </section>

            <section className={`${SURFACE} p-4 sm:p-5`}>
              <div className={LABEL}>Workspace</div>
              <p className="mt-3 text-sm text-amber-100/72">
                Need to compare a combo against pasted lists, saved decks, or
                dragged cards? Head back to the workspace and use the deck lab.
              </p>
              <Link
                href={workspacePath}
                prefetch={false}
                className="mt-4 inline-flex rounded-full border border-white/12 bg-black/55 px-4 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10"
              >
                Open combo workspace
              </Link>
            </section>
          </aside>
        </div>

        <div className="pt-1">
          <Link
            href={workspacePath}
            prefetch={false}
            className="text-xs font-medium text-amber-200 hover:text-white"
          >
            ← Back to combo workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
