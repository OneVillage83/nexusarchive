import { Game as PrismaGame } from "@prisma/client";

import prisma from "@/lib/db";
import type { GameSlug } from "@/lib/games";
import {
  getGoogleProductDetailsResult,
  type GoogleProductDetailsLookupResult,
  type GoogleProductLookupMode,
  type GoogleProductLookupStatus,
  type MarketRefreshTier,
} from "@/lib/finance/google-market";
import {
  getEbayEnvironment,
  getLiveFinanceMarketSnapshot,
  type LiveFinanceMarketSnapshot,
  type LiveFinancePriceSource,
  type LiveFinancePsaCertification,
} from "@/lib/finance/live-market";
import {
  getTcgplayerListingSnapshot,
  type TcgplayerListingSnapshot,
} from "@/lib/finance/tcgplayer-market";
import { getRedis } from "@/lib/storage/redis";
import {
  buildCardSearchText,
  cardCatalogAllIdsKey,
  cardCatalogMetaKey,
  cardCatalogSummaryKey,
  type CardCatalogMeta,
  type CardCatalogSource,
  type CardCatalogSummary,
  compactText,
  getStableCatalogImageUrl,
  isCatalogCardEnglish,
  normalizeSearchText,
} from "@/lib/cards/catalog";
import {
  cardsShareIdentity,
  getCardBaseName,
  getCardVersionLabel,
  isLikelyBaseVersion,
} from "@/lib/cards/identity";
import { scoreComboSynergyPair } from "@/lib/combos/engine";

const GAME_TO_PRISMA: Record<GameSlug, PrismaGame> = {
  riftbound: PrismaGame.RIFTBOUND,
  "one-piece": PrismaGame.ONE_PIECE,
  "magic-the-gathering": PrismaGame.MAGIC_THE_GATHERING,
};

const SAMPLE_CARD_LIMIT = 220;
const PREVIEW_POSITION_LIMIT = 8;
const FINANCE_HOME_TTL_SECONDS = 60 * 30;
const FINANCE_PRODUCT_TTL_SECONDS = 60 * 60 * 24 * 2;
const FINANCE_PRODUCT_ERROR_RETRY_TTL_SECONDS = 60 * 5;
const FINANCE_SEALED_TTL_SECONDS = 60 * 60;
const ALL_CATALOG_CACHE_TTL_MS = 1000 * 60 * 5;

const financeCatalogCache = new Map<
  GameSlug,
  { cards: CardCatalogSummary[]; expiresAt: number }
>();

export type FinanceRouteKey =
  | "cash-now"
  | "fast-sell"
  | "max-value"
  | "store-credit"
  | "grade-first";

export type FinanceSeverity = "low" | "medium" | "high";

export type FinancePriceSource = {
  key: string;
  label: string;
  source: "google-shopping" | "ebay" | "tcgplayer" | "reference";
  role: "primary" | "supplemental" | "reference";
  type: "market" | "sold" | "buylist" | "reference";
  value: number | null;
  note: string;
};

export type FinanceRouteEstimate = {
  key: FinanceRouteKey;
  label: string;
  netValue: number;
  etaLabel: string;
  confidenceScore: number;
  note: string;
};

export type FinanceHistoryPoint = {
  date: string;
  value: number;
};

export type FinanceComp = {
  id: string;
  price: number;
  soldAt: string;
  marketplace: string;
  condition: string;
};

export type FinanceRulingNote = {
  title: string;
  body: string;
};

export type FinanceSynergyCard = {
  financeProductId: string;
  name: string;
  subtitle: string;
  imageUrl: string | null;
  reason: string;
  fairValue: number | null;
};

export type FinanceArtVariant = {
  financeProductId: string;
  name: string;
  imageUrl: string | null;
  versionLabel: string;
  setName: string | null;
  setCode: string | null;
  rarity: string | null;
  marketPrice: number | null;
  fairValue: number | null;
  isBaseVersion: boolean;
  isSelected: boolean;
};

export type FinanceTeaser = {
  financeProductId: string;
  marketPrice: number | null;
  fairValue: number | null;
  delta24h: number | null;
  deltaPercent24h: number | null;
  liquidityScore: number | null;
  confidenceScore: number | null;
  cashNowValue: number | null;
  fastSellValue: number | null;
  maxValueValue: number | null;
  storeCreditValue: number | null;
  sourceLabel: string;
};

export type FinanceProductSummary = FinanceTeaser & {
  id: string;
  game: GameSlug;
  name: string;
  subtitle: string;
  imageUrl: string | null;
  setName: string | null;
  setCode: string | null;
  collectorNo: string | null;
  rarity: string | null;
  tags: string[];
  note: string;
};

export type FinanceMarketSource =
  | "google-shopping"
  | "ebay"
  | "tcgplayer"
  | "reference";

export type FinanceMarketProvenance = {
  primarySource: FinanceMarketSource;
  primaryLabel: string;
  lookupMode: GoogleProductLookupMode;
  googleStatus: GoogleProductLookupStatus;
  cacheTier: MarketRefreshTier | null;
  freshnessLabel: string;
  supplementalSources: FinanceMarketSource[];
  isFallback: boolean;
  fallbackMessage: string | null;
};

export type FinanceProductDetail = FinanceProductSummary & {
  baseCardName: string;
  selectedVariantName: string;
  selectedVariantLabel: string;
  artVariants: FinanceArtVariant[];
  rulingNotes: FinanceRulingNote[];
  synergyCards: FinanceSynergyCard[];
  source: CardCatalogSource;
  externalUrl: string | null;
  lowPrice: number | null;
  soldMedian: number | null;
  activeListingFloor: number | null;
  buylistFloor: number | null;
  gradeFirstValue: number | null;
  recommendation: {
    title: string;
    body: string;
  };
  priceSources: FinancePriceSource[];
  routeEstimates: FinanceRouteEstimate[];
  history: FinanceHistoryPoint[];
  recentComps: FinanceComp[];
  recentActivityLabel: string;
  recentActivityDescription: string;
  alerts: string[];
  lastUpdatedAt: string | null;
  freshnessLabel: string;
  sourceCount: number;
  dataQualityNote: string;
  marketProvenance: FinanceMarketProvenance;
  psaCertification: LiveFinancePsaCertification | null;
};

export type FinanceSealedSummary = {
  id: string;
  game: GameSlug;
  name: string;
  setName: string | null;
  imageUrl: string | null;
  currentPrice: number;
  fairValue: number;
  delta24h: number;
  deltaPercent24h: number;
  ripEv: number;
  liquidityScore: number;
  confidenceScore: number;
  chaseConcentration: number;
  recommendation: string;
};

export type FinanceSealedDetail = FinanceSealedSummary & {
  ripVariance: number;
  singlesEvTrend: FinanceHistoryPoint[];
  notes: string[];
};

export type FinanceAlertFeedItem = {
  id: string;
  severity: FinanceSeverity;
  title: string;
  summary: string;
  href: string;
};

export type FinanceIndexSummary = {
  label: string;
  count: number;
};

export type FinanceHomeData = {
  status: {
    headline: string;
    summary: string;
    coverageLabel: string;
    averageLiquidity: number;
    averageConfidence: number;
  };
  hottestMovers: FinanceProductSummary[];
  biggestReversals: FinanceProductSummary[];
  mostLiquid: FinanceProductSummary[];
  rawVsGraded: FinanceProductSummary[];
  buylistSpreadLeaders: FinanceProductSummary[];
  sealedOpportunities: FinanceSealedSummary[];
  alerts: FinanceAlertFeedItem[];
  indexes: FinanceIndexSummary[];
};

export type FinancePreviewPosition = {
  financeProductId: string;
  name: string;
  imageUrl: string | null;
  setName: string | null;
  quantity: number;
  marketPrice: number;
  fairValue: number;
  delta24h: number;
  deltaPercent24h: number;
  totalValue: number;
  averageCost: number;
  unrealizedGain: number;
};

export type FinanceCollectionSnapshot = {
  positions: FinancePreviewPosition[];
  totalFairValue: number;
  totalRealizableValue: number;
  topMover: FinancePreviewPosition | null;
  biggestSinker: FinancePreviewPosition | null;
};

function toCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hashString(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function slugify(value: string) {
  return normalizeSearchText(value).replace(/\s+/g, "-");
}

function getFinanceProductId(card: Pick<CardCatalogSummary, "id">) {
  return card.id;
}

function getSetLabel(card: Pick<CardCatalogSummary, "setName" | "setCode">) {
  return compactText(card.setName) ?? compactText(card.setCode) ?? "Unsorted cardboard";
}

function getCardTags(card: CardCatalogSummary) {
  return [
    ...card.domains,
    card.rarity ?? "",
    card.type ?? "",
    card.setCode ?? "",
  ].filter(Boolean);
}

function getCoverageLabel(game: GameSlug, hasRealMarketPrice: boolean) {
  if (game === "magic-the-gathering" && hasRealMarketPrice) {
    return "MTG live-price mode";
  }

  if (hasRealMarketPrice) {
    return "Market-backed preview";
  }

  return "Thin-data finance preview";
}

function getGameSourceLabel(game: GameSlug, hasRealMarketPrice: boolean) {
  if (hasRealMarketPrice && game === "magic-the-gathering") {
    return "Scryfall-backed market blend";
  }

  switch (game) {
    case "one-piece":
      return hasRealMarketPrice
        ? "OPTCG market blend"
        : "OPTCG reference estimate";
    case "magic-the-gathering":
      return hasRealMarketPrice
        ? "Scryfall market blend"
        : "Scryfall reference estimate";
    case "riftbound":
    default:
      return hasRealMarketPrice
        ? "RiftCodex market blend"
        : "RiftCodex reference estimate";
  }
}

function rarityMultiplier(game: GameSlug, rarity: string | null) {
  const value = normalizeSearchText(rarity ?? "");

  if (!value) {
    return game === "magic-the-gathering" ? 1.15 : 1.1;
  }

  if (value.includes("mythic") || value.includes("secret") || value.includes("serialized")) {
    return 3.4;
  }

  if (
    value.includes("showcase") ||
    value.includes("alt") ||
    value.includes("parallel") ||
    value.includes("manga")
  ) {
    return 2.85;
  }

  if (
    value.includes("leader") ||
    value.includes("champion") ||
    value.includes("legendary") ||
    value.includes("mythic rare")
  ) {
    return 2.35;
  }

  if (
    value.includes("rare") ||
    value.includes("super rare") ||
    value.includes("sr") ||
    value.includes("promo")
  ) {
    return 1.85;
  }

  if (value.includes("uncommon")) {
    return 1.25;
  }

  return 1;
}

function deriveSyntheticMarketPrice(card: CardCatalogSummary) {
  const hash = hashString(`${card.game}:${card.id}:${card.name}`);
  const cost = card.energyCost ?? 1;
  const statsBase =
    (card.power ?? 0) * 0.02 +
    (card.might ?? 0) * 0.015 +
    (card.hp ?? 0) * 0.012;
  const gameBase =
    card.game === "magic-the-gathering"
      ? 0.9
      : card.game === "one-piece"
        ? 1.15
        : 1.05;
  const rarityBase = rarityMultiplier(card.game, card.rarity);
  const volatilitySeed = (hash % 850) / 100;

  return toCurrency(
    Math.max(
      0.35,
      gameBase * rarityBase * (0.85 + cost * 0.42 + statsBase) + volatilitySeed,
    ),
  );
}

export function deriveFinanceTeaser(card: CardCatalogSummary): FinanceTeaser {
  const hash = hashString(`${card.game}:${card.id}:${card.name}`);
  const hasRealMarketPrice =
    typeof card.marketPrice === "number" && Number.isFinite(card.marketPrice);
  const marketPrice = toCurrency(card.marketPrice ?? deriveSyntheticMarketPrice(card));
  const lowPrice = toCurrency((marketPrice ?? 0) * 0.92);
  const buylistFloor = toCurrency((marketPrice ?? 0) * (hasRealMarketPrice ? 0.68 : 0.61));
  const fairValue = toCurrency(
    ((marketPrice ?? 0) * 0.56) + ((lowPrice ?? 0) * 0.24) + ((buylistFloor ?? 0) * 0.2),
  );
  const deltaPercent24h = toCurrency((((hash % 1701) - 850) / 100));
  const delta24h = toCurrency(((fairValue ?? 0) * (deltaPercent24h ?? 0)) / 100);
  const liquidityScore = Math.round(
    clamp(
      (hasRealMarketPrice ? 58 : 38) +
        ((hash % 33) + 6) +
        Math.min((marketPrice ?? 0) * 2, 18),
      22,
      97,
    ),
  );
  const confidenceScore = Math.round(
    clamp(
      (hasRealMarketPrice ? 80 : 46) +
        (card.game === "magic-the-gathering" ? 10 : 0) +
        (hash % 11),
      35,
      98,
    ),
  );
  const cashNowValue = toCurrency((fairValue ?? 0) * (hasRealMarketPrice ? 0.74 : 0.69));
  const fastSellValue = toCurrency((fairValue ?? 0) * 0.84);
  const maxValueValue = toCurrency((fairValue ?? 0) * 1.03);
  const storeCreditValue = toCurrency((fairValue ?? 0) * 0.9);

  return {
    financeProductId: getFinanceProductId(card),
    marketPrice,
    fairValue,
    delta24h,
    deltaPercent24h,
    liquidityScore,
    confidenceScore,
    cashNowValue,
    fastSellValue,
    maxValueValue,
    storeCreditValue,
    sourceLabel: getGameSourceLabel(card.game, hasRealMarketPrice),
  };
}

function buildRouteEstimates(
  teaser: FinanceTeaser,
  game: GameSlug,
): FinanceRouteEstimate[] {
  const fairValue = teaser.fairValue ?? teaser.marketPrice ?? 0;
  const gradeFirstValue = toCurrency(
    fairValue * (game === "magic-the-gathering" ? 1.16 : 1.08),
  ) ?? fairValue;

  return [
    {
      key: "cash-now",
      label: "Cash Now",
      netValue: teaser.cashNowValue ?? fairValue * 0.7,
      etaLabel: "Same day",
      confidenceScore: Math.max(40, (teaser.confidenceScore ?? 50) - 6),
      note: "Best immediate exit if you want money more than ceiling.",
    },
    {
      key: "fast-sell",
      label: "Fast Sell",
      netValue: teaser.fastSellValue ?? fairValue * 0.84,
      etaLabel: "2–7 days",
      confidenceScore: teaser.confidenceScore ?? 50,
      note: "Undercut the room a little and move cardboard before it gets cute.",
    },
    {
      key: "max-value",
      label: "Max Value Listing",
      netValue: teaser.maxValueValue ?? fairValue,
      etaLabel: "1–4 weeks",
      confidenceScore: Math.max(35, (teaser.confidenceScore ?? 50) - 8),
      note: "Highest theoretical net after fees, patience, and a little market faith.",
    },
    {
      key: "store-credit",
      label: "Store Credit",
      netValue: teaser.storeCreditValue ?? fairValue * 0.9,
      etaLabel: "Same day",
      confidenceScore: Math.max(40, (teaser.confidenceScore ?? 50) - 3),
      note: "Best if the next deck project is already whispering at you.",
    },
    {
      key: "grade-first",
      label: "Grade First",
      netValue: gradeFirstValue,
      etaLabel: "3–8 weeks",
      confidenceScore: Math.max(28, (teaser.confidenceScore ?? 50) - 12),
      note: "Only makes sense when scarcity, condition, and demand all decide to cooperate.",
    },
  ];
}

function buildPriceSources(
  card: CardCatalogSummary,
  teaser: FinanceTeaser,
): FinancePriceSource[] {
  const fairValue = teaser.fairValue ?? teaser.marketPrice ?? 0;
  const marketPrice = teaser.marketPrice;
  const soldMedian = toCurrency(fairValue * 1.02);
  const listingFloor = toCurrency(fairValue * 0.96);
  const buylistFloor = toCurrency((teaser.cashNowValue ?? fairValue * 0.7) * 0.98);
  const baseSources: FinancePriceSource[] = [];

  if (card.game === "magic-the-gathering") {
    baseSources.push(
      {
        key: "scryfall-market",
        label: "Scryfall Market",
        source: "reference",
        role: "reference",
        type: "market",
        value: marketPrice,
        note: marketPrice
          ? "Imported from the Scryfall-backed catalog where available."
          : "Using a reference estimate because the imported record has no direct market price.",
      },
      {
        key: "ebay-sold",
        label: "eBay Sold Median",
        source: "reference",
        role: "reference",
        type: "sold",
        value: soldMedian,
        note: "Synthetic sold-comp median for the first finance pass.",
      },
      {
        key: "card-kingdom",
        label: "Card Kingdom Buylist",
        source: "reference",
        role: "reference",
        type: "buylist",
        value: buylistFloor,
        note: "Modeled buylist floor until live adapter coverage lands.",
      },
      {
        key: "nexus-fair",
        label: "Nexus Fair Value",
        source: "reference",
        role: "reference",
        type: "reference",
        value: fairValue,
        note: "Weighted from market, comp, and buylist signals.",
      },
    );
  } else if (card.game === "one-piece") {
    baseSources.push(
      {
        key: "optcg-reference",
        label: "OPTCG Market Signal",
        source: "reference",
        role: "reference",
        type: "market",
        value: marketPrice,
        note: "Thin-data reference estimate until broader marketplace adapters are wired.",
      },
      {
        key: "listing-floor",
        label: "Listing Floor",
        source: "reference",
        role: "reference",
        type: "market",
        value: listingFloor,
        note: "Modeled floor from current reference pricing and volatility.",
      },
      {
        key: "ebay-sold",
        label: "eBay Sold Median",
        source: "reference",
        role: "reference",
        type: "sold",
        value: soldMedian,
        note: "Synthetic comp lane for the first finance release.",
      },
      {
        key: "buylist",
        label: "Buylist Estimate",
        source: "reference",
        role: "reference",
        type: "buylist",
        value: buylistFloor,
        note: "Expected fast-cash floor when you just want to turn pirates into money.",
      },
    );
  } else {
    baseSources.push(
      {
        key: "riftcodex-reference",
        label: "RiftCodex Reference",
        source: "reference",
        role: "reference",
        type: "reference",
        value: marketPrice,
        note: "Catalog-backed reference estimate with low-confidence market weighting.",
      },
      {
        key: "listing-floor",
        label: "Listing Floor",
        source: "reference",
        role: "reference",
        type: "market",
        value: listingFloor,
        note: "Synthetic active floor while live marketplace coverage is still waking up.",
      },
      {
        key: "sold-median",
        label: "Community Sold Median",
        source: "reference",
        role: "reference",
        type: "sold",
        value: soldMedian,
        note: "Modeled comp lane from the first finance pass.",
      },
      {
        key: "buylist",
        label: "Buylist Estimate",
        source: "reference",
        role: "reference",
        type: "buylist",
        value: buylistFloor,
        note: "Low-confidence buylist estimate until real cash routes are connected.",
      },
    );
  }

  return baseSources;
}

function buildHistoryPoints(card: CardCatalogSummary, teaser: FinanceTeaser) {
  const hash = hashString(`${card.id}:${card.name}:${card.game}`);
  const base = teaser.fairValue ?? teaser.marketPrice ?? 1;
  const points: FinanceHistoryPoint[] = [];

  for (let index = 13; index >= 0; index -= 1) {
    const wave = Math.sin((hash % 17) + index / 2.7) * 0.035;
    const drift = ((hash % 9) - 4) * 0.003;
    const value = toCurrency(base * (1 + wave + drift * (13 - index))) ?? base;
    const date = new Date();
    date.setDate(date.getDate() - index);
    points.push({
      date: date.toISOString().slice(0, 10),
      value,
    });
  }

  return points;
}

function buildRulingNotes(card: CardCatalogSummary): FinanceRulingNote[] {
  const notes: FinanceRulingNote[] = [];
  const rulesText = compactText(card.text) ?? "";
  const typeLine = compactText(card.type) ?? "Card";
  const normalizedRules = normalizeSearchText(rulesText);

  notes.push({
    title: "Read the whole instruction",
    body: `${card.name} resolves using its full text, not the most dramatic fragment. Treat the type line "${typeLine}" and the printed text as one package before anyone starts freestyling timing claims.`,
  });

  if (normalizedRules.includes("when ") || normalizedRules.includes("whenever ")) {
    notes.push({
      title: "Triggered timing matters",
      body: "This text reads like it includes a trigger condition. Check the exact event and whether the effect uses a target, because the window and legality both matter before it actually resolves.",
    });
  }

  if (normalizedRules.includes("if ")) {
    notes.push({
      title: "Conditional text checks the board",
      body: "The card text includes a condition, so make sure that condition is still true at the relevant point in resolution. The archive strongly recommends not hand-waving past the word “if.”",
    });
  }

  if (
    normalizedRules.includes("instead") ||
    normalizedRules.includes("prevent") ||
    normalizedRules.includes("replacement")
  ) {
    notes.push({
      title: "Replacement-style wording",
      body: "This card looks like it may modify an event rather than wait for it. Replacement effects usually apply at the moment the event would happen, which is a very different flavor of trouble than a delayed trigger.",
    });
  }

  return notes.slice(0, 3);
}

function scoreSynergyPair(card: CardCatalogSummary, candidate: CardCatalogSummary) {
  if (card.id === candidate.id) {
    return {
      score: Number.NEGATIVE_INFINITY,
      reason: "Same exact card.",
    };
  }

  if (cardsShareIdentity(card, candidate)) {
    return {
      score: Number.NEGATIVE_INFINITY,
      reason: "Same card family.",
    };
  }

  const result = scoreComboSynergyPair(
    {
      familyKey: card.familyKey ?? normalizeSearchText(card.name),
      cardName: card.name,
      quantity: 1,
      cardId: card.id,
      imageUrl: card.imageUrl,
      typeLine: card.type,
      text: card.text,
      domains: card.domains,
      energyCost: card.energyCost,
      power: card.power,
      might: card.might,
      hp: card.hp,
    },
    {
      familyKey: candidate.familyKey ?? normalizeSearchText(candidate.name),
      cardName: candidate.name,
      quantity: 1,
      cardId: candidate.id,
      imageUrl: candidate.imageUrl,
      typeLine: candidate.type,
      text: candidate.text,
      domains: candidate.domains,
      energyCost: candidate.energyCost,
      power: candidate.power,
      might: candidate.might,
      hp: candidate.hp,
    },
  );

  return {
    score: result.score,
    reason:
      result.reasons[0] ??
      "Looks mechanically adjacent enough that the archive would at least keep it on the same messy desk.",
  };
}

async function buildSynergyCards(card: CardCatalogSummary): Promise<FinanceSynergyCard[]> {
  const cards = await getAllCatalogCards(card.game);

  return cards
    .map((candidate) => {
      const result = scoreSynergyPair(card, candidate);
      return {
        candidate,
        score: result.score,
        reason: result.reason,
      };
    })
    .filter((entry) => Number.isFinite(entry.score) && entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ candidate, reason }) => {
      const teaser = deriveFinanceTeaser(candidate);
      return {
        financeProductId: candidate.id,
        name: getCardBaseName(candidate.name),
        subtitle: `${candidate.type ?? "Card"} · ${getSetLabel(candidate)}`,
        imageUrl: getStableCatalogImageUrl(candidate),
        reason,
        fairValue: teaser.fairValue ?? teaser.marketPrice ?? null,
      } satisfies FinanceSynergyCard;
    });
}

