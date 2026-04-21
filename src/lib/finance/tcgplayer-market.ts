import { promises as fs } from "node:fs";
import path from "node:path";

import type { CardCatalogSummary } from "@/lib/cards/catalog";
import { compactText, normalizeSearchText } from "@/lib/cards/catalog";
import type {
  LiveFinanceComp,
  LiveFinancePriceSource,
} from "@/lib/finance/live-market";

type TcgplayerListingEntry = {
  productName?: string;
  setName?: string;
  marketPrice?: string | number;
  lowestPrice?: string | number;
  page?: number;
  scrapeTimestamp?: string;
  sourceUrl?: string;
  productUrl?: string;
};

type CachedTcgplayerFeed = {
  filePath: string;
  mtimeMs: number;
  entries: TcgplayerListingEntry[];
};

export type TcgplayerListingSnapshot = {
  marketPrice: number | null;
  lowPrice: number | null;
  activeListingFloor: number | null;
  externalUrl: string | null;
  sourceLabel: string;
  priceSources: LiveFinancePriceSource[];
  recentComps: LiveFinanceComp[];
  note: string;
  dataQualityNote: string;
};

const tcgplayerFeedCache = new Map<string, CachedTcgplayerFeed>();

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/[^0-9.-]+/g, "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

function getGameFeedPrefix(game: CardCatalogSummary["game"]) {
  switch (game) {
    case "magic-the-gathering":
      return "MTG_";
    case "one-piece":
      return "OnePiece_";
    case "riftbound":
    default:
      return "Riftbound_";
  }
}

async function getLatestTcgplayerFeed(card: Pick<CardCatalogSummary, "game">) {
  const root = path.join(process.cwd(), "tcgplayer_data");
  const prefix = getGameFeedPrefix(card.game);
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".jsonl"))
    .sort();

  const fileName = files.at(-1);
  if (!fileName) {
    return null;
  }

  const filePath = path.join(root, fileName);
  const stats = await fs.stat(filePath).catch(() => null);
  if (!stats) {
    return null;
  }

  const cached = tcgplayerFeedCache.get(filePath);
  if (cached && cached.mtimeMs === stats.mtimeMs) {
    return cached.entries;
  }

  const raw = await fs.readFile(filePath, "utf8").catch(() => null);
  if (!raw) {
    return null;
  }

  const parsed = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as TcgplayerListingEntry;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is TcgplayerListingEntry => Boolean(entry));

  tcgplayerFeedCache.set(filePath, {
    filePath,
    mtimeMs: stats.mtimeMs,
    entries: parsed,
  });

  return parsed;
}

function scoreTcgplayerEntry(
  card: Pick<CardCatalogSummary, "name" | "collectorNo" | "setName" | "setCode">,
  entry: TcgplayerListingEntry,
) {
  const productName = compactText(entry.productName);
  if (!productName) {
    return Number.NEGATIVE_INFINITY;
  }

  const normalizedName = normalizeSearchText(productName);
  const nameTokens = normalizeSearchText(card.name)
    .split(/\s+/)
    .filter((token) => token.length >= 2);

  if (nameTokens.some((token) => !normalizedName.includes(token))) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 110;
  const collectorToken = compactText(card.collectorNo)?.replace(/\s+/g, "").toLowerCase();
  if (
    collectorToken &&
    normalizedName.replace(/\s+/g, "").includes(collectorToken)
  ) {
    score += 80;
  }

  const setTokens = normalizeSearchText(card.setName ?? card.setCode ?? "")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
  const normalizedSet = normalizeSearchText(entry.setName ?? "");
  score += setTokens.filter((token) => normalizedSet.includes(token)).length * 8;

  return score;
}

export async function getTcgplayerListingSnapshot(card: CardCatalogSummary) {
  const feed = await getLatestTcgplayerFeed(card);
  if (!feed || feed.length === 0) {
    return null;
  }

  const matches = feed
    .map((entry) => ({
      entry,
      score: scoreTcgplayerEntry(card, entry),
    }))
    .filter((candidate) => Number.isFinite(candidate.score))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (
        (toNumber(left.entry.lowestPrice) ?? Number.MAX_SAFE_INTEGER) -
        (toNumber(right.entry.lowestPrice) ?? Number.MAX_SAFE_INTEGER)
      );
    })
    .slice(0, 5);

  if (matches.length === 0) {
    return null;
  }

  const priceValues = matches
    .map(({ entry }) => toNumber(entry.lowestPrice) ?? toNumber(entry.marketPrice))
    .filter((value): value is number => value != null && value > 0);

  const marketValues = matches
    .map(({ entry }) => toNumber(entry.marketPrice))
    .filter((value): value is number => value != null && value > 0);

  const listingFloor = toCurrency(Math.min(...priceValues));
  const marketPrice =
    marketValues.length > 0
      ? toCurrency(marketValues.reduce((sum, value) => sum + value, 0) / marketValues.length)
      : listingFloor;

  return {
    marketPrice,
    lowPrice: listingFloor,
    activeListingFloor: listingFloor,
    externalUrl: compactText(matches[0]?.entry.productUrl) ?? null,
    sourceLabel: "TCGplayer listing enrichment",
    priceSources: [
      {
        key: "tcgplayer-floor",
        label: "TCGplayer Listing Floor",
        source: "tcgplayer",
        role: "supplemental",
        type: "market",
        value: listingFloor,
        note: "Individual listing enrichment from the latest local TCGplayer scrape.",
      },
      {
        key: "tcgplayer-market",
        label: "TCGplayer Market Average",
        source: "tcgplayer",
        role: "supplemental",
        type: "market",
        value: marketPrice,
        note: "Average of the matched scraped TCGplayer market values for this exact card lane.",
      },
    ],
    recentComps: matches.map(({ entry }, index) => ({
      id: `tcgplayer-${index}-${normalizeSearchText(entry.productUrl ?? entry.productName ?? card.name)}`,
      price: toCurrency(toNumber(entry.lowestPrice) ?? toNumber(entry.marketPrice)) ?? 0,
      soldAt: compactText(entry.scrapeTimestamp)?.slice(0, 10) ?? "Scraped",
      marketplace: "TCGplayer listing",
      condition: "Listed",
    })),
    note: "TCGplayer listing enrichment is layered in alongside Google Shopping detail pricing.",
    dataQualityNote:
      "These comps come from the latest local TCGplayer scrape artifact and are used to add listing-level depth.",
  } satisfies TcgplayerListingSnapshot;
}
