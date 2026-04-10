"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DeckCanvas, DeckStatsPanel } from "@/components/decks/DeckPresentation";
import type { CardCatalogSummary } from "@/lib/cards/catalog";
import {
  buildDeckEntryFromCard,
  getDefaultDeckFormat,
  getDefaultRulesMode,
  getDeckFormatOptions,
  getDeckSections,
  inferDeckSection,
  normalizeDeckFormat,
  normalizeRulesMode,
  type DeckBuilderEntry,
  type DeckRulesModeValue,
  type DeckVisibilityValue,
} from "@/lib/decks/config";
import type { DeckDetail } from "@/lib/decks/query";
import { buildGamePath, type GameSlug } from "@/lib/games";

const PANEL =
  "rounded-3xl border border-white/15 bg-black/70 shadow-[0_0_35px_rgba(0,0,0,0.78)]";

type DeckBuilderDraft = {
  deckId: number | null;
  name: string;
  description: string;
  visibility: DeckVisibilityValue;
  formatKey: string;
  rulesMode: DeckRulesModeValue;
  entries: DeckBuilderEntry[];
  pendingSave: boolean;
  updatedAt: string;
};

type DeckBuilderAppProps = {
  game: GameSlug;
  authEnabled: boolean;
  userId: string | null;
  initialDeck: DeckDetail | null;
};

function buildDraftKey(game: GameSlug, deckId: number | null) {
  return `nexusarchive:deck-draft:${game}:${deckId ?? "new"}`;
}

function buildDefaultDeckName(game: GameSlug) {
  if (game === "one-piece") {
    return "New One Piece Deck";
  }

  if (game === "magic-the-gathering") {
    return "New Magic Deck";
  }

  return "New Riftbound Deck";
}

function buildDraftFromInitialDeck(
  game: GameSlug,
  initialDeck: DeckDetail | null,
): DeckBuilderDraft {
  if (initialDeck) {
    return {
      deckId: initialDeck.id,
      name: initialDeck.name,
      description: initialDeck.description ?? "",
      visibility: initialDeck.visibility,
      formatKey: initialDeck.formatKey,
      rulesMode: initialDeck.rulesMode,
      entries: initialDeck.entries,
      pendingSave: false,
      updatedAt: initialDeck.updatedAt,
    };
  }

  const formatKey = getDefaultDeckFormat(game);
  return {
    deckId: null,
    name: buildDefaultDeckName(game),
    description: "",
    visibility: "PUBLIC",
    formatKey,
    rulesMode: getDefaultRulesMode(game),
    entries: [],
    pendingSave: false,
    updatedAt: new Date().toISOString(),
  };
}

function safelyReadDraft(game: GameSlug, deckId: number | null) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(buildDraftKey(game, deckId));
    return raw ? (JSON.parse(raw) as DeckBuilderDraft) : null;
  } catch {
    return null;
  }
}

function safelyWriteDraft(game: GameSlug, deckId: number | null, draft: DeckBuilderDraft) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(buildDraftKey(game, deckId), JSON.stringify(draft));
}

function safelyRemoveDraft(game: GameSlug, deckId: number | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(buildDraftKey(game, deckId));
}

function buildSavePayload(game: GameSlug, draft: DeckBuilderDraft) {
  return {
    game,
    name: draft.name,
    description: draft.description || null,
    visibility: draft.visibility,
    formatKey: draft.formatKey,
    rulesMode: draft.rulesMode,
    entries: draft.entries,
  };
}

function getSaveMessage(visibility: DeckVisibilityValue) {
  return visibility === "PRIVATE"
    ? "Deck saved privately. It will stay in My Decks and out of the community pile."
    : "Deck saved. It now lives in My Decks and the community deck list pool.";
}

function remapEntriesForFormat(
  game: GameSlug,
  formatKey: string,
  entries: DeckBuilderEntry[],
) {
  const allowedSections = new Set(
    getDeckSections(game, formatKey).map((section) => section.key),
  );
  const nextEntries: DeckBuilderEntry[] = [];

  for (const entry of entries) {
    const suggestedSection = allowedSections.has(entry.sectionKey)
      ? entry.sectionKey
      : inferDeckSection(
          game,
          formatKey,
          {
            name: entry.cardName,
            type: entry.typeLine ?? null,
            domains: entry.domainValues,
            familyKey: entry.familyKey,
          },
          nextEntries,
        );

    nextEntries.push({
      ...entry,
      sectionKey: suggestedSection,
      sortOrder: nextEntries.length,
    });
  }

  return nextEntries;
}

