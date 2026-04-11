"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DeckCanvas } from "@/components/decks/DeckPresentation";
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

const SURFACE =
  "rounded-[28px] border border-white/10 bg-black/42 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-sm";

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
  if (game === "one-piece") return "New One Piece Deck";
  if (game === "magic-the-gathering") return "New Magic Deck";
  return "New Riftbound Deck";
}

function buildDraftFromInitialDeck(game: GameSlug, initialDeck: DeckDetail | null): DeckBuilderDraft {
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

  return {
    deckId: null,
    name: buildDefaultDeckName(game),
    description: "",
    visibility: "PUBLIC",
    formatKey: getDefaultDeckFormat(game),
    rulesMode: getDefaultRulesMode(game),
    entries: [],
    pendingSave: false,
    updatedAt: new Date().toISOString(),
  };
}

function safelyReadDraft(game: GameSlug, deckId: number | null) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(buildDraftKey(game, deckId));
    return raw ? (JSON.parse(raw) as DeckBuilderDraft) : null;
  } catch {
    return null;
  }
}

function safelyWriteDraft(game: GameSlug, deckId: number | null, draft: DeckBuilderDraft) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(buildDraftKey(game, deckId), JSON.stringify(draft));
  }
}

function safelyRemoveDraft(game: GameSlug, deckId: number | null) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(buildDraftKey(game, deckId));
  }
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

function remapEntriesForFormat(game: GameSlug, formatKey: string, entries: DeckBuilderEntry[]) {
  const allowedSections = new Set(getDeckSections(game, formatKey).map((section) => section.key));
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

    nextEntries.push({ ...entry, sectionKey: suggestedSection, sortOrder: nextEntries.length });
  }

  return nextEntries;
}