function buildRecommendation(
  card: CardCatalogSummary,
  teaser: FinanceTeaser,
  routes: FinanceRouteEstimate[],
) {
  const sortedRoutes = [...routes].sort((left, right) => right.netValue - left.netValue);
  const bestRoute = sortedRoutes[0] ?? routes[0];
  const bestRouteLabel = bestRoute?.label ?? "Hold";

  if ((teaser.liquidityScore ?? 0) >= 82 && (teaser.deltaPercent24h ?? 0) < -3) {
    return {
      title: "Fast exit window",
      body: `${card.name} still looks liquid, but the line is softening. If the goal is cash and not bragging rights, ${bestRouteLabel.toLowerCase()} is the sensible move.`,
    };
  }

  if (bestRoute?.key === "grade-first" && (teaser.confidenceScore ?? 0) >= 76) {
    return {
      title: "Grade if condition cooperates",
      body: `The spread says there may be real upside here, but only if the copy is clean. Treat grading like a sharp tool, not a personality trait.`,
    };
  }

  return {
    title: `Best route right now: ${bestRouteLabel}`,
    body: `Current math says ${bestRouteLabel.toLowerCase()} gives the strongest mix of value and practicality for ${card.name}. You can still squeeze harder, but the archive would like to remind you that time is also a fee.`,
  };
}

function buildAlertLines(card: CardCatalogSummary, teaser: FinanceTeaser) {
  const alerts: string[] = [];

  if ((teaser.deltaPercent24h ?? 0) >= 6) {
    alerts.push("Momentum spike: the 24h move is hot enough to deserve a second look.");
  }

  if ((teaser.deltaPercent24h ?? 0) <= -6) {
    alerts.push("Reversal risk: price cooled fast, so greed should maybe go touch grass.");
  }

  if ((teaser.confidenceScore ?? 100) < 55) {
    alerts.push("Thin-data warning: this card still needs stronger marketplace coverage.");
  }

  if ((teaser.liquidityScore ?? 0) >= 85) {
    alerts.push("Liquidity is strong: this looks easier to exit than most cardboard drama.");
  }

  if (alerts.length === 0) {
    alerts.push("Nothing is screaming right now. This one is more steady archive hum than siren.");
  }

  return alerts;
}