export function DeckBuilderApp({
  game,
  authEnabled,
  userId,
  initialDeck,
}: DeckBuilderAppProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(() =>
    buildDraftFromInitialDeck(game, initialDeck),
  );
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const deferredSearchText = useDeferredValue(searchText);
  const [searchResults, setSearchResults] = useState<CardCatalogSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasHydratedRef = useRef(false);
  const draftRef = useRef(draft);
  const autoSaveTriggeredRef = useRef(false);

  const draftKey = useMemo(
    () => buildDraftKey(game, draft.deckId),
    [draft.deckId, game],
  );

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const baseDraft = buildDraftFromInitialDeck(game, initialDeck);
    const storedDraft = safelyReadDraft(game, baseDraft.deckId);
    const nextDraft =
      storedDraft && (!initialDeck || storedDraft.deckId === initialDeck.id)
        ? storedDraft
        : baseDraft;

    hasHydratedRef.current = true;
    setDraft(nextDraft);
  }, [game, initialDeck]);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      return;
    }

    safelyWriteDraft(game, draft.deckId, draft);
  }, [draft, draftKey, game]);

  useEffect(() => {
    const controller = new AbortController();
    const query = deferredSearchText.trim();

    async function loadCards() {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams({
          game,
          q: query,
          page: "1",
          pageSize: "18",
          sort: query ? "name-asc" : "cost-asc",
          versionMode: "base",
        });
        const response = await fetch(`/api/cards?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load builder cards.");
        }

        const payload = (await response.json()) as {
          cards?: CardCatalogSummary[];
        };
        setSearchResults(payload.cards ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchResults([]);
          setSearchError(
            error instanceof Error
              ? error.message
              : "Failed to load builder cards.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }

    void loadCards();

    return () => controller.abort();
  }, [deferredSearchText, game]);

  const sections = useMemo(
    () => getDeckSections(game, draft.formatKey),
    [draft.formatKey, game],
  );
  const formatOptions = useMemo(() => getDeckFormatOptions(game), [game]);
  const rulesOptions = useMemo(() => {
    const format = formatOptions.find((option) => option.key === draft.formatKey);
    return format?.rulesModes ?? [draft.rulesMode];
  }, [draft.formatKey, draft.rulesMode, formatOptions]);

  const persistPendingSaveAndRedirect = useCallback((currentDraft: DeckBuilderDraft) => {
    const nextDraft = {
      ...currentDraft,
      pendingSave: true,
      updatedAt: new Date().toISOString(),
    };
    safelyWriteDraft(game, currentDraft.deckId, nextDraft);
    setDraft(nextDraft);

    const currentUrl = window.location.pathname + window.location.search;
    router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
  }, [game, router]);

  function updateDraft(mutator: (current: DeckBuilderDraft) => DeckBuilderDraft) {
    setDraft((current) => {
      const next = mutator(current);
      return {
        ...next,
        updatedAt: new Date().toISOString(),
      };
    });
    setSaveMessage(null);
    setSaveError(null);
  }

  function addCard(card: CardCatalogSummary) {
    updateDraft((current) => {
      const existingIndex = current.entries.findIndex(
        (entry) => entry.familyKey === card.familyKey,
      );

      if (existingIndex >= 0) {
        return {
          ...current,
          entries: current.entries.map((entry, index) =>
            index === existingIndex
              ? { ...entry, quantity: Math.min(entry.quantity + 1, 99) }
              : entry,
          ),
        };
      }

      const sectionKey = inferDeckSection(
        game,
        current.formatKey,
        {
          name: card.name,
          type: card.type,
          domains: card.domains,
          familyKey: card.familyKey,
        },
        current.entries,
      );

      return {
        ...current,
        entries: [
          ...current.entries,
          buildDeckEntryFromCard(
            {
              game,
              id: card.id,
              name: card.name,
              type: card.type,
              text: card.text,
              domains: card.domains,
              energyCost: card.energyCost,
              power: card.power,
              might: card.might,
              hp: card.hp,
              setCode: card.setCode,
              setName: card.setName,
              rarity: card.rarity,
              imageUrl: card.imageUrl,
              versionLabel: card.versionLabel,
              familyKey: card.familyKey,
            },
            sectionKey,
            current.entries.length,
          ),
        ],
      };
    });
  }

  function incrementCard(familyKey: string) {
    updateDraft((current) => ({
      ...current,
      entries: current.entries.map((entry) =>
        entry.familyKey === familyKey
          ? { ...entry, quantity: Math.min(entry.quantity + 1, 99) }
          : entry,
      ),
    }));
  }

  function decrementCard(familyKey: string) {
    updateDraft((current) => ({
      ...current,
      entries: current.entries
        .map((entry) =>
          entry.familyKey === familyKey
            ? { ...entry, quantity: entry.quantity - 1 }
            : entry,
        )
        .filter((entry) => entry.quantity > 0),
    }));
  }

  function removeCard(familyKey: string) {
    updateDraft((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.familyKey !== familyKey),
    }));
  }

  function moveCard(familyKey: string, sectionKey: string) {
    updateDraft((current) => ({
      ...current,
      entries: current.entries.map((entry) =>
        entry.familyKey === familyKey ? { ...entry, sectionKey } : entry,
      ),
    }));
  }

  const handleSave = useCallback(async (isAutoSave = false) => {
    const currentDraft = draftRef.current;

    if (!authEnabled) {
      setSaveError(
        "Auth is not configured in this environment yet, so save is still sleeping.",
      );
      return;
    }

    if (!userId) {
      persistPendingSaveAndRedirect(currentDraft);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(
        currentDraft.deckId ? `/api/decks/${currentDraft.deckId}` : "/api/decks",
        {
          method: currentDraft.deckId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildSavePayload(game, currentDraft)),
        },
      );

      const payload = (await response.json()) as DeckDetail | { error?: string };
      if (!response.ok || !("id" in payload)) {
        throw new Error(
          ("error" in payload && payload.error) || "Failed to save deck.",
        );
      }

      const savedDeck = payload as DeckDetail;
      const nextDraft = buildDraftFromInitialDeck(game, savedDeck);
      safelyRemoveDraft(game, currentDraft.deckId);
      safelyWriteDraft(game, savedDeck.id, nextDraft);
      setDraft(nextDraft);
      setSaveMessage(getSaveMessage(savedDeck.visibility));
      setDetailsOpen(false);
      autoSaveTriggeredRef.current = false;

      const nextHref = buildGamePath(game, `deckbuilder/${savedDeck.id}`);
      if (window.location.pathname !== nextHref) {
        router.replace(nextHref);
      }

      if (isAutoSave) {
        setSaveMessage(
          savedDeck.visibility === "PRIVATE"
            ? "Signed in, draft restored, and the deck was saved privately."
            : "Signed in, draft restored, and the deck was saved to the community pile.",
        );
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save deck.",
      );
      autoSaveTriggeredRef.current = false;
    } finally {
      setIsSaving(false);
      setDraft((current) => ({ ...current, pendingSave: false }));
    }
  }, [authEnabled, game, persistPendingSaveAndRedirect, router, userId]);

  useEffect(() => {
    if (!userId || !draft.pendingSave || autoSaveTriggeredRef.current) {
      return;
    }

    autoSaveTriggeredRef.current = true;
    void handleSave(true);
  }, [draft.pendingSave, handleSave, userId]);

  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-[1440px] px-4">
        <section className={`${PANEL} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-200/80">
                {game === "magic-the-gathering"
                  ? "Spell Workbench"
                  : game === "one-piece"
                    ? "Crew Workshop"
                    : "Rift Workshop"}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-amber-50 sm:text-3xl">
                Build immediately. Save only when you care.
              </h1>
              <p className="mt-2 text-sm text-amber-50/75">
                Open the builder, start stacking cardboard into real columns, and
                only bother signing in once you want the archive to remember the
                list.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={buildGamePath(game, "decklists")}
                className="rounded-full border border-white/15 bg-black/55 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10"
              >
                View deck lists
              </Link>
              <button
                type="button"
                onClick={() => void handleSave(false)}
                disabled={isSaving}
                className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(0,0,0,0.45)] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : draft.deckId ? "Save updates" : "Save deck"}
              </button>
              <button
                type="button"
                onClick={() => setDetailsOpen((current) => !current)}
                className="rounded-full border border-white/15 bg-black/55 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10"
              >
                {detailsOpen ? "Hide deck details" : "Deck details"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_180px_180px]">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/75">
                  Deck Name
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-white/15 bg-black/55 px-4 py-3 text-sm text-amber-50 outline-none ring-0 placeholder:text-amber-50/35"
                    placeholder="Name your pile of cardboard"
                  />
                </label>

                <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/75">
                  Format
                  <select
                    value={draft.formatKey}
                    onChange={(event) => {
                      const formatKey = normalizeDeckFormat(game, event.target.value);
                      updateDraft((current) => ({
                        ...current,
                        formatKey,
                        rulesMode: normalizeRulesMode(
                          game,
                          formatKey,
                          current.rulesMode,
                        ),
                        entries: remapEntriesForFormat(
                          game,
                          formatKey,
                          current.entries,
                        ),
                      }));
                    }}
                    className="mt-2 w-full rounded-2xl border border-white/15 bg-black/55 px-4 py-3 text-sm text-amber-50"
                  >
                    {formatOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/75">
                  Rules Mode
                  <select
                    value={draft.rulesMode}
                    onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        rulesMode: normalizeRulesMode(
                          game,
                          current.formatKey,
                          event.target.value,
                        ),
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-white/15 bg-black/55 px-4 py-3 text-sm text-amber-50"
                  >
                    {rulesOptions.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode === "HOUSE"
                          ? "House Rules"
                          : mode === "COMPETITIVE"
                            ? "Competitive"
                            : "Standard Rules"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/70">
                      Add Cards
                    </div>
                    <p className="mt-1 text-sm text-amber-50/65">
                      Search the live grouped card pool and drop cards straight into the right column.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-xs text-amber-100/70">
                    {sections.length} sections live
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    className="w-full rounded-2xl border border-white/15 bg-black/55 px-4 py-3 text-sm text-amber-50 outline-none placeholder:text-amber-50/35"
                    placeholder={
                      game === "magic-the-gathering"
                        ? 'Search cards, mechanics, or archetype glue...'
                        : game === "one-piece"
                          ? 'Search leaders, characters, events, or stages...'
                          : 'Search legends, units, battlefields, or runes...'
                    }
                  />
                  <div className="rounded-2xl border border-white/10 bg-black/55 px-3 py-3 text-xs text-amber-100/70">
                    {searchLoading
                      ? "Loading cards..."
                      : `${searchResults.length} grouped cards ready`}
                  </div>
                </div>

                {searchError ? (
                  <div className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                    {searchError}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {searchResults.map((card) => {
                    const suggestedSection = inferDeckSection(
                      game,
                      draft.formatKey,
                      {
                        name: card.name,
                        type: card.type,
                        domains: card.domains,
                        familyKey: card.familyKey,
                      },
                      draft.entries,
                    );

                    return (
                      <button
                        key={card.familyKey ?? card.id}
                        type="button"
                        onClick={() => addCard(card)}
                        className="rounded-2xl border border-white/10 bg-black/55 p-3 text-left transition hover:border-amber-300/30 hover:bg-black/75"
                      >
                        <div className="flex gap-3">
                          <div className="relative h-28 w-20 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                            {card.imageUrl ? (
                              <Image
                                src={card.imageUrl}
                                alt={card.name}
                                fill
                                sizes="80px"
                                className="object-contain"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-amber-50">
                              {card.name}
                            </div>
                            <div className="mt-1 text-xs text-amber-50/60">
                              {card.type ?? "Card"}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-amber-100/70">
                              {card.energyCost != null ? (
                                <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-1">
                                  Cost {card.energyCost}
                                </span>
                              ) : null}
                              {card.domains.slice(0, 2).map((domain) => (
                                <span
                                  key={domain}
                                  className="rounded-full border border-white/10 bg-white/5 px-2 py-1"
                                >
                                  {domain}
                                </span>
                              ))}
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                              <span className="text-amber-200/80">
                                To {sections.find((section) => section.key === suggestedSection)?.shortLabel}
                              </span>
                              <span className="rounded-full bg-amber-400 px-2.5 py-1 font-semibold text-slate-950">
                                Add
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {detailsOpen ? (
                <section className={`${PANEL} p-4 sm:p-5`}>
                  <div className="mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
                      Deck Details
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-amber-50">
                      Publish settings and notes
                    </h2>
                    <p className="mt-1 text-sm text-amber-50/65">
                      Public is the default. Flip the private box if you want this one to stay out of community deck lists.
                    </p>
                  </div>

                  <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/75">
                    Description
                    <textarea
                      value={draft.description}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={4}
                      className="mt-2 w-full rounded-2xl border border-white/15 bg-black/55 px-4 py-3 text-sm text-amber-50 outline-none placeholder:text-amber-50/35"
                      placeholder="Optional deck notes, matchup plan, or your cardboard manifesto."
                    />
                  </label>

                  <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-amber-50/80">
                    <input
                      type="checkbox"
                      checked={draft.visibility === "PRIVATE"}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          visibility: event.target.checked ? "PRIVATE" : "PUBLIC",
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-black/60"
                    />
                    <span>
                      <span className="block font-semibold text-amber-100">Private deck</span>
                      Keep this save in My Decks only. Leave unchecked to send it into the public community pool.
                    </span>
                  </label>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-amber-50/70">
                    {userId
                      ? "You are signed in, so saves land immediately."
                      : authEnabled
                        ? "You can build freely while signed out. Hitting Save will route you through account auth and bring the draft back."
                        : "Auth is not configured here yet, so save stays disabled until the Clerk keys wake up."}
                  </div>
                </section>
              ) : null}

              {(saveMessage || saveError) ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    saveError
                      ? "border-rose-300/20 bg-rose-500/10 text-rose-100"
                      : "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
                  }`}
                >
                  {saveError ?? saveMessage}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-6">
          <DeckCanvas
            game={game}
            formatKey={draft.formatKey}
            entries={draft.entries}
            editable
            onIncrement={incrementCard}
            onDecrement={decrementCard}
            onRemove={removeCard}
            onSectionChange={moveCard}
          />

          <DeckStatsPanel
            game={game}
            formatKey={draft.formatKey}
            rulesMode={draft.rulesMode}
            entries={draft.entries}
          />
        </div>
      </div>
    </main>
  );
}
