import { Game as PrismaGame } from "@prisma/client";

import prisma from "@/lib/db";
import { buildGamePath, type GameSlug } from "@/lib/games";
import { normalizeSearchText } from "@/lib/cards/catalog";

import {
  getComboCatalogLookup,
  resolveCatalogCard,
  toComboPieceCardData,
} from "./catalog";
import type {
  ComboBrowseResponse,
  ComboPiece,
  ComboResultSummary,
  ComboSearchFilters,
} from "./types";

const GAME_TO_PRISMA: Record<GameSlug, PrismaGame> = {
  riftbound: PrismaGame.RIFTBOUND,
  "one-piece": PrismaGame.ONE_PIECE,
  "magic-the-gathering": PrismaGame.MAGIC_THE_GATHERING,
};

export const DEFAULT_COMBO_PAGE_SIZE = 12;
export const MAX_COMBO_PAGE_SIZE = 30;

function toComboHref(game: GameSlug, slug: string) {
  return `${buildGamePath(game, "combos/results")}?selected=${encodeURIComponent(slug)}`;
}

function compactList(values: Array<string | null | undefined>) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function normalizeList(values: string[]) {
  return values.map((value) => normalizeSearchText(value)).filter(Boolean);
}

type PrismaComboRecord = Awaited<ReturnType<typeof loadCombosForGame>>[number];

async function loadCombosForGame(game: GameSlug) {
  return prisma.combo.findMany({
    where: { game: GAME_TO_PRISMA[game] },
    include: {
      comboEntries: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: [
      { popularity: "desc" },
      { name: "asc" },
    ],
  });
}

async function mapComboRecord(
  game: GameSlug,
  combo: PrismaComboRecord,
): Promise<ComboResultSummary> {
  const lookup = await getComboCatalogLookup(game);
  const pieces: ComboPiece[] = combo.comboEntries.map((entry) => {
    const card = resolveCatalogCard(lookup, {
      familyKey: entry.familyKey,
      cardName: entry.cardName,
    });

    return {
      role: entry.role,
      ...toComboPieceCardData(card, {
        familyKey: entry.familyKey,
        cardName: entry.cardName,
        quantity: entry.quantity,
      }),
    };
  });

  return {
    id: combo.id,
    slug: combo.slug,
    game,
    source: combo.source,
    kind: combo.kind,
    name: combo.name,
    summary: combo.summary,
    resultText: combo.resultText,
    steps: Array.isArray(combo.steps) ? combo.steps.filter((step): step is string => typeof step === "string") : [],
    prerequisites: Array.isArray(combo.prerequisites)
      ? combo.prerequisites.filter((item): item is string => typeof item === "string")
      : [],
    tags: combo.tags,
    formatTags: combo.formatTags,
    isComplete: combo.isComplete,
    popularity: combo.popularity,
    pieces,
    href: toComboHref(game, combo.slug),
    match: null,
  };
}

function matchesText(combo: ComboResultSummary, normalizedQuery: string) {
  if (!normalizedQuery) {
    return true;
  }

  const searchable = normalizeSearchText(
    [
      combo.name,
      combo.summary,
      combo.resultText,
      ...combo.tags,
      ...combo.formatTags,
      ...combo.steps,
      ...combo.prerequisites,
      ...combo.pieces.map((piece) => piece.cardName),
    ]
      .filter(Boolean)
      .join(" "),
  );

  return searchable.includes(normalizedQuery);
}

function matchesCardFilters(
  combo: ComboResultSummary,
  includeCards: string[],
  excludeCards: string[],
) {
  const pieceNames = combo.pieces.map((piece) => normalizeSearchText(piece.cardName));

  if (includeCards.length > 0 && !includeCards.every((card) => pieceNames.includes(card))) {
    return false;
  }

  if (excludeCards.some((card) => pieceNames.includes(card))) {
    return false;
  }

  return true;
}

function matchesTagFilters(
  combo: ComboResultSummary,
  tags: string[],
  formatTags: string[],
) {
  const normalizedTags = combo.tags.map((tag) => normalizeSearchText(tag));
  const normalizedFormats = combo.formatTags.map((tag) => normalizeSearchText(tag));

  if (tags.length > 0 && !tags.every((tag) => normalizedTags.includes(tag))) {
    return false;
  }

  if (formatTags.length > 0 && !formatTags.every((tag) => normalizedFormats.includes(tag))) {
    return false;
  }

  return true;
}

export function parseComboPage(value: string | null) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parseComboPageSize(value: string | null) {
  const parsed = Number.parseInt(value ?? String(DEFAULT_COMBO_PAGE_SIZE), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_COMBO_PAGE_SIZE;
  }

  return Math.min(parsed, MAX_COMBO_PAGE_SIZE);
}

export function parseComboFilterList(value: string | null) {
  if (!value) {
    return [] satisfies string[];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseComboSearchFilters(searchParams: Pick<URLSearchParams, "get">) {
  return {
    q: (searchParams.get("q") ?? "").trim(),
    includeCards: parseComboFilterList(searchParams.get("includeCards")),
    excludeCards: parseComboFilterList(searchParams.get("excludeCards")),
    tags: parseComboFilterList(searchParams.get("tags")),
    formatTags: parseComboFilterList(searchParams.get("formatTags")),
    completeOnly: searchParams.get("completeOnly") === "1",
    page: parseComboPage(searchParams.get("page")),
    pageSize: parseComboPageSize(searchParams.get("pageSize")),
  } satisfies ComboSearchFilters;
}

export async function getComboBrowseResults(
  game: GameSlug,
  filters: ComboSearchFilters,
): Promise<ComboBrowseResponse> {
  const combos = await loadCombosForGame(game);
  const mapped = await Promise.all(combos.map((combo) => mapComboRecord(game, combo)));
  const normalizedQuery = normalizeSearchText(filters.q);
  const includeCards = normalizeList(filters.includeCards);
  const excludeCards = normalizeList(filters.excludeCards);
  const tags = normalizeList(filters.tags);
  const formatTags = normalizeList(filters.formatTags);

  const results = mapped.filter((combo) => {
    if (filters.completeOnly && !combo.isComplete) {
      return false;
    }

    return (
      matchesText(combo, normalizedQuery) &&
      matchesCardFilters(combo, includeCards, excludeCards) &&
      matchesTagFilters(combo, tags, formatTags)
    );
  });

  const total = results.length;
  const page = Math.min(filters.page, Math.max(1, Math.ceil(total / filters.pageSize) || 1));
  const start = (page - 1) * filters.pageSize;

  return {
    results: results.slice(start, start + filters.pageSize),
    total,
    page,
    pageSize: filters.pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / filters.pageSize),
    filterOptions: {
      tags: [...new Set(compactList(mapped.flatMap((combo) => combo.tags)))].sort((left, right) =>
        left.localeCompare(right, undefined, { sensitivity: "base" }),
      ),
      formatTags: [...new Set(compactList(mapped.flatMap((combo) => combo.formatTags)))].sort((left, right) =>
        left.localeCompare(right, undefined, { sensitivity: "base" }),
      ),
    },
  };
}

export async function getAllComboResults(game: GameSlug) {
  const combos = await loadCombosForGame(game);
  return Promise.all(combos.map((combo) => mapComboRecord(game, combo)));
}