function buildFinanceProductSummary(card: CardCatalogSummary): FinanceProductSummary {
  const teaser = deriveFinanceTeaser(card);

  return {
    id: getFinanceProductId(card),
    game: card.game,
    name: card.name,
    subtitle: `${card.type ?? "Card"} · ${getSetLabel(card)}`,
    imageUrl: getStableCatalogImageUrl(card),
    setName: card.setName,
    setCode: card.setCode,
    collectorNo: card.collectorNo,
    rarity: card.rarity,
    tags: getCardTags(card),
    note:
      teaser.confidenceScore != null && teaser.confidenceScore >= 75
        ? "Market-backed enough to treat as a real signal."
        : "Useful preview signal, but still waiting on richer market depth.",
    ...teaser,
  };
}

function averageNullableIntegers(values: Array<number | null | undefined>) {
  const normalized = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (normalized.length === 0) {
    return null;
  }

  return Math.round(
    normalized.reduce((sum, value) => sum + value, 0) / normalized.length,
  );
}

function mergeLivePriceSources(
  ...groups: Array<LiveFinancePriceSource[] | FinancePriceSource[] | null | undefined>
) {
  const merged = new Map<string, FinancePriceSource>();

  for (const group of groups) {
    for (const source of group ?? []) {
      if (!merged.has(source.key)) {
        merged.set(source.key, {
          key: source.key,
          label: source.label,
          source: source.source,
          role: source.role,
          type: source.type,
          value: source.value,
          note: source.note,
        });
      }
    }
  }

  return [...merged.values()];
}

function getMinimumLiveValue(...values: Array<number | null | undefined>) {
  const normalized = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (normalized.length === 0) {
    return null;
  }

  return toCurrency(Math.min(...normalized));
}

function uniqueSourceList(values: FinanceMarketSource[]) {
  return [...new Set(values)];
}

function formatMarketSourceLabel(source: FinanceMarketSource) {
  switch (source) {
    case "google-shopping":
      return "Google Shopping";
    case "tcgplayer":
      return "TCGplayer";
    case "ebay":
      return "eBay";
    case "reference":
    default:
      return "catalog/reference";
  }
}

