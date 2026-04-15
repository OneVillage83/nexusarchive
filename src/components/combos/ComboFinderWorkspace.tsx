"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  extractDraggedCardPayload,
  NEXUSARCHIVE_CARD_DRAG_MIME,
  readDraggedCardPayloadFromStorage,
} from "@/lib/cards/drag-payload";
import type {
  ComboAnalyzeRequest,
  ComboAnalyzeResponse,
  ComboBrowseResponse,
  ComboMatchBucket,
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

type ComboFinderWorkspaceProps = {
  game: GameSlug;
  authEnabled: boolean;
  userId: string | null;
};

type SavedDeckSummary = {
  id: number;
  name: string;
  formatKey: string;
  totalCards: number;
};

type ScratchCard = {
  familyKey: string;
  cardName: string;
  quantity: number;
  imageUrl: string | null;
  typeLine: string | null;
  text: string | null;
  domains: string[];
  energyCost: number | null;
  power: number | null;
  might: number | null;
  hp: number | null;
};

type DeckLabTab = "paste" | "saved" | "scratch";

const SURFACE =
  "rounded-[28px] border border-white/12 bg-black/45 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-sm";
const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/75";

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

function canAcceptDraggedCard(event: DragEvent<HTMLElement>) {
  const types = Array.from(event.dataTransfer.types ?? []);
  if (types.includes(NEXUSARCHIVE_CARD_DRAG_MIME)) {
    return true;
  }

  return Boolean(readDraggedCardPayloadFromStorage());
}

function CardArt({
  imageUrl,
  alt,
}: {
  imageUrl: string | null;
  alt: string;
}) {
  if (!imageUrl) {
    return (
      <div className="flex h-[84px] w-[60px] items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 text-[10px] text-amber-100/50">
        No art
      </div>
    );
  }

  return (
    <div
      aria-label={alt}
      className="h-[84px] w-[60px] rounded-xl border border-white/10 bg-black/50"
      style={{
        backgroundImage: `url("${imageUrl}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    />
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "owned" | "missing";
}) {
  const toneClass =
    tone === "owned"
      ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
      : tone === "missing"
        ? "border-rose-300/20 bg-rose-500/10 text-rose-100"
        : "border-white/12 bg-black/45 text-amber-50/80";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] ${toneClass}`}>
      {children}
    </span>
  );
}

function bucketLabel(bucket: ComboMatchBucket) {
  switch (bucket) {
    case "exactMatches":
      return "Already In Your Deck";
    case "nearMisses":
      return "Nearly There";
    case "synergySuggestions":
    default:
      return "Synergy Suggestions";
  }
}

function ResultCard({
  combo,
  selected,
  onSelect,
  onLoad,
}: {
  combo: ComboResultSummary;
  selected: boolean;
  onSelect: (slug: string) => void;
  onLoad: (combo: ComboResultSummary) => void;
}) {
  return (
    <article
      id={combo.slug}
      className={`rounded-[26px] border p-4 sm:p-5 ${
        selected
          ? "border-amber-300/45 bg-amber-400/10"
          : "border-white/12 bg-black/38"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={() => onSelect(combo.slug)} className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-amber-50">{combo.name}</h3>
            <Badge>{combo.kind}</Badge>
            <Badge>{combo.source}</Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-amber-100/78">
            {combo.summary ?? combo.resultText ?? "No summary logged yet."}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onLoad(combo)}
          className="rounded-full border border-white/12 bg-black/55 px-3 py-2 text-[11px] font-semibold text-amber-50 hover:bg-white/10"
        >
          Open in Deck Builder
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {combo.tags.map((tag) => (
          <Badge key={`${combo.slug}-${tag}`}>{tag}</Badge>
        ))}
        {combo.formatTags.map((tag) => (
          <Badge key={`${combo.slug}-${tag}`}>{tag}</Badge>
        ))}
      </div>

      {combo.match ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-3">
          <div className="text-sm text-amber-50/85">{combo.match.reason}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="owned">
              {combo.match.ownedCount}/{combo.match.totalCount} owned
            </Badge>
            {combo.match.missingPieces.length > 0 ? (
              <Badge tone="missing">{combo.match.missingPieces.length} missing</Badge>
            ) : null}
            {combo.match.ownedPieces.map((piece) => (
              <Badge key={`${combo.slug}-owned-${piece.familyKey}`} tone="owned">
                {piece.quantity}x {piece.cardName}
              </Badge>
            ))}
            {combo.match.missingPieces.map((piece) => (
              <Badge key={`${combo.slug}-missing-${piece.familyKey}`} tone="missing">
                {piece.quantity}x {piece.cardName}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-4">
            {combo.resultText ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className={LABEL}>Outcome</div>
                <p className="mt-2 text-sm text-amber-50/82">{combo.resultText}</p>
              </div>
            ) : null}
            {combo.steps.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className={LABEL}>How It Works</div>
                <ol className="mt-3 space-y-2 text-sm text-amber-50/82">
                  {combo.steps.map((step, index) => (
                    <li key={`${combo.slug}-step-${index}`}>{index + 1}. {step}</li>
                  ))}
                </ol>
              </div>
            ) : null}
            {combo.prerequisites.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className={LABEL}>Prerequisites</div>
                <ul className="mt-3 space-y-2 text-sm text-amber-50/82">
                  {combo.prerequisites.map((item, index) => (
                    <li key={`${combo.slug}-pre-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className={LABEL}>Pieces</div>
            <div className="mt-3 space-y-3">
              {combo.pieces.map((piece) => (
                <div
                  key={`${combo.slug}-${piece.role}-${piece.familyKey}`}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-black/35 p-3"
                >
                  <CardArt imageUrl={piece.imageUrl} alt={piece.cardName} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-amber-50">
                        {piece.quantity}x {piece.cardName}
                      </div>
                      <Badge>{piece.role}</Badge>
                    </div>
                    <div className="mt-1 text-[11px] text-amber-100/70">
                      {piece.typeLine ?? "Catalog card"}
                    </div>
                    {piece.text ? (
                      <p className="mt-2 line-clamp-4 text-xs text-amber-50/75">
                        {piece.text}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function ComboFinderWorkspace({
  game,
  authEnabled,
  userId,
}: ComboFinderWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = (searchParams.get("q") ?? "").trim();
  const selectedSlug = (searchParams.get("selected") ?? "").trim();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const includeCards = parseFilterList(searchParams.get("includeCards"));
  const excludeCards = parseFilterList(searchParams.get("excludeCards"));
  const selectedTags = parseFilterList(searchParams.get("tags"));
  const selectedFormats = parseFilterList(searchParams.get("formatTags"));
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
  const [deckLabTab, setDeckLabTab] = useState<DeckLabTab>("paste");
  const [deckText, setDeckText] = useState("");
  const [savedDecks, setSavedDecks] = useState<SavedDeckSummary[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [savedDecksLoading, setSavedDecksLoading] = useState(false);
  const [savedDecksError, setSavedDecksError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ComboAnalyzeResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [scratchCards, setScratchCards] = useState<ScratchCard[]>([]);
  const [dropActive, setDropActive] = useState(false);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    setSearchDraft(q);
    setIncludeDraft(includeCards.join(", "));
    setExcludeDraft(excludeCards.join(", "));
    setTagDraft(selectedTags);
    setFormatDraft(selectedFormats);
    setCompleteOnlyDraft(completeOnly);
  }, [q, searchParams, includeCards, excludeCards, selectedTags, selectedFormats, completeOnly]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCombos() {
      setComboLoading(true);
      setComboError(null);

      try {
        const params = new URLSearchParams(searchParams.toString());
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
          setComboError(error instanceof Error ? error.message : "Failed to load combo library.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setComboLoading(false);
        }
      }
    }

    void loadCombos();
    return () => controller.abort();
  }, [game, searchParams]);

  useEffect(() => {
    if (deckLabTab !== "saved" || !userId) {
      return;
    }

    const controller = new AbortController();

    async function loadSavedDecks() {
      setSavedDecksLoading(true);
      setSavedDecksError(null);

      try {
        const response = await fetch(`/api/decks?game=${game}&scope=mine`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load saved decks.");
        }

        const payload = (await response.json()) as SavedDeckSummary[];
        setSavedDecks(payload);
        if (!selectedDeckId && payload[0]?.id) {
          setSelectedDeckId(payload[0].id);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setSavedDecksError(error instanceof Error ? error.message : "Failed to load saved decks.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setSavedDecksLoading(false);
        }
      }
    }

    void loadSavedDecks();
    return () => controller.abort();
  }, [deckLabTab, game, selectedDeckId, userId]);

  const selectedCombo = useMemo(() => {
    const deckAware = [
      ...(analysis?.exactMatches ?? []),
      ...(analysis?.nearMisses ?? []),
      ...(analysis?.synergySuggestions ?? []),
    ];

    return (
      [...deckAware, ...(comboData?.results ?? [])].find((combo) => combo.slug === selectedSlug) ??
      null
    );
  }, [analysis, comboData?.results, selectedSlug]);

  function updateSearchParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function applyFilters(event?: FormEvent) {
    event?.preventDefault();
    updateSearchParams((params) => {
      params.delete("page");

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
      ["q", "includeCards", "excludeCards", "tags", "formatTags", "completeOnly", "page"].forEach((key) =>
        params.delete(key),
      );
    });
  }

  function selectCombo(slug: string) {
    updateSearchParams((params) => {
      params.set("selected", slug);
    });
  }

  async function runAnalysis(request: ComboAnalyzeRequest) {
    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/combos/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const payload = (await response.json()) as ComboAnalyzeResponse | { error?: string };
      if (!response.ok || !("game" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Failed to analyze combo input.");
      }

      const nextAnalysis = payload as ComboAnalyzeResponse;
      setAnalysis(nextAnalysis);
      const first = nextAnalysis.exactMatches[0] ?? nextAnalysis.nearMisses[0] ?? nextAnalysis.synergySuggestions[0] ?? null;
      if (first) {
        selectCombo(first.slug);
      }
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Failed to analyze combo input.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  function analyzeDeckLab() {
    if (deckLabTab === "saved") {
      if (!selectedDeckId) {
        setAnalysisError("Pick a saved deck first.");
        return;
      }
      void runAnalysis({ game, inputSource: "saved", deckId: selectedDeckId });
      return;
    }

    if (deckLabTab === "scratch") {
      void runAnalysis({ game, inputSource: "scratch", scratchCards });
      return;
    }

    void runAnalysis({ game, inputSource: "paste", deckText });
  }

  function handleDragEnter(event: DragEvent<HTMLElement>) {
    if (!canAcceptDraggedCard(event)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setDropActive(true);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (!canAcceptDraggedCard(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDropActive(true);
  }

  function handleDragLeave() {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setDropActive(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    if (!canAcceptDraggedCard(event)) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setDropActive(false);
    setDeckLabTab("scratch");

    const payload = extractDraggedCardPayload(event.dataTransfer);
    if (!payload) {
      setAnalysisError("The dropped card payload fizzled out before the combo lab caught it.");
      return;
    }

    if (payload.game !== game) {
      setAnalysisError(`That card belongs to ${payload.game}, not ${game}.`);
      return;
    }

    setScratchCards((current) => {
      const familyKey = payload.familyKey ?? payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const existing = current.find((entry) => entry.familyKey === familyKey);
      if (existing) {
        return current.map((entry) =>
          entry.familyKey === familyKey ? { ...entry, quantity: Math.min(entry.quantity + 1, 99) } : entry,
        );
      }

      return [
        ...current,
        {
          familyKey,
          cardName: payload.name,
          quantity: 1,
          imageUrl: payload.imageUrl,
          typeLine: payload.type,
          text: payload.text,
          domains: payload.domains,
          energyCost: payload.energyCost,
          power: payload.power,
          might: payload.might,
          hp: payload.hp,
        },
      ];
    });
  }

  function removeScratchCard(familyKey: string) {
    setScratchCards((current) => current.filter((entry) => entry.familyKey !== familyKey));
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

    window.localStorage.setItem(`nexusarchive:deck-draft:${game}:new`, JSON.stringify(draft));
    router.push(buildGamePath(game, "deckbuilder"));
  }

  const buckets: Array<{ bucket: ComboMatchBucket; items: ComboResultSummary[] }> = [
    { bucket: "exactMatches", items: analysis?.exactMatches ?? [] },
    { bucket: "nearMisses", items: analysis?.nearMisses ?? [] },
    { bucket: "synergySuggestions", items: analysis?.synergySuggestions ?? [] },
  ];

  return (
    <main
      className="py-6 sm:py-8 lg:py-10"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mx-auto max-w-[1600px] space-y-6 px-4">
        <section className={`${SURFACE} px-5 py-5 sm:px-8 sm:py-7`}>
          <div className="inline-flex rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
            Find My Combo
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-amber-50 sm:text-4xl">
            Combo Finder Workspace
          </h1>
          <p className="mt-3 max-w-4xl text-sm text-amber-100/78 sm:text-base">
            Search the combo library, then analyze pasted lists, saved decks, or dropped cards to see what is live, what is close, and what just looks like it wants to cause trouble.
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
          </form>
        </section>

        {dropActive ? (
          <div className="rounded-[28px] border border-dashed border-amber-300/55 bg-black/45 px-5 py-4 text-center text-sm font-semibold text-amber-100">
            Drop cards anywhere on this page to build a scratch combo check.
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <section className={`${SURFACE} p-4 sm:p-5`}>
              <div className="mb-4">
                <div className={LABEL}>Advanced Search</div>
                <h2 className="mt-2 text-lg font-semibold text-amber-50">Tighten the library query</h2>
              </div>
              <form onSubmit={applyFilters} className="space-y-4">
                <label className="block">
                  <div className={LABEL}>Include Cards</div>
                  <input value={includeDraft} onChange={(event) => setIncludeDraft(event.target.value)} placeholder="Sol Ring, Nami" className="mt-2 w-full rounded-2xl border border-white/12 bg-black/45 px-4 py-3 text-sm text-amber-50 outline-none placeholder:text-amber-50/35" />
                </label>
                <label className="block">
                  <div className={LABEL}>Exclude Cards</div>
                  <input value={excludeDraft} onChange={(event) => setExcludeDraft(event.target.value)} placeholder="Cards you do not want" className="mt-2 w-full rounded-2xl border border-white/12 bg-black/45 px-4 py-3 text-sm text-amber-50 outline-none placeholder:text-amber-50/35" />
                </label>
                <div>
                  <div className={LABEL}>Tags</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(comboData?.filterOptions.tags ?? []).slice(0, 14).map((tag) => (
                      <button key={tag} type="button" onClick={() => setTagDraft((current) => toggleString(current, tag))} className={`rounded-full border px-3 py-1 text-[11px] ${tagDraft.includes(tag) ? "border-amber-300/80 bg-amber-400/90 text-slate-950" : "border-white/12 bg-black/45 text-amber-50/85"}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className={LABEL}>Formats</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(comboData?.filterOptions.formatTags ?? []).slice(0, 14).map((tag) => (
                      <button key={tag} type="button" onClick={() => setFormatDraft((current) => toggleString(current, tag))} className={`rounded-full border px-3 py-1 text-[11px] ${formatDraft.includes(tag) ? "border-sky-300/80 bg-sky-400/90 text-slate-950" : "border-white/12 bg-black/45 text-amber-50/85"}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-amber-50/80">
                  <input type="checkbox" checked={completeOnlyDraft} onChange={(event) => setCompleteOnlyDraft(event.target.checked)} className="mt-1 h-4 w-4 rounded border-white/20 bg-black/60" />
                  <span><span className="block font-semibold text-amber-100">Complete combos only</span>Hide unfinished or placeholder records.</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300">Apply filters</button>
                  <button type="button" onClick={clearFilters} className="rounded-full border border-white/12 bg-black/55 px-4 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10">Clear</button>
                </div>
              </form>
            </section>
          </aside>
          <section className="space-y-4">
            <div className={`${SURFACE} p-4 sm:p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className={LABEL}>Results</div>
                  <div className="mt-2 text-sm text-amber-100/78">
                    {comboLoading ? "Loading combo library..." : comboError ?? `Showing ${comboData?.results.length ?? 0} of ${comboData?.total ?? 0} curated combos`}
                  </div>
                </div>
                {comboData ? (
                  <div className="rounded-full border border-white/12 bg-black/45 px-3 py-2 text-xs text-amber-100/72">
                    Page {comboData.page} of {Math.max(comboData.totalPages, 1)}
                  </div>
                ) : null}
              </div>
            </div>

            {analysisError ? (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {analysisError}
              </div>
            ) : null}

            {analysis ? (
              <div className="space-y-4">
                <div className={`${SURFACE} p-4 sm:p-5`}>
                  <div className={LABEL}>Deck Lab Read</div>
                  <div className="mt-2 text-sm text-amber-100/78">
                    {analysis.deckCards.length} resolved cards checked in this pass.
                  </div>
                  {analysis.parseResult?.warnings.length ? (
                    <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                      {analysis.parseResult.warnings.join(" ")}
                    </div>
                  ) : null}
                  {analysis.parseResult?.unresolvedLines.length ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/35 p-4">
                      <div className={LABEL}>Unresolved Lines</div>
                      <ul className="mt-2 space-y-2 text-xs text-amber-50/75">
                        {analysis.parseResult.unresolvedLines.slice(0, 8).map((issue, index) => (
                          <li key={`${issue.line}-${index}`}>
                            <span className="font-semibold text-amber-200">{issue.line}</span>: {issue.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                {buckets.map(({ bucket, items }) => (
                  <div key={bucket} className="space-y-3">
                    <div className="px-1">
                      <div className={LABEL}>{bucketLabel(bucket)}</div>
                      <div className="mt-1 text-sm text-amber-100/72">
                        {items.length > 0 ? `${items.length} result${items.length === 1 ? "" : "s"}` : "No results in this bucket yet."}
                      </div>
                    </div>
                    {items.map((combo) => (
                      <ResultCard key={`${bucket}-${combo.slug}`} combo={combo} selected={selectedSlug === combo.slug} onSelect={selectCombo} onLoad={loadIntoDeckBuilder} />
                    ))}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="px-1">
                <div className={LABEL}>Combo Library</div>
                <div className="mt-1 text-sm text-amber-100/72">
                  Curated results stay browseable even without a loaded deck.
                </div>
              </div>
              {(comboData?.results ?? []).map((combo) => (
                <ResultCard key={combo.slug} combo={combo} selected={selectedSlug === combo.slug} onSelect={selectCombo} onLoad={loadIntoDeckBuilder} />
              ))}
              {!comboLoading && !comboError && (comboData?.results.length ?? 0) === 0 ? (
                <div className={`${SURFACE} p-5 text-sm text-amber-100/72`}>
                  No curated combos matched the current filters.
                </div>
              ) : null}
            </div>

            {comboData && comboData.totalPages > 1 ? (
              <div className="flex items-center justify-between gap-3 text-xs text-amber-100/72">
                {page > 1 ? (
                  <button type="button" onClick={() => updateSearchParams((params) => params.set("page", String(page - 1)))} className="rounded-full border border-white/12 bg-black/55 px-4 py-2 hover:bg-white/10">Previous</button>
                ) : (
                  <span className="rounded-full border border-white/10 px-4 py-2 text-amber-100/35">Previous</span>
                )}
                {page < comboData.totalPages ? (
                  <button type="button" onClick={() => updateSearchParams((params) => params.set("page", String(page + 1)))} className="rounded-full border border-white/12 bg-black/55 px-4 py-2 hover:bg-white/10">Next</button>
                ) : (
                  <span className="rounded-full border border-white/10 px-4 py-2 text-amber-100/35">Next</span>
                )}
              </div>
            ) : null}
          </section>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <section className={`${SURFACE} p-4 sm:p-5`}>
              <div className="mb-4">
                <div className={LABEL}>Deck Lab</div>
                <h2 className="mt-2 text-lg font-semibold text-amber-50">Analyze what you already have</h2>
              </div>

              <div className="inline-flex rounded-full border border-white/12 bg-black/45 p-1">
                {(["paste", "saved", "scratch"] as DeckLabTab[]).map((tab) => (
                  <button key={tab} type="button" onClick={() => setDeckLabTab(tab)} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${deckLabTab === tab ? "bg-amber-400 text-slate-950" : "text-amber-50/80 hover:bg-white/10"}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-4">
                {deckLabTab === "paste" ? (
                  <div className="space-y-3">
                    <textarea value={deckText} onChange={(event) => setDeckText(event.target.value)} rows={12} className="w-full rounded-2xl border border-white/12 bg-black/45 px-4 py-3 text-sm text-amber-50 outline-none placeholder:text-amber-50/35" placeholder={`4 Lightning Bolt\n1 Sol Ring\n1x Hullbreaker Horror`} />
                    <p className="text-xs text-amber-100/70">Plain-text decklists are fine. Section headers and comments are ignored.</p>
                  </div>
                ) : null}

                {deckLabTab === "saved" ? (
                  !authEnabled ? (
                    <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-amber-100/72">Sign-in is not configured here yet, so saved deck loading is asleep.</div>
                  ) : !userId ? (
                    <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-amber-100/72">Sign in to load one of your saved decks into the combo finder.</div>
                  ) : savedDecksLoading ? (
                    <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-amber-100/72">Loading saved decks...</div>
                  ) : savedDecksError ? (
                    <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{savedDecksError}</div>
                  ) : savedDecks.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-amber-100/72">No saved decks were found for this game yet.</div>
                  ) : (
                    <select value={selectedDeckId ?? ""} onChange={(event) => setSelectedDeckId(Number.parseInt(event.target.value, 10))} className="w-full rounded-2xl border border-white/12 bg-black/45 px-4 py-3 text-sm text-amber-50">
                      {savedDecks.map((deck) => (
                        <option key={deck.id} value={deck.id}>{deck.name} · {deck.formatKey} · {deck.totalCards} cards</option>
                      ))}
                    </select>
                  )
                ) : null}

                {deckLabTab === "scratch" ? (
                  <div className="space-y-3">
                    <div className={`rounded-2xl border p-4 text-sm ${dropActive ? "border-amber-300/55 bg-amber-400/10 text-amber-100" : "border-white/10 bg-black/35 text-amber-100/72"}`}>
                      Drag cards in from the gallery or deck builder and this tray will check them as a mini package.
                    </div>
                    <div className="space-y-2">
                      {scratchCards.map((card) => (
                        <div key={card.familyKey} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-3">
                          <CardArt imageUrl={card.imageUrl} alt={card.cardName} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-amber-50">{card.quantity}x {card.cardName}</div>
                            <div className="text-[11px] text-amber-100/70">{card.typeLine ?? "Dropped card"}</div>
                          </div>
                          <button type="button" onClick={() => removeScratchCard(card.familyKey)} className="rounded-full border border-rose-300/20 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/20">Remove</button>
                        </div>
                      ))}
                      {scratchCards.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/12 bg-black/25 px-4 py-6 text-center text-sm text-amber-100/55">No scratch cards yet.</div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={analyzeDeckLab} disabled={analysisLoading} className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">
                  {analysisLoading ? "Analyzing..." : "Find my combo"}
                </button>
                <button type="button" onClick={() => { setAnalysis(null); setAnalysisError(null); }} className="rounded-full border border-white/12 bg-black/55 px-4 py-2 text-xs font-semibold text-amber-50 hover:bg-white/10">
                  Clear analysis
                </button>
              </div>
            </section>

            <section className={`${SURFACE} p-4 sm:p-5`}>
              <div className={LABEL}>Selected Combo</div>
              {selectedCombo ? (
                <div className="mt-3">
                  <div className="text-lg font-semibold text-amber-50">{selectedCombo.name}</div>
                  <p className="mt-2 text-sm text-amber-100/75">{selectedCombo.summary ?? selectedCombo.resultText ?? "No detail selected."}</p>
                </div>
              ) : (
                <div className="mt-3 text-sm text-amber-100/65">Pick a result card to pin its details here.</div>
              )}
            </section>
          </aside>
        </div>

        <div className="pt-1">
          <Link href={buildGamePath(game)} prefetch={false} className="text-xs font-medium text-amber-200 hover:text-white">
            ← Back to {game} home
          </Link>
        </div>
      </div>
    </main>
  );
}