function DeckDetailsPanel({
  draft,
  setDescription,
  setVisibility,
  userId,
  authEnabled,
}: {
  draft: DeckBuilderDraft;
  setDescription: (value: string) => void;
  setVisibility: (value: DeckVisibilityValue) => void;
  userId: string | null;
  authEnabled: boolean;
}) {
  return (
    <section className={`${SURFACE} p-4 sm:p-5`}>
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">Deck Details</p>
        <h2 className="mt-2 text-xl font-semibold text-amber-50">Publish settings and notes</h2>
        <p className="mt-1 text-sm text-amber-50/65">Public is the default. Flip the private box if you want this one to stay out of community deck lists.</p>
      </div>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/75">
        Description
        <textarea
          value={draft.description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          className="mt-2 w-full rounded-2xl border border-white/15 bg-black/55 px-4 py-3 text-sm text-amber-50 outline-none placeholder:text-amber-50/35"
          placeholder="Optional deck notes, matchup plan, or your cardboard manifesto."
        />
      </label>
      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-amber-50/80">
        <input
          type="checkbox"
          checked={draft.visibility === "PRIVATE"}
          onChange={(event) => setVisibility(event.target.checked ? "PRIVATE" : "PUBLIC")}
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
  );
}

export function DeckBuilderApp({ game, authEnabled, userId, initialDeck }: DeckBuilderAppProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => buildDraftFromInitialDeck(game, initialDeck));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchPreviewCard, setSearchPreviewCard] = useState<CardCatalogSummary | null>(null);
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
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

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
    if (!hasHydratedRef.current) return;
    safelyWriteDraft(game, draft.deckId, draft);
  }, [draft, game]);

  useEffect(() => {
    const controller = new AbortController();
    const query = deferredSearchText.trim();

    async function loadCards() {
      if (!query) {
        setSearchResults([]);
        setSearchError(null);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams({
          game,
          q: query,
          page: "1",
          pageSize: "24",
          sort: "name-asc",
          versionMode: "premium",
        });
        const response = await fetch(`/api/cards?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Failed to load builder cards.");
        const payload = (await response.json()) as { cards?: CardCatalogSummary[] };
        setSearchResults(payload.cards ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchResults([]);
          setSearchError(error instanceof Error ? error.message : "Failed to load builder cards.");
        }
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }

    void loadCards();
    return () => controller.abort();
  }, [deferredSearchText, game]);

  const formatOptions = useMemo(() => getDeckFormatOptions(game), [game]);
  const rulesOptions = useMemo(() => {
    const format = formatOptions.find((option) => option.key === draft.formatKey);
    return format?.rulesModes ?? [draft.rulesMode];
  }, [draft.formatKey, draft.rulesMode, formatOptions]);
  const deckCardTotal = useMemo(() => draft.entries.reduce((sum, entry) => sum + entry.quantity, 0), [draft.entries]);

  const persistPendingSaveAndRedirect = useCallback((currentDraft: DeckBuilderDraft) => {
    const nextDraft = { ...currentDraft, pendingSave: true, updatedAt: new Date().toISOString() };
    safelyWriteDraft(game, currentDraft.deckId, nextDraft);
    setDraft(nextDraft);
    const currentUrl = window.location.pathname + window.location.search;
    router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
  }, [game, router]);

  function updateDraft(mutator: (current: DeckBuilderDraft) => DeckBuilderDraft) {
    setDraft((current) => ({ ...mutator(current), updatedAt: new Date().toISOString() }));
    setSaveMessage(null);
    setSaveError(null);
  }

  function addCard(card: CardCatalogSummary) {
    updateDraft((current) => {
      const existingIndex = current.entries.findIndex((entry) => entry.familyKey === card.familyKey);

      if (existingIndex >= 0) {
        return {
          ...current,
          entries: current.entries.map((entry, index) =>
            index === existingIndex ? { ...entry, quantity: Math.min(entry.quantity + 1, 99) } : entry,
          ),
        };
      }

      const sectionKey = inferDeckSection(
        game,
        current.formatKey,
        { name: card.name, type: card.type, domains: card.domains, familyKey: card.familyKey },
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
        entry.familyKey === familyKey ? { ...entry, quantity: Math.min(entry.quantity + 1, 99) } : entry,
      ),
    }));
  }

  function decrementCard(familyKey: string) {
    updateDraft((current) => ({
      ...current,
      entries: current.entries
        .map((entry) => (entry.familyKey === familyKey ? { ...entry, quantity: entry.quantity - 1 } : entry))
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
      entries: current.entries.map((entry) => (entry.familyKey === familyKey ? { ...entry, sectionKey } : entry)),
    }));
  }

  const handleSave = useCallback(async (isAutoSave = false) => {
    const currentDraft = draftRef.current;

    if (!authEnabled) {
      setSaveError("Auth is not configured in this environment yet, so save is still sleeping.");
      return;
    }

    if (!userId) {
      persistPendingSaveAndRedirect(currentDraft);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(currentDraft.deckId ? `/api/decks/${currentDraft.deckId}` : "/api/decks", {
        method: currentDraft.deckId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSavePayload(game, currentDraft)),
      });

      const payload = (await response.json()) as DeckDetail | { error?: string };
      if (!response.ok || !("id" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Failed to save deck.");
      }

      const savedDeck = payload as DeckDetail;
      const nextDraft = buildDraftFromInitialDeck(game, savedDeck);
      safelyRemoveDraft(game, currentDraft.deckId);
      safelyWriteDraft(game, savedDeck.id, nextDraft);
      setDraft(nextDraft);
      setSaveMessage(getSaveMessage(savedDeck.visibility));
      autoSaveTriggeredRef.current = false;

      const nextHref = buildGamePath(game, `deckbuilder/${savedDeck.id}`);
      if (window.location.pathname !== nextHref) router.replace(nextHref);

      if (isAutoSave) {
        setSaveMessage(
          savedDeck.visibility === "PRIVATE"
            ? "Signed in, draft restored, and the deck was saved privately."
            : "Signed in, draft restored, and the deck was saved to the community pile.",
        );
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save deck.");
      autoSaveTriggeredRef.current = false;
    } finally {
      setIsSaving(false);
      setDraft((current) => ({ ...current, pendingSave: false }));
    }
  }, [authEnabled, game, persistPendingSaveAndRedirect, router, userId]);

  useEffect(() => {
    if (!userId || !draft.pendingSave || autoSaveTriggeredRef.current) return;
    autoSaveTriggeredRef.current = true;
    void handleSave(true);
  }, [draft.pendingSave, handleSave, userId]);

  useEffect(() => {
    setSearchPreviewCard(searchResults[0] ?? null);
  }, [searchResults]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (searchContainerRef.current?.contains(target)) return;
      setSearchOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const showSearchDropdown = searchOpen && searchText.trim().length > 0;

  function clearSearch() {
    setSearchText("");
    setSearchResults([]);
    setSearchError(null);
    setSearchLoading(false);
    setSearchOpen(false);
    setSearchPreviewCard(null);
  }

  function addCardFromSearch(card: CardCatalogSummary) {
    addCard(card);
    clearSearch();
  }

  return (
    <>
      <main className="h-[calc(100vh-88px)] overflow-hidden px-3 py-4 sm:px-4 lg:px-6 xl:px-8">
        <div className="mx-auto flex h-full w-full max-w-[1880px] flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[260px] flex-[1.25] text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200/75">
              Deck Name
              <input
                value={draft.name}
                onChange={(event) => updateDraft((current) => ({ ...current, name: event.target.value }))}
                className="mt-2 h-12 w-full rounded-2xl border border-white/12 bg-black/40 px-4 text-sm text-amber-50 outline-none placeholder:text-amber-50/35"
                placeholder="Name your deck"
              />
            </label>

            <label className="min-w-[180px] text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200/75">
              Format
              <select
                value={draft.formatKey}
                onChange={(event) => {
                  const formatKey = normalizeDeckFormat(game, event.target.value);
                  updateDraft((current) => ({
                    ...current,
                    formatKey,
                    rulesMode: normalizeRulesMode(game, formatKey, current.rulesMode),
                    entries: remapEntriesForFormat(game, formatKey, current.entries),
                  }));
                }}
                className="mt-2 h-12 w-full rounded-2xl border border-white/12 bg-black/40 px-4 text-sm text-amber-50"
              >
                {formatOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-[180px] text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200/75">
              Rules Mode
              <select
                value={draft.rulesMode}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    rulesMode: normalizeRulesMode(game, current.formatKey, event.target.value),
                  }))
                }
                className="mt-2 h-12 w-full rounded-2xl border border-white/12 bg-black/40 px-4 text-sm text-amber-50"
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

            <div className="ml-auto flex flex-wrap items-center gap-2 pb-[1px]">
              <Link
                href={buildGamePath(game, "decklists")}
                className="rounded-full border border-white/15 bg-black/45 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10"
              >
                View deck lists
              </Link>
              <button
                type="button"
                onClick={() => setDetailsOpen((current) => !current)}
                className="rounded-full border border-white/15 bg-black/45 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10"
              >
                Deck details
              </button>
              <button
                type="button"
                onClick={() => void handleSave(false)}
                disabled={isSaving}
                className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_18px_rgba(0,0,0,0.3)] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : draft.deckId ? "Save updates" : "Save deck"}
              </button>
            </div>
          </div>

          {saveMessage || saveError ? (
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

          <div className="flex flex-wrap items-center gap-3">
            <div ref={searchContainerRef} className="relative min-w-[280px] max-w-[420px] flex-1">
              <input
                value={searchText}
                onChange={(event) => {
                  setSearchText(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => {
                  if (searchText.trim()) {
                    setSearchOpen(true);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && searchResults.length > 0) {
                    event.preventDefault();
                    addCardFromSearch(searchResults[0]);
                  }
                }}
                className="h-12 w-full rounded-2xl border border-white/12 bg-black/40 px-4 text-sm text-amber-50 outline-none placeholder:text-amber-50/35"
                placeholder="Add card by name..."
              />

              {showSearchDropdown ? (
                <>
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-white/12 bg-[#090909]/96 shadow-[0_18px_38px_rgba(0,0,0,0.45)] backdrop-blur-md md:right-auto md:w-[360px]">
                    {searchLoading ? (
                      <div className="px-4 py-3 text-sm text-amber-50/65">Searching...</div>
                    ) : searchError ? (
                      <div className="px-4 py-3 text-sm text-rose-100">{searchError}</div>
                    ) : searchResults.length > 0 ? (
                      <ul className="max-h-72 overflow-y-auto py-1">
                        {searchResults.slice(0, 10).map((card) => {
                          const isActive = (searchPreviewCard?.familyKey ?? searchPreviewCard?.id) === (card.familyKey ?? card.id);

                          return (
                            <li key={card.familyKey ?? card.id}>
                              <button
                                type="button"
                                onMouseEnter={() => setSearchPreviewCard(card)}
                                onFocus={() => setSearchPreviewCard(card)}
                                onClick={() => addCardFromSearch(card)}
                                className={`block w-full px-4 py-2.5 text-left text-sm transition ${
                                  isActive
                                    ? "bg-white/10 text-amber-50"
                                    : "text-amber-50 hover:bg-white/8"
                                }`}
                              >
                                {card.name}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="px-4 py-3 text-sm text-amber-50/55">No cards found.</div>
                    )}
                  </div>

                  {searchPreviewCard ? (
                    <div className="pointer-events-none absolute left-[calc(100%+12px)] top-[calc(100%+8px)] z-40 hidden w-[220px] rounded-[24px] border border-white/12 bg-[#090909]/96 p-3 shadow-[0_18px_38px_rgba(0,0,0,0.45)] backdrop-blur-md lg:block">
                      <div className="relative overflow-hidden rounded-[20px] border border-white/12 bg-black/50">
                        <div
                          className={`relative ${
                            ((searchPreviewCard.type ?? "").toLowerCase().includes("battlefield"))
                              ? "h-[132px]"
                              : "h-[300px]"
                          }`}
                        >
                          {searchPreviewCard.imageUrl ? (
                            <Image
                              src={searchPreviewCard.imageUrl}
                              alt={searchPreviewCard.name}
                              fill
                              unoptimized
                              sizes="220px"
                              className="object-contain"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-amber-50/45">
                              No preview art
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="rounded-full border border-white/12 bg-black/35 px-3 py-2 text-xs text-amber-100/72">
              {deckCardTotal} cards
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <DeckCanvas
              game={game}
              formatKey={draft.formatKey}
              entries={draft.entries}
              editable
              workspace
              showBoardHeader={false}
              showEmptySections={false}
              emptyMessage={null}
              onIncrement={incrementCard}
              onDecrement={decrementCard}
              onRemove={removeCard}
              onSectionChange={moveCard}
            />
          </div>
        </div>
      </main>

      {detailsOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
            onClick={() => setDetailsOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-y-auto rounded-t-[28px] border border-white/12 bg-[#090909]/96 p-4 shadow-[0_-18px_50px_rgba(0,0,0,0.55)] xl:inset-y-0 xl:right-0 xl:left-auto xl:max-h-none xl:w-[360px] xl:rounded-none xl:border-l xl:border-t-0 xl:p-5">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/20 xl:hidden" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
                  Deck Details
                </p>
                <p className="mt-1 text-sm text-amber-50/65">Publish settings and notes</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="rounded-full border border-white/15 bg-black/55 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <DeckDetailsPanel
              draft={draft}
              setDescription={(description) => updateDraft((current) => ({ ...current, description }))}
              setVisibility={(visibility) => updateDraft((current) => ({ ...current, visibility }))}
              userId={userId}
              authEnabled={authEnabled}
            />
          </div>
        </>
      ) : null}
    </>
  );
}