function joinHumanList(values: string[]) {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function buildFallbackLaneLabel(
  primarySource: Exclude<FinanceMarketSource, "google-shopping">,
  supplementalSources: FinanceMarketSource[],
) {
  const labels = uniqueSourceList([
    primarySource,
    ...supplementalSources,
    "reference",
  ]).map((source) => formatMarketSourceLabel(source));

  return joinHumanList(labels);
}

function buildGoogleFallbackMessage(
  googleResult: GoogleProductDetailsLookupResult,
  primarySource: Exclude<FinanceMarketSource, "google-shopping">,
  supplementalSources: FinanceMarketSource[],
) {
  const fallbackLaneLabel = buildFallbackLaneLabel(primarySource, supplementalSources);

  switch (googleResult.status) {
    case "disabled":
      return `Google Shopping via Serper is disabled right now, so this page is leaning on ${fallbackLaneLabel}.`;
    case "missing-mapping":
      return `This card does not have a saved Google Shopping mapping yet, so this page is leaning on ${fallbackLaneLabel}.`;
    case "error":
      return googleResult.hasStoredMapping
        ? `A saved Google Shopping mapping exists, but the live Google refresh failed, so this page is leaning on ${fallbackLaneLabel}.`
        : `Google Shopping via Serper could not be reached for this card, so this page is leaning on ${fallbackLaneLabel}.`;
    case "active":
    case "discovered":
    default:
      return `Google Shopping via Serper is not driving this page right now, so it is leaning on ${fallbackLaneLabel}.`;
  }
}

export function buildFinanceMarketProvenance(
  googleResult: GoogleProductDetailsLookupResult,
  tcgplayerSnapshot: TcgplayerListingSnapshot | null,
  ebaySnapshot: LiveFinanceMarketSnapshot | null,
): FinanceMarketProvenance {
  const googleSnapshot = googleResult.snapshot;
  const supplementalSources = uniqueSourceList([
    tcgplayerSnapshot ? "tcgplayer" : null,
    ebaySnapshot ? "ebay" : null,
  ].filter((value): value is FinanceMarketSource => value != null));

  if (googleSnapshot) {
    return {
      primarySource: "google-shopping",
      primaryLabel: "Google Shopping via Serper",
      lookupMode: googleResult.lookupMode,
      googleStatus: googleResult.status,
      cacheTier: googleResult.tier,
      freshnessLabel: googleSnapshot.freshnessLabel,
      supplementalSources,
      isFallback: false,
      fallbackMessage: null,
    };
  }

  const primarySource: Exclude<FinanceMarketSource, "google-shopping"> =
    tcgplayerSnapshot != null
      ? "tcgplayer"
      : ebaySnapshot != null
        ? "ebay"
        : "reference";
  const normalizedSupplementalSources = supplementalSources.filter(
    (source) => source !== primarySource,
  );

  return {
    primarySource,
    primaryLabel:
      primarySource === "tcgplayer"
        ? "TCGplayer fallback pricing"
        : primarySource === "ebay"
          ? "eBay fallback pricing"
          : "Reference-only pricing",
    lookupMode: "fallback-only",
    googleStatus: googleResult.status,
    cacheTier: null,
    freshnessLabel:
      primarySource === "tcgplayer"
        ? "TCGplayer listing enrichment is using the latest locally available scrape."
        : primarySource === "ebay"
          ? ebaySnapshot?.freshnessLabel ?? "Live eBay pricing is temporarily unavailable."
          : "This product is currently using catalog/reference pricing only.",
    supplementalSources: normalizedSupplementalSources,
    isFallback: true,
    fallbackMessage: buildGoogleFallbackMessage(
      googleResult,
      primarySource,
      normalizedSupplementalSources,
    ),
  };
}

export function getFinanceProductDetailCacheTtlSeconds(
  marketProvenance: FinanceMarketProvenance | null | undefined,
) {
  if (marketProvenance?.isFallback && marketProvenance.googleStatus === "error") {
    return FINANCE_PRODUCT_ERROR_RETRY_TTL_SECONDS;
  }

  return FINANCE_PRODUCT_TTL_SECONDS;
}

export function shouldPreserveCachedFinanceProductDetail(
  cachedMarketProvenance: FinanceMarketProvenance | null | undefined,
  refreshedMarketProvenance: FinanceMarketProvenance | null | undefined,
) {
  if (!cachedMarketProvenance || !refreshedMarketProvenance) {
    return false;
  }

  return (
    cachedMarketProvenance.primarySource === "google-shopping" &&
    !cachedMarketProvenance.isFallback &&
    refreshedMarketProvenance.isFallback &&
    refreshedMarketProvenance.googleStatus === "error"
  );
}

export function buildFinanceRecentActivity(
  ebaySnapshot: LiveFinanceMarketSnapshot | null,
  marketProvenance: FinanceMarketProvenance,
) {
  if ((ebaySnapshot?.recentComps.length ?? 0) > 0) {
    return {
      recentComps: ebaySnapshot?.recentComps ?? [],
      recentActivityLabel: "eBay Showings",
      recentActivityDescription:
        marketProvenance.primarySource === "google-shopping"
          ? "Live eBay listings stay visible here while Google Shopping via Serper drives the primary price lane."
          : "Live eBay listings for this exact card lane remain visible here.",
    };
  }

  return {
    recentComps: [],
    recentActivityLabel: "eBay Showings",
    recentActivityDescription:
      marketProvenance.primarySource === "google-shopping"
        ? "eBay showings are unavailable for this product right now. Google Shopping via Serper is still driving the primary price lane."
        : marketProvenance.fallbackMessage ??
          "Live eBay showings are unavailable for this product right now.",
  };
}

async function buildMergedLiveMarketSnapshot(
  card: CardCatalogSummary,
  options?: { refresh?: boolean },
) {
  const [googleResult, tcgplayerSnapshot, ebaySnapshot] = await Promise.all([
    getGoogleProductDetailsResult(card, {
      refresh: options?.refresh,
    }).catch((error) => {
      console.error(`Google product detail lookup failed for ${card.game}:${card.id}:`, error);
      return {
        snapshot: null,
        status: "error",
        lookupMode: "fallback-only",
        tier: null,
        hasStoredMapping: false,
        failureReason: "request-failed",
      } satisfies GoogleProductDetailsLookupResult;
    }),
    getTcgplayerListingSnapshot(card).catch((error) => {
      console.error(`TCGplayer enrichment failed for ${card.game}:${card.id}:`, error);
      return null;
    }),
    getLiveFinanceMarketSnapshot(card, {
      refresh: options?.refresh,
    }).catch((error) => {
      console.error(`eBay supplemental lookup failed for ${card.game}:${card.id}:`, error);
      return null;
    }),
  ]);
  const googleSnapshot = googleResult.snapshot;
  const marketProvenance = buildFinanceMarketProvenance(
    googleResult,
    tcgplayerSnapshot,
    ebaySnapshot,
  );

  if (!googleSnapshot && !tcgplayerSnapshot && !ebaySnapshot) {
    return {
      snapshot: null,
      marketProvenance,
    };
  }

  const marketPrice =
    googleSnapshot?.marketPrice ??
    tcgplayerSnapshot?.marketPrice ??
    ebaySnapshot?.marketPrice ??
    null;
  const fairValue =
    googleSnapshot?.fairValue ??
    (marketPrice != null ? toCurrency(marketPrice * 0.94) : null) ??
    ebaySnapshot?.fairValue ??
    null;
  const lowPrice = getMinimumLiveValue(
    googleSnapshot?.lowPrice,
    tcgplayerSnapshot?.lowPrice,
    ebaySnapshot?.lowPrice,
  );
  const activeListingFloor = getMinimumLiveValue(
    googleSnapshot?.activeListingFloor,
    tcgplayerSnapshot?.activeListingFloor,
    ebaySnapshot?.activeListingFloor,
  );
  const buylistFloor =
    googleSnapshot?.buylistFloor ??
    ebaySnapshot?.buylistFloor ??
    (fairValue != null ? toCurrency(fairValue * 0.72) : null);
  const cashNowValue =
    googleSnapshot?.cashNowValue ??
    ebaySnapshot?.cashNowValue ??
    (fairValue != null ? toCurrency(fairValue * 0.77) : null);
  const fastSellValue =
    googleSnapshot?.fastSellValue ??
    ebaySnapshot?.fastSellValue ??
    (fairValue != null ? toCurrency(fairValue * 0.87) : null);
  const maxValueValue =
    googleSnapshot?.maxValueValue ??
    ebaySnapshot?.maxValueValue ??
    (fairValue != null ? toCurrency(fairValue * 1.03) : null);
  const storeCreditValue =
    googleSnapshot?.storeCreditValue ??
    ebaySnapshot?.storeCreditValue ??
    (fairValue != null ? toCurrency(fairValue * 0.92) : null);
  const gradeFirstValue =
    googleSnapshot?.gradeFirstValue ??
    ebaySnapshot?.gradeFirstValue ??
    (fairValue != null ? toCurrency(fairValue * 1.08) : null);
  const priceSources = mergeLivePriceSources(
    googleSnapshot?.priceSources,
    tcgplayerSnapshot?.priceSources,
    ebaySnapshot?.priceSources,
  );
  const recentActivity = buildFinanceRecentActivity(ebaySnapshot, marketProvenance);
  const notes = [
    googleSnapshot?.note,
    tcgplayerSnapshot?.note,
    ebaySnapshot?.note,
  ].filter((value): value is string => Boolean(value));
  const dataQualityNotes = [
    googleSnapshot?.dataQualityNote,
    tcgplayerSnapshot?.dataQualityNote,
    ebaySnapshot?.dataQualityNote,
  ].filter((value): value is string => Boolean(value));
  const activeSourceCount =
    Number(Boolean(googleSnapshot)) +
    Number(Boolean(tcgplayerSnapshot)) +
    Number(Boolean(ebaySnapshot));

  return {
    snapshot: {
      capturedAt:
        googleSnapshot?.capturedAt ??
        ebaySnapshot?.capturedAt ??
        new Date().toISOString(),
      marketPrice,
      fairValue,
      lowPrice,
      soldMedian: googleSnapshot?.soldMedian ?? ebaySnapshot?.soldMedian ?? marketPrice,
      activeListingFloor,
      buylistFloor,
      cashNowValue,
      fastSellValue,
      maxValueValue,
      storeCreditValue,
      gradeFirstValue,
      liquidityScore: averageNullableIntegers([
        googleSnapshot?.liquidityScore,
        ebaySnapshot?.liquidityScore,
      ]),
      confidenceScore: averageNullableIntegers([
        googleSnapshot?.confidenceScore,
        ebaySnapshot?.confidenceScore,
      ]),
      delta24h: googleSnapshot?.delta24h ?? ebaySnapshot?.delta24h ?? null,
      deltaPercent24h:
        googleSnapshot?.deltaPercent24h ?? ebaySnapshot?.deltaPercent24h ?? null,
      sourceLabel:
        marketProvenance.primarySource === "google-shopping" && activeSourceCount >= 2
          ? "Google Shopping primary + supplemental marketplace blend"
          : marketProvenance.primaryLabel,
      externalUrl:
        googleSnapshot?.externalUrl ??
        tcgplayerSnapshot?.externalUrl ??
        ebaySnapshot?.externalUrl ??
        card.externalUrl,
      priceSources,
      recentComps: recentActivity.recentComps,
      recentActivityLabel: recentActivity.recentActivityLabel,
      recentActivityDescription: recentActivity.recentActivityDescription,
      freshnessLabel: marketProvenance.freshnessLabel,
      sourceCount: priceSources.filter((source) => source.value != null).length,
      dataQualityNote: [dataQualityNotes.join(" "), marketProvenance.fallbackMessage]
        .filter(Boolean)
        .join(" "),
      note: notes.join(" "),
      psaCertification: ebaySnapshot?.psaCertification ?? null,
    } satisfies LiveFinanceMarketSnapshot,
    marketProvenance,
  };
}

async function buildFinanceProductDetail(
  card: CardCatalogSummary,
  options?: { refresh?: boolean },
): Promise<FinanceProductDetail> {
  const baseTeaser = deriveFinanceTeaser(card);
  const liveMarket = await buildMergedLiveMarketSnapshot(card, options);
  const liveSnapshot = liveMarket.snapshot;
  const marketProvenance = liveMarket.marketProvenance;
  const teaser: FinanceTeaser = liveSnapshot
    ? {
        ...baseTeaser,
        marketPrice: liveSnapshot.marketPrice ?? baseTeaser.marketPrice,
        fairValue: liveSnapshot.fairValue ?? baseTeaser.fairValue,
        delta24h: liveSnapshot.delta24h ?? baseTeaser.delta24h,
        deltaPercent24h: liveSnapshot.deltaPercent24h ?? baseTeaser.deltaPercent24h,
        liquidityScore: liveSnapshot.liquidityScore ?? baseTeaser.liquidityScore,
        confidenceScore: liveSnapshot.confidenceScore ?? baseTeaser.confidenceScore,
        cashNowValue: liveSnapshot.cashNowValue ?? baseTeaser.cashNowValue,
        fastSellValue: liveSnapshot.fastSellValue ?? baseTeaser.fastSellValue,
        maxValueValue: liveSnapshot.maxValueValue ?? baseTeaser.maxValueValue,
        storeCreditValue: liveSnapshot.storeCreditValue ?? baseTeaser.storeCreditValue,
        sourceLabel: marketProvenance.primaryLabel || liveSnapshot.sourceLabel || baseTeaser.sourceLabel,
      }
    : {
        ...baseTeaser,
        sourceLabel: marketProvenance.primaryLabel || baseTeaser.sourceLabel,
      };
  const priceSources = liveSnapshot?.priceSources ?? buildPriceSources(card, teaser);
  const routes = buildRouteEstimates(teaser, card.game).map((route) =>
    route.key === "grade-first" && liveSnapshot?.gradeFirstValue != null
      ? { ...route, netValue: liveSnapshot.gradeFirstValue }
      : route,
  );
  const fairValue = teaser.fairValue ?? teaser.marketPrice ?? 0;
  const lowPrice =
    liveSnapshot?.lowPrice ?? toCurrency((teaser.marketPrice ?? fairValue) * 0.92);
  const soldMedian = liveSnapshot?.soldMedian ?? toCurrency(fairValue * 1.02);
  const activeListingFloor =
    liveSnapshot?.activeListingFloor ?? toCurrency(fairValue * 0.96);
  const buylistFloor =
    liveSnapshot?.buylistFloor ??
    toCurrency((teaser.cashNowValue ?? fairValue * 0.7) * 0.98);
  const gradeFirstValue = toCurrency(
    liveSnapshot?.gradeFirstValue ??
      routes.find((route) => route.key === "grade-first")?.netValue ??
      fairValue,
  );
  const variantGroup = await getCardVariantGroup(card.game, card.id);
  const artVariants =
    variantGroup?.variants.map((variant) => {
      const variantTeaser = deriveFinanceTeaser(variant);
      return {
        financeProductId: variant.id,
        name: variant.name,
        imageUrl: getStableCatalogImageUrl(variant),
        versionLabel: getCardVersionLabel(variant),
        setName: variant.setName,
        setCode: variant.setCode,
        rarity: variant.rarity,
        marketPrice: variantTeaser.marketPrice,
        fairValue: variantTeaser.fairValue,
        isBaseVersion: isLikelyBaseVersion(variant),
        isSelected: variant.id === card.id,
      } satisfies FinanceArtVariant;
    }) ?? [];
  const baseCardName = variantGroup?.baseCardName ?? getCardBaseName(card.name);
  const synergyCards = await buildSynergyCards(card);
  const selectedVariantLabel = getCardVersionLabel(card);
  const recentActivity = liveSnapshot
    ? {
        recentComps: liveSnapshot.recentComps,
        recentActivityLabel: liveSnapshot.recentActivityLabel,
        recentActivityDescription: liveSnapshot.recentActivityDescription,
      }
    : buildFinanceRecentActivity(null, marketProvenance);

  const summaryCard = {
    ...card,
    name: baseCardName,
    baseName: baseCardName,
    representativeName: card.name !== baseCardName ? card.name : null,
    versionLabel: selectedVariantLabel,
    versionCount: artVariants.length || 1,
    artCount: artVariants.filter((variant) => Boolean(variant.imageUrl)).length || 1,
    isBaseVersion: isLikelyBaseVersion(card),
  } satisfies CardCatalogSummary;
  const summary = buildFinanceProductSummary(summaryCard);

  return {
    ...summary,
    marketPrice: teaser.marketPrice,
    fairValue: teaser.fairValue,
    delta24h: teaser.delta24h,
    deltaPercent24h: teaser.deltaPercent24h,
    liquidityScore: teaser.liquidityScore,
    confidenceScore: teaser.confidenceScore,
    cashNowValue: teaser.cashNowValue,
    fastSellValue: teaser.fastSellValue,
    maxValueValue: teaser.maxValueValue,
    storeCreditValue: teaser.storeCreditValue,
    sourceLabel: marketProvenance.primaryLabel,
    note:
      liveSnapshot?.note ??
      (teaser.confidenceScore != null && teaser.confidenceScore >= 75
        ? "Market-backed enough to treat as a real signal."
        : "Useful preview signal, but still waiting on richer market depth."),
    baseCardName,
    selectedVariantName: card.name,
    selectedVariantLabel,
    artVariants,
    rulingNotes: buildRulingNotes(card),
    synergyCards,
    source: card.source,
    externalUrl: liveSnapshot?.externalUrl ?? card.externalUrl,
    lowPrice,
    soldMedian,
    activeListingFloor,
    buylistFloor,
    gradeFirstValue,
    recommendation: buildRecommendation(card, teaser, routes),
    priceSources,
    routeEstimates: routes,
    history: buildHistoryPoints(card, teaser),
    recentComps: recentActivity.recentComps,
    recentActivityLabel: recentActivity.recentActivityLabel,
    recentActivityDescription: recentActivity.recentActivityDescription,
    alerts: buildAlertLines(card, teaser),
    lastUpdatedAt: liveSnapshot?.capturedAt ?? null,
    freshnessLabel: marketProvenance.freshnessLabel,
    sourceCount:
      liveSnapshot?.sourceCount ??
      priceSources.filter((source) => source.value != null).length,
    dataQualityNote:
      liveSnapshot?.dataQualityNote ||
      marketProvenance.fallbackMessage ||
      (teaser.confidenceScore != null && teaser.confidenceScore >= 75
        ? "This product has enough signal to be directionally trustworthy."
        : "This product is still leaning on modeled estimates and should be treated as directional only."),
    marketProvenance,
    psaCertification: liveSnapshot?.psaCertification ?? null,
  };
}

function buildFinanceAlertFeedItem(
  game: GameSlug,
  product: FinanceProductSummary,
  severity: FinanceSeverity,
  summary: string,
): FinanceAlertFeedItem {
  return {
    id: `${game}-${product.financeProductId}-${severity}`,
    severity,
    title: product.name,
    summary,
    href: `/${game}/finance/product/${encodeURIComponent(product.financeProductId)}`,
  };
}

function uniqueBy<T>(
  values: T[],
  getKey: (value: T) => string,
) {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const value of values) {
    const key = getKey(value);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(value);
  }

  return result;
}

