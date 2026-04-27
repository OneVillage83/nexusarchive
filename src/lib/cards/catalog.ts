import type { GameSlug } from "@/lib/games";

export type CardCatalogSource =
  | "scryfall-default-cards"
  | "scryfall-all-cards"
  | "optcgapi-all-set-cards"
  | "one-piece-official-cardlist"
  | "piltoverarchive-cards"
  | "riftcodex-cards"
  | "riftbound-official-gallery";

export type CardCatalogSummary = {
  id: string;
  game: GameSlug;
  name: string;
  familyKey?: string;
  baseName?: string;
  representativeName?: string | null;
  versionLabel?: string | null;
  versionCount?: number;
  artCount?: number;
  isBaseVersion?: boolean;
  language?: string | null;
  type: string | null;
  domains: string[];
  tags: string[];
  energyCost: number | null;
  power: number | null;
  might: number | null;
  hp: number | null;
  rarity: string | null;
  text: string | null;
  flavor: string | null;
  setCode: string | null;
  setName: string | null;
  collectorNo: string | null;
  imageUrl: string | null;
  artist: string | null;
  marketPrice: number | null;
  financeProductId?: string;
  fairValue?: number | null;
  delta24h?: number | null;
  deltaPercent24h?: number | null;
  liquidityScore?: number | null;
  confidenceScore?: number | null;
  cashNowValue?: number | null;
  fastSellValue?: number | null;
  maxValueValue?: number | null;
  storeCreditValue?: number | null;
  sourceLabel?: string;
  source: CardCatalogSource;
  externalUrl: string | null;
  searchText: string;
};

export type CardCatalogMeta = {
  game: GameSlug;
  source: CardCatalogSource;
  sourceLabel: string;
  sourceUrl: string;
  cardCount: number;
  importedAt: string;
  upstreamUpdatedAt: string | null;
  notes?: string[];
};

export type CardCatalogQueryResult = {
  cards: CardCatalogSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  meta: CardCatalogMeta;
};

const CARD_CATALOG_PREFIX = "card-catalog";
const CARD_GALLERY_CACHE_VERSION = "v5";
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function gamePrefix(game: GameSlug) {
  return `${CARD_CATALOG_PREFIX}:${game}`;
}

export function cardCatalogMetaKey(game: GameSlug) {
  return `${gamePrefix(game)}:meta`;
}

export function cardCatalogAllIdsKey(game: GameSlug) {
  return `${gamePrefix(game)}:all-ids`;
}

export function cardCatalogSummaryKey(game: GameSlug, id: string) {
  return `${gamePrefix(game)}:summary:${id}`;
}

export function cardCatalogImageCacheKey(game: GameSlug, id: string) {
  return `${gamePrefix(game)}:image-cache:${id}`;
}

export function cardCatalogGalleryIdsKey(
  game: GameSlug,
  versionMode: "premium" | "base",
) {
  return `${gamePrefix(game)}:gallery:${CARD_GALLERY_CACHE_VERSION}:${versionMode}:ids`;
}

export function cardCatalogGalleryImportedAtKey(
  game: GameSlug,
  versionMode: "premium" | "base",
) {
  return `${gamePrefix(game)}:gallery:${CARD_GALLERY_CACHE_VERSION}:${versionMode}:imported-at`;
}

export function cardCatalogTokenKey(game: GameSlug, token: string) {
  return `${gamePrefix(game)}:token:${token}`;
}

export function cardCatalogTokenRegistryKey(game: GameSlug) {
  return `${gamePrefix(game)}:token-keys`;
}

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenizeForIndex(values: Array<string | null | undefined>) {
  const tokens = new Set<string>();

  for (const value of values) {
    if (!value) {
      continue;
    }

    for (const token of normalizeSearchText(value).split(/\s+/)) {
      const isNumericToken = /^\d+$/.test(token);
      if ((!isNumericToken && token.length < 2) || STOP_WORDS.has(token)) {
        continue;
      }

      tokens.add(token);
    }
  }

  return [...tokens];
}

export function buildCardSearchText(
  summary: Omit<CardCatalogSummary, "searchText">,
  searchTerms: Array<string | null | undefined> = [],
) {
  return normalizeSearchText(
    [
      summary.id,
      summary.name,
      summary.type,
      summary.domains.join(" "),
      summary.tags.join(" "),
      summary.rarity,
      summary.text,
      summary.flavor,
      summary.setCode,
      summary.setName,
      summary.collectorNo,
      summary.artist,
      summary.language,
      summary.energyCost != null ? String(summary.energyCost) : null,
      summary.power != null ? String(summary.power) : null,
      summary.might != null ? String(summary.might) : null,
      summary.hp != null ? String(summary.hp) : null,
      ...searchTerms,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function coerceInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function coerceFloat(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

export function compactText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const compacted = value.replace(/\s+/g, " ").trim();
  return compacted || null;
}

export function getCatalogLanguage(card: Pick<CardCatalogSummary, "game" | "language" | "searchText">) {
  const explicit = compactText(card.language)?.toLowerCase();
  if (explicit) {
    return explicit;
  }

  if (card.game !== "magic-the-gathering") {
    return "en";
  }

  const tokens = new Set(
    card.searchText
      .split(/\s+/)
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean),
  );

  if (tokens.has("en")) {
    return "en";
  }

  for (const language of [
    "ja",
    "es",
    "fr",
    "de",
    "it",
    "pt",
    "ru",
    "ko",
    "zhs",
    "zht",
    "he",
    "la",
    "grc",
    "ar",
    "sa",
    "ph",
  ]) {
    if (tokens.has(language)) {
      return language;
    }
  }

  return null;
}

export function isCatalogCardEnglish(
  card: Pick<CardCatalogSummary, "game" | "language" | "searchText">,
) {
  const language = getCatalogLanguage(card);
  return language == null || language === "en";
}

export function shouldServeCatalogImageFromApi(
  card: Pick<CardCatalogSummary, "source" | "imageUrl">,
) {
  if (!card.imageUrl) {
    return false;
  }

  return card.source === "one-piece-official-cardlist";
}

export function getStableCatalogImageUrl(
  card: Pick<CardCatalogSummary, "game" | "id" | "source" | "imageUrl">,
) {
  if (!card.imageUrl) {
    return null;
  }

  if (!shouldServeCatalogImageFromApi(card)) {
    return card.imageUrl;
  }

  return `/api/card-images/${card.game}/${encodeURIComponent(card.id)}`;
}