async function getCachedValue<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
) {
  const redis = getRedis();
  if (!redis) {
    return compute();
  }

  const cached = await redis.get<T>(key);
  if (cached) {
    return cached;
  }

  const value = await compute();
  await redis.set(key, value, { ex: ttlSeconds });
  return value;
}

function financeHomeCacheKey(game: GameSlug) {
  return `finance:${game}:home`;
}

function financeProductCacheKey(game: GameSlug, financeProductId: string) {
  return `finance:v6-serper-resilient:${getEbayEnvironment()}:${game}:product:${financeProductId}`;
}

function financeSealedCacheKey(game: GameSlug) {
  return `finance:${game}:sealed`;
}

function financeSealedDetailCacheKey(game: GameSlug, sealedId: string) {
  return `finance:${game}:sealed:${sealedId}`;
}

function mapPrismaCardToCatalogSummary(
  game: GameSlug,
  card: {
    id: number;
    name: string;
    type: string;
    domains: string[];
    rarity: string;
    energyCost: number | null;
    power: number | null;
    might: number | null;
    hp: number | null;
    text: string | null;
    flavor: string | null;
    setCode: string | null;
    setName: string | null;
    collectorNo: string | null;
    imageUrl: string | null;
  },
): CardCatalogSummary {
  const summaryBase = {
    id: String(card.id),
    game,
    name: card.name,
    type: card.type,
    domains: card.domains,
    tags: [],
    energyCost: card.energyCost,
    power: card.power,
    might: card.might,
    hp: card.hp,
    rarity: card.rarity,
    text: card.text,
    flavor: card.flavor,
    setCode: card.setCode,
    setName: card.setName,
    collectorNo: card.collectorNo,
    imageUrl: card.imageUrl,
    language: "en",
    artist: null,
    marketPrice: null,
    source:
      game === "magic-the-gathering"
        ? "scryfall-default-cards"
        : game === "one-piece"
          ? "optcgapi-all-set-cards"
          : "riftcodex-cards",
    externalUrl: null,
  } satisfies Omit<CardCatalogSummary, "searchText">;

  return {
    ...summaryBase,
    searchText: buildCardSearchText(summaryBase),
  };
}

async function getCatalogCardById(game: GameSlug, financeProductId: string) {
  const redis = getRedis();
  if (redis) {
    const summary = await redis.get<CardCatalogSummary>(
      cardCatalogSummaryKey(game, financeProductId),
    );
    if (summary) {
      if (isCatalogCardEnglish(summary)) {
        return summary;
      }
    }
  }

  const numericId = Number.parseInt(financeProductId, 10);
  if (!Number.isFinite(numericId)) {
    return null;
  }

  const card = await prisma.card.findFirst({
    where: {
      id: numericId,
      game: GAME_TO_PRISMA[game],
    },
  });

  return card ? mapPrismaCardToCatalogSummary(game, card) : null;
}

async function getAllCatalogCards(game: GameSlug) {
  const cached = financeCatalogCache.get(game);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.cards;
  }

  const redis = getRedis();
  if (redis) {
    const ids =
      ((await redis.lrange(cardCatalogAllIdsKey(game), 0, -1)) as string[] | null) ?? [];

    if (ids.length > 0) {
      const cards: CardCatalogSummary[] = [];

      for (let index = 0; index < ids.length; index += 500) {
        const batch = ids.slice(index, index + 500);
        const pipeline = redis.pipeline();

        for (const id of batch) {
          pipeline.get(cardCatalogSummaryKey(game, id));
        }

        cards.push(
          ...((await pipeline.exec()).filter(Boolean) as CardCatalogSummary[]).filter(
            isCatalogCardEnglish,
          ),
        );
      }

      financeCatalogCache.set(game, {
        cards,
        expiresAt: Date.now() + ALL_CATALOG_CACHE_TTL_MS,
      });
      return cards;
    }
  }

  const prismaCards = await prisma.card.findMany({
    where: {
      game: GAME_TO_PRISMA[game],
    },
    orderBy: {
      name: "asc",
    },
  });

  const mapped = prismaCards.map((card) => mapPrismaCardToCatalogSummary(game, card));
  financeCatalogCache.set(game, {
    cards: mapped,
    expiresAt: Date.now() + ALL_CATALOG_CACHE_TTL_MS,
  });
  return mapped;
}

async function getCardVariantGroup(game: GameSlug, financeProductId: string) {
  const selected = await getCatalogCardById(game, financeProductId);
  if (!selected) {
    return null;
  }

  const cards = await getAllCatalogCards(game);
  const variants = uniqueBy(
    cards.filter((card) => cardsShareIdentity(selected, card)),
    (card) =>
      [
        card.game,
        compactText(card.type) ?? "",
        normalizeSearchText(card.text ?? ""),
        card.energyCost ?? "",
        card.power ?? "",
        card.might ?? "",
        card.hp ?? "",
        compactText(card.setCode ?? card.setName) ?? "",
        compactText(card.collectorNo) ?? "",
        compactText(card.rarity) ?? "",
        compactText(card.imageUrl) ?? "",
      ].join("::"),
  )
    .sort((left, right) => {
      const leftTeaser = deriveFinanceTeaser(left);
      const rightTeaser = deriveFinanceTeaser(right);
      const valueGap =
        (rightTeaser.fairValue ?? rightTeaser.marketPrice ?? 0) -
        (leftTeaser.fairValue ?? leftTeaser.marketPrice ?? 0);

      if (valueGap !== 0) {
        return valueGap;
      }

      return (left.collectorNo ?? "").localeCompare(right.collectorNo ?? "", undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });

  return {
    baseCardName: getCardBaseName(selected.name),
    selected,
    variants,
  };
}

async function getCatalogSampleCards(game: GameSlug, limit = SAMPLE_CARD_LIMIT) {
  const redis = getRedis();
  if (redis) {
    const meta = await redis.get<CardCatalogMeta>(cardCatalogMetaKey(game));
    const total = meta?.cardCount ?? 0;

    if (total > 0) {
      const positions =
        total <= limit
          ? Array.from({ length: total }, (_, index) => index)
          : Array.from({ length: limit }, (_, index) =>
              Math.floor((index * (total - 1)) / Math.max(limit - 1, 1)),
            );
      const uniquePositions = [...new Set(positions)];
      const idPipeline = redis.pipeline();

      for (const position of uniquePositions) {
        idPipeline.lindex(cardCatalogAllIdsKey(game), position);
      }

      const sampledIds = uniqueBy(
        ((await idPipeline.exec()).filter(Boolean) as string[]) ?? [],
        (value) => value,
      );

      const summaryPipeline = redis.pipeline();
      for (const id of sampledIds) {
        summaryPipeline.get(cardCatalogSummaryKey(game, id));
      }

    const sampledCards = ((await summaryPipeline.exec()).filter(Boolean) as CardCatalogSummary[]).filter(
      isCatalogCardEnglish,
    );
      if (sampledCards.length > 0) {
        return sampledCards;
      }
    }
  }

  const prismaCards = await prisma.card.findMany({
    where: {
      game: GAME_TO_PRISMA[game],
    },
    orderBy: {
      name: "asc",
    },
    take: limit,
  });

  return prismaCards.map((card) => mapPrismaCardToCatalogSummary(game, card));
}

function getCardsForCollectionPreview(cards: CardCatalogSummary[]) {
  return cards
    .filter((card) => Boolean(card.imageUrl))
    .sort((left, right) => {
      const leftTeaser = deriveFinanceTeaser(left);
      const rightTeaser = deriveFinanceTeaser(right);

      return (rightTeaser.fairValue ?? 0) - (leftTeaser.fairValue ?? 0);
    })
    .slice(0, PREVIEW_POSITION_LIMIT);
}

function buildCollectionSnapshot(cards: CardCatalogSummary[]): FinanceCollectionSnapshot {
  const previewCards = getCardsForCollectionPreview(cards);
  const positions = previewCards.map((card, index) => {
    const teaser = deriveFinanceTeaser(card);
    const quantity = (hashString(`${card.id}:${index}`) % 4) + 1;
    const averageCost =
      toCurrency(
        (teaser.fairValue ?? teaser.marketPrice ?? 0) *
          (0.82 + ((index % 5) * 0.03)),
      ) ?? 0;
    const totalValue =
      toCurrency((teaser.fairValue ?? teaser.marketPrice ?? 0) * quantity) ?? 0;
    const unrealizedGain =
      toCurrency((teaser.fairValue ?? 0) * quantity - averageCost * quantity) ?? 0;

    return {
      financeProductId: teaser.financeProductId,
      name: card.name,
      imageUrl: getStableCatalogImageUrl(card),
      setName: card.setName ?? card.setCode,
      quantity,
      marketPrice: teaser.marketPrice ?? 0,
      fairValue: teaser.fairValue ?? teaser.marketPrice ?? 0,
      delta24h: teaser.delta24h ?? 0,
      deltaPercent24h: teaser.deltaPercent24h ?? 0,
      totalValue,
      averageCost,
      unrealizedGain,
    };
  });

  const totalFairValue =
    toCurrency(positions.reduce((sum, position) => sum + position.totalValue, 0)) ?? 0;
  const totalRealizableValue = toCurrency(totalFairValue * 0.82) ?? 0;
  const sortedByDelta = [...positions].sort(
    (left, right) => right.deltaPercent24h - left.deltaPercent24h,
  );

  return {
    positions,
    totalFairValue,
    totalRealizableValue,
    topMover: sortedByDelta[0] ?? null,
    biggestSinker: sortedByDelta[sortedByDelta.length - 1] ?? null,
  };
}

function buildSealedSummaries(game: GameSlug, cards: CardCatalogSummary[]): FinanceSealedSummary[] {
  const setMap = new Map<string, CardCatalogSummary[]>();

  for (const card of cards) {
    const setLabel = getSetLabel(card);
    if (!setMap.has(setLabel)) {
      setMap.set(setLabel, []);
    }

    setMap.get(setLabel)!.push(card);
  }

  const summaries = [...setMap.entries()]
    .map(([setName, setCards], index) => {
      const teaserCards = setCards.map((card) => deriveFinanceTeaser(card));
      const topValues = teaserCards
        .map((card) => card.fairValue ?? card.marketPrice ?? 0)
        .sort((left, right) => right - left)
        .slice(0, 12);
      const topStack = topValues.reduce((sum, value) => sum + value, 0);
      const hash = hashString(`${game}:${setName}:${index}`);
      const currentPrice = toCurrency(Math.max(18, topStack * 0.18 + (hash % 24))) ?? 24;
      const fairValue = toCurrency(currentPrice * (1.04 + ((hash % 8) / 100))) ?? currentPrice;
      const ripEv = toCurrency(topStack * 0.42) ?? currentPrice;
      const deltaPercent24h = toCurrency((((hash % 1401) - 700) / 100)) ?? 0;
      const delta24h = toCurrency(fairValue * (deltaPercent24h / 100)) ?? 0;
      const liquidityScore = Math.round(clamp(44 + (hash % 42), 26, 96));
      const confidenceScore = Math.round(
        clamp(
          (game === "magic-the-gathering" ? 76 : 54) + (hash % 18),
          45,
          96,
        ),
      );
      const chaseConcentration = Math.round(clamp(32 + (hash % 55), 18, 92));

      return {
        id: slugify(`${setName}-${game}-sealed`),
        game,
        name:
          game === "magic-the-gathering"
            ? `${setName} Booster Box`
            : game === "one-piece"
              ? `${setName} Booster Box`
              : `${setName} Sealed Product`,
        setName,
        imageUrl:
          setCards.find((card) => Boolean(card.imageUrl))
            ? getStableCatalogImageUrl(
                setCards.find((card) => Boolean(card.imageUrl))!,
              )
            : null,
        currentPrice,
        fairValue,
        delta24h,
        deltaPercent24h,
        ripEv,
        liquidityScore,
        confidenceScore,
        chaseConcentration,
        recommendation:
          ripEv > fairValue
            ? "Singles EV is running hot. Rip-at-your-own-risk chaos is at least mathematically defensible."
            : "Sealed still looks cleaner than cracking it for cardboard confetti.",
      } satisfies FinanceSealedSummary;
    })
    .sort((left, right) => right.fairValue - left.fairValue)
    .slice(0, 6);

  if (summaries.length > 0) {
    return summaries;
  }

  return [
    {
      id: `${game}-sealed-fallback`,
      game,
      name: "Finance placeholder sealed product",
      setName: "Archive Preview",
      imageUrl: null,
      currentPrice: 39.99,
      fairValue: 41.75,
      delta24h: 0.55,
      deltaPercent24h: 1.33,
      ripEv: 37.2,
      liquidityScore: 52,
      confidenceScore: 48,
      chaseConcentration: 44,
      recommendation: "The page tree is ready. The deeper sealed model is still waking up.",
    },
  ];
}

export function decorateCardsWithFinance(cards: CardCatalogSummary[]) {
  return cards.map((card) => ({
    ...card,
    ...deriveFinanceTeaser(card),
  }));
}

export async function getFinanceHome(game: GameSlug): Promise<FinanceHomeData> {
  return getCachedValue(financeHomeCacheKey(game), FINANCE_HOME_TTL_SECONDS, async () => {
    const cards = await getCatalogSampleCards(game);
    const summaries = cards.map((card) => buildFinanceProductSummary(card));
    const movers = [...summaries].sort(
      (left, right) => (right.deltaPercent24h ?? 0) - (left.deltaPercent24h ?? 0),
    );
    const reversals = [...summaries].sort(
      (left, right) => (left.deltaPercent24h ?? 0) - (right.deltaPercent24h ?? 0),
    );
    const liquid = [...summaries].sort(
      (left, right) => (right.liquidityScore ?? 0) - (left.liquidityScore ?? 0),
    );
    const graded = [...summaries].sort((left, right) => {
      const leftGap = (left.maxValueValue ?? 0) - (left.fairValue ?? 0);
      const rightGap = (right.maxValueValue ?? 0) - (right.fairValue ?? 0);
      return rightGap - leftGap;
    });
    const spreads = [...summaries].sort((left, right) => {
      const leftSpread = (left.fairValue ?? 0) - (left.cashNowValue ?? 0);
      const rightSpread = (right.fairValue ?? 0) - (right.cashNowValue ?? 0);
      return rightSpread - leftSpread;
    });

    const positiveCount = summaries.filter(
      (product) => (product.deltaPercent24h ?? 0) >= 0,
    ).length;
    const averageLiquidity =
      summaries.reduce((sum, product) => sum + (product.liquidityScore ?? 0), 0) /
      Math.max(summaries.length, 1);
    const averageConfidence =
      summaries.reduce((sum, product) => sum + (product.confidenceScore ?? 0), 0) /
      Math.max(summaries.length, 1);
    const coverageLabel = getCoverageLabel(
      game,
      summaries.some((product) => (product.confidenceScore ?? 0) >= 80),
    );
    const setCounts = new Map<string, number>();
    for (const product of summaries) {
      const setLabel = product.setName ?? product.setCode ?? "Unknown set";
      setCounts.set(setLabel, (setCounts.get(setLabel) ?? 0) + 1);
    }

    const alerts = uniqueBy(
      [
        ...movers.slice(0, 3).map((product) =>
          buildFinanceAlertFeedItem(
            game,
            product,
            "high",
            `${product.name} is up ${formatFinancePercent(product.deltaPercent24h)} over the last day.`,
          ),
        ),
        ...reversals.slice(0, 2).map((product) =>
          buildFinanceAlertFeedItem(
            game,
            product,
            "medium",
            `${product.name} just took a ${formatFinancePercent(product.deltaPercent24h)} turn and might be offering a better entry.`,
          ),
        ),
        ...summaries
          .filter((product) => (product.confidenceScore ?? 100) < 55)
          .slice(0, 2)
          .map((product) =>
            buildFinanceAlertFeedItem(
              game,
              product,
              "low",
              `${product.name} is still running on thin-data mode, so browse with your eyebrows raised.`,
            ),
          ),
      ],
      (value) => value.id,
    ).slice(0, 6);

    return {
      status: {
        headline: `${positiveCount}/${summaries.length} sampled products are green right now`,
        summary:
          game === "magic-the-gathering"
            ? "MTG finance is running in the richest data mode first, with Scryfall-backed pricing and broader market confidence."
            : "This finance wing is live, but still in thin-data mode while deeper market adapters wake up.",
        coverageLabel,
        averageLiquidity: Math.round(averageLiquidity),
        averageConfidence: Math.round(averageConfidence),
      },
      hottestMovers: movers.slice(0, 6),
      biggestReversals: reversals.slice(0, 6),
      mostLiquid: liquid.slice(0, 6),
      rawVsGraded: graded.slice(0, 6),
      buylistSpreadLeaders: spreads.slice(0, 6),
      sealedOpportunities: buildSealedSummaries(game, cards),
      alerts,
      indexes: [...setCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 6)
        .map(([label, count]) => ({ label, count })),
    };
  });
}

export async function getFinanceProductDetail(
  game: GameSlug,
  financeProductId: string,
  options?: {
    refresh?: boolean;
  },
): Promise<FinanceProductDetail | null> {
  const normalizedId = decodeURIComponent(financeProductId);
  const cacheKey = financeProductCacheKey(game, normalizedId);
  const redis = getRedis();

  const computeDetail = async () => {
    const card = await getCatalogCardById(game, normalizedId);
    return card ? await buildFinanceProductDetail(card, options) : null;
  };

  if (options?.refresh) {
    const cached = redis
      ? await redis.get<FinanceProductDetail | null>(cacheKey)
      : null;
    const refreshed = await computeDetail();

    if (refreshed && redis) {
      if (
        shouldPreserveCachedFinanceProductDetail(
          cached?.marketProvenance,
          refreshed.marketProvenance,
        )
      ) {
        console.warn(
          `Preserving cached Google-backed finance detail for ${game}:${normalizedId} because the latest refresh degraded to fallback pricing after a Google refresh error.`,
        );
        return cached;
      }

      await redis.set(cacheKey, refreshed, {
        ex: getFinanceProductDetailCacheTtlSeconds(refreshed.marketProvenance),
      });
    }

    return refreshed ?? cached ?? null;
  }

  if (!redis) {
    return computeDetail();
  }

  const cached = await redis.get<FinanceProductDetail | null>(cacheKey);
  if (cached) {
    return cached;
  }

  const computed = await computeDetail();
  if (computed) {
    await redis.set(cacheKey, computed, {
      ex: getFinanceProductDetailCacheTtlSeconds(computed.marketProvenance),
    });
  }

  return computed;
}

export async function getFinanceSealedSummaries(game: GameSlug) {
  return getCachedValue(financeSealedCacheKey(game), FINANCE_SEALED_TTL_SECONDS, async () => {
    const cards = await getCatalogSampleCards(game);
    return buildSealedSummaries(game, cards);
  });
}

export async function getFinanceSealedDetail(
  game: GameSlug,
  sealedId: string,
): Promise<FinanceSealedDetail | null> {
  const normalizedId = decodeURIComponent(sealedId);

  return getCachedValue(
    financeSealedDetailCacheKey(game, normalizedId),
    FINANCE_SEALED_TTL_SECONDS,
    async () => {
      const summaries = await getFinanceSealedSummaries(game);
      const summary = summaries.find((entry) => entry.id === normalizedId);
      if (!summary) {
        return null;
      }

      const history = Array.from({ length: 10 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (9 - index) * 3);
        const wave = Math.sin(index / 1.9) * 0.04;
        return {
          date: date.toISOString().slice(0, 10),
          value: toCurrency(summary.fairValue * (1 + wave)) ?? summary.fairValue,
        };
      });

      return {
        ...summary,
        ripVariance: Math.round(clamp(summary.chaseConcentration * 0.72, 12, 88)),
        singlesEvTrend: history,
        notes: [
          "Sealed EV is still sample-weighted in this first release, so treat the trend as directional rather than sacred.",
          "Chase concentration gets meaner when a set leans too hard on one or two big hits.",
          "Liquidity here measures how easily sealed moves relative to the singles appetite around it.",
        ],
      };
    },
  );
}

export async function getCollectionFinanceSnapshot(game: GameSlug) {
  const cards = await getCatalogSampleCards(game, 120);
  return buildCollectionSnapshot(cards);
}

export function formatFinanceCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatFinancePercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatFinanceDelta(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }

  return `${value > 0 ? "+" : ""}${formatFinanceCurrency(value)}`;
}
