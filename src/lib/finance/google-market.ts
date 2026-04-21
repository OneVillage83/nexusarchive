import type { CardCatalogSummary } from "@/lib/cards/catalog";
import { compactText, normalizeSearchText } from "@/lib/cards/catalog";
import type {
  LiveFinanceComp,
  LiveFinanceMarketSnapshot,
  LiveFinancePriceSource,
} from "@/lib/finance/live-market";
import {
  getInternalCardIdCandidates,
  getPreferredInternalCardId,
  resolveFinanceExternalSourceRefForCard,
  type SourceMappingCardIdentity,
  type FinanceExternalSourceRef,
  type FinanceExternalSourceRefUpsertInput,
  upsertFinanceExternalSourceRef,
} from "@/lib/finance/source-mappings";

type GoogleShoppingSearchResult = {
  title?: string;
  source?: string;
  link?: string;
  price?: string | number;
  delivery?: string | number;
  imageUrl?: string;
  rating?: number | string;
  ratingCount?: number | string;
  offers?: string | number;
  productId?: string | number;
};

type GoogleOfferEntry = {
  title: string;
  source: string;
  link: string | null;
  price: number | null;
  shipping: number;
  totalPrice: number | null;
  rating: number | null;
  ratingCount: number | null;
  offersLabel: string | null;
};

type SerperRequestBody = Record<string, unknown>;

type SerperDeps = {
  fetchImpl?: typeof fetch;
  resolveSourceRef?: typeof resolveFinanceExternalSourceRefForCard;
  upsertSourceRef?: typeof upsertFinanceExternalSourceRef;
};

export type MarketRefreshTier = "tier1" | "tier2" | "tier3";
export type GoogleProductLookupStatus =
  | "active"
  | "discovered"
  | "missing-mapping"
  | "disabled"
  | "error";
export type GoogleProductLookupMode =
  | "saved-product-id"
  | "discovery-search"
  | "fallback-only";
export type GoogleProductLookupFailureReason =
  | "no-api-key"
  | "no-match"
  | "request-failed"
  | "detail-empty"
  | null;

export type GoogleProductDetailsSnapshot = Omit<
  LiveFinanceMarketSnapshot,
  "psaCertification"
> & {
  sourceRef: FinanceExternalSourceRef;
  productId: string;
  productTitle: string | null;
  searchQuery: string | null;
  tier: MarketRefreshTier;
  mappingStatus: "stored" | "discovered";
};

export type GoogleProductDetailsLookupResult = {
  snapshot: GoogleProductDetailsSnapshot | null;
  status: GoogleProductLookupStatus;
  lookupMode: GoogleProductLookupMode;
  tier: MarketRefreshTier | null;
  hasStoredMapping: boolean;
  failureReason: GoogleProductLookupFailureReason;
};

export type GoogleMarketConfig = {
  apiKey: string | null;
  apiBaseUrl: string;
  country: string;
  language: string;
  tier1TtlHours: number;
  tier2TtlHours: number;
  tier3TtlHours: number;
};

const DEFAULT_TIER1_TTL_HOURS = 6;
const DEFAULT_TIER2_TTL_HOURS = 12;
const DEFAULT_TIER3_TTL_HOURS = 24;
const MAX_SHOPPING_RESULTS = 12;

const BLOCKED_TITLE_FRAGMENTS = [
  "booster box",
  "booster pack",
  "starter deck",
  "double pack",
  "playmat",
  "deck box",
  "card sleeve",
  "sleeves",
  "binder",
  "lot of",
  "playset",
  "play set",
  "case break",
  "proxy",
  "custom proxy",
];

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function toCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

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

function toInteger(value: unknown) {
  const numeric = toNumber(value);
  return numeric == null ? null : Math.round(numeric);
}

function getMedian(values: number[]) {
  if (!values.length) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1]! + sorted[middle]!) / 2;
  }

  return sorted[middle] ?? null;
}

function getStandardDeviation(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function getGameCue(card: Pick<CardCatalogSummary, "game">) {
  switch (card.game) {
    case "one-piece":
      return "one piece card game";
    case "magic-the-gathering":
      return "magic the gathering";
    case "riftbound":
    default:
      return "riftbound card game";
  }
}

function buildCollectorToken(card: Pick<CardCatalogSummary, "collectorNo">) {
  const collector = compactText(card.collectorNo);
  if (!collector) {
    return null;
  }

  return collector.replace(/\s+/g, "");
}

function isBlockedShoppingTitle(title: string) {
  const normalized = normalizeSearchText(title);
  return BLOCKED_TITLE_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

export function buildDiscoveryQuery(
  card: Pick<CardCatalogSummary, "name" | "collectorNo" | "setCode" | "setName" | "game">,
  versionKey = "default",
) {
  return [
    card.name,
    buildCollectorToken(card),
    compactText(card.setCode),
    compactText(card.setName),
    versionKey !== "default" ? versionKey : null,
    getGameCue(card),
    "trading card",
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeShoppingSearchResults(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidates = [
    (payload as { shopping?: unknown[] }).shopping,
    (payload as { shoppingResults?: unknown[] }).shoppingResults,
    (payload as { results?: unknown[] }).results,
  ].find((value): value is unknown[] => Array.isArray(value));

  return (candidates ?? []).filter(
    (candidate): candidate is GoogleShoppingSearchResult =>
      Boolean(candidate) && typeof candidate === "object",
  );
}

export function scoreGoogleShoppingResult(
  card: Pick<
    CardCatalogSummary,
    "name" | "collectorNo" | "setCode" | "setName" | "game"
  >,
  result: GoogleShoppingSearchResult,
  versionKey = "default",
) {
  const title = compactText(result.title);
  if (!title || isBlockedShoppingTitle(title)) {
    return Number.NEGATIVE_INFINITY;
  }

  const normalizedTitle = normalizeSearchText(title);
  const requiredTokens = normalizeSearchText(card.name)
    .split(/\s+/)
    .filter((token) => token.length >= 2);

  if (!requiredTokens.length) {
    return Number.NEGATIVE_INFINITY;
  }

  if (requiredTokens.some((token) => !normalizedTitle.includes(token))) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 120;
  const collectorToken = buildCollectorToken(card)?.toLowerCase();
  if (collectorToken && normalizedTitle.replace(/\s+/g, "").includes(collectorToken)) {
    score += 90;
  }

  const normalizedSetCode = compactText(card.setCode)?.toLowerCase();
  if (normalizedSetCode && normalizedTitle.includes(normalizedSetCode)) {
    score += 40;
  }

  const setNameTokens = normalizeSearchText(card.setName ?? "")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
  score += setNameTokens.filter((token) => normalizedTitle.includes(token)).length * 6;

  const versionTokens = normalizeSearchText(versionKey)
    .split(/\s+/)
    .filter((token) => token.length >= 3);
  if (versionTokens.length > 0) {
    score += versionTokens.filter((token) => normalizedTitle.includes(token)).length * 10;
  }

  const price = toNumber(result.price);
  if (price != null && price > 0) {
    score += 8;
  }

  if (String(result.source ?? "").toLowerCase().includes("ebay")) {
    score -= 2;
  }

  return score;
}

function normalizeOfferEntry(entry: unknown): GoogleOfferEntry | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const record = entry as Record<string, unknown>;
  const title =
    compactText(String(record.title ?? record.name ?? record.productTitle ?? "")) ??
    "Store offer";
  const source =
    compactText(
      String(
        record.source ??
          record.store ??
          record.storeName ??
          record.seller ??
          record.sellerName ??
          record.merchant ??
          record.domain ??
          "",
      ),
    ) ?? "Google Store";
  const price =
    toNumber(record.price) ??
    toNumber(record.priceValue) ??
    toNumber(record.amount) ??
    toNumber(record.offerPrice) ??
    null;
  const shipping =
    toNumber(record.shipping) ??
    toNumber(record.delivery) ??
    toNumber(record.shippingPrice) ??
    0;
  const totalPrice = price == null ? null : toCurrency(price + shipping);

  if (price == null && totalPrice == null) {
    return null;
  }

  return {
    title,
    source,
    link:
      compactText(
        String(record.link ?? record.url ?? record.offerUrl ?? record.storeUrl ?? ""),
      ) ?? null,
    price: toCurrency(price),
    shipping: toCurrency(shipping) ?? 0,
    totalPrice,
    rating: toNumber(record.rating),
    ratingCount: toInteger(record.ratingCount),
    offersLabel: compactText(
      String(record.offers ?? record.offerCount ?? record.availableOffers ?? ""),
    ),
  };
}

function extractOfferEntries(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const rawCollections = [
    record.offers,
    record.stores,
    record.sellers,
    record.results,
    record.shopping,
    record.shoppingResults,
    (record.product as Record<string, unknown> | undefined)?.offers,
    (record.product as Record<string, unknown> | undefined)?.stores,
    (record.product as Record<string, unknown> | undefined)?.sellers,
  ].filter(Array.isArray);

  const entries = rawCollections.flatMap((collection) => collection as unknown[]);
  if (entries.length > 0) {
    return entries
      .map(normalizeOfferEntry)
      .filter((entry): entry is GoogleOfferEntry => Boolean(entry));
  }

  const singleEntry = normalizeOfferEntry(payload);
  return singleEntry ? [singleEntry] : [];
}

function deriveTierFromCard(
  card: Pick<CardCatalogSummary, "marketPrice">,
): MarketRefreshTier {
  const marketPrice = card.marketPrice ?? 0;
  if (marketPrice >= 50) {
    return "tier1";
  }

  if (marketPrice >= 10) {
    return "tier2";
  }

  return "tier3";
}

export function getGoogleMarketConfig(): GoogleMarketConfig {
  return {
    apiKey: compactText(process.env.SERPER_API_KEY),
    apiBaseUrl:
      compactText(process.env.SERPER_API_BASE_URL) ?? "https://google.serper.dev",
    country: compactText(process.env.SERPER_COUNTRY)?.toLowerCase() ?? "us",
    language: compactText(process.env.SERPER_LANGUAGE)?.toLowerCase() ?? "en",
    tier1TtlHours: parsePositiveInteger(
      process.env.FINANCE_TIER1_TTL_HOURS,
      DEFAULT_TIER1_TTL_HOURS,
    ),
    tier2TtlHours: parsePositiveInteger(
      process.env.FINANCE_TIER2_TTL_HOURS,
      DEFAULT_TIER2_TTL_HOURS,
    ),
    tier3TtlHours: parsePositiveInteger(
      process.env.FINANCE_TIER3_TTL_HOURS,
      DEFAULT_TIER3_TTL_HOURS,
    ),
  };
}

export function getMarketRefreshTtlHours(
  tier: MarketRefreshTier,
  config = getGoogleMarketConfig(),
) {
  switch (tier) {
    case "tier1":
      return config.tier1TtlHours;
    case "tier2":
      return config.tier2TtlHours;
    case "tier3":
    default:
      return config.tier3TtlHours;
  }
}

export function isMarketSnapshotFresh(
  lastScrapedAt: string | null | undefined,
  tier: MarketRefreshTier,
  now = new Date(),
  config = getGoogleMarketConfig(),
) {
  if (!lastScrapedAt) {
    return false;
  }

  const lastScraped = new Date(lastScrapedAt);
  if (Number.isNaN(lastScraped.getTime())) {
    return false;
  }

  const maxAgeMs = getMarketRefreshTtlHours(tier, config) * 60 * 60 * 1000;
  return now.getTime() - lastScraped.getTime() < maxAgeMs;
}

async function postToSerper(
  path: string,
  body: SerperRequestBody,
  config: GoogleMarketConfig,
  deps?: SerperDeps,
) {
  if (!config.apiKey) {
    return null;
  }

  const fetchImpl = deps?.fetchImpl ?? fetch;
  const response = await fetchImpl(`${config.apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "X-API-KEY": config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = compactText(await response.text());
    throw new Error(
      `Serper request failed with HTTP ${response.status}${errorBody ? `: ${errorBody.slice(0, 240)}` : ""}`,
    );
  }

  return response.json();
}

function buildSourceRefUpsertInput(
  card: CardCatalogSummary,
  sourceRef: Pick<
    FinanceExternalSourceRefUpsertInput,
    | "externalProductId"
    | "externalUrl"
    | "matchedTitle"
    | "searchQuery"
    | "versionKey"
    | "lastDiscoveredAt"
    | "lastVerifiedAt"
    | "lastScrapedAt"
    | "metadata"
  >,
): FinanceExternalSourceRefUpsertInput {
  return {
    game: card.game,
    internalCardId: getPreferredInternalCardId(card) ?? card.id,
    cardCatalogId: card.id,
    source: "google-shopping",
    ...sourceRef,
  };
}

export async function discoverGoogleProductRef(
  card: CardCatalogSummary,
  options?: {
    versionKey?: string | null;
  },
  deps?: SerperDeps,
) {
  const config = getGoogleMarketConfig();
  if (!config.apiKey) {
    return null;
  }

  const versionKey = options?.versionKey ?? "default";
  const searchQuery = buildDiscoveryQuery(card, versionKey);
  const payload = await postToSerper(
    "/shopping",
    {
      q: searchQuery,
      gl: config.country,
      hl: config.language,
      num: MAX_SHOPPING_RESULTS,
      autocorrect: false,
    },
    config,
    deps,
  );

  const bestResult = normalizeShoppingSearchResults(payload)
    .map((result) => ({
      result,
      score: scoreGoogleShoppingResult(card, result, versionKey),
    }))
    .filter((candidate) => Number.isFinite(candidate.score))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (toNumber(left.result.price) ?? Number.MAX_SAFE_INTEGER) -
        (toNumber(right.result.price) ?? Number.MAX_SAFE_INTEGER);
    })[0];

  if (!bestResult?.result.productId) {
    return null;
  }

  const upsertSourceRef = deps?.upsertSourceRef ?? upsertFinanceExternalSourceRef;

  return upsertSourceRef(
    buildSourceRefUpsertInput(card, {
      versionKey,
      externalProductId: String(bestResult.result.productId),
      externalUrl: compactText(bestResult.result.link) ?? null,
      matchedTitle: compactText(bestResult.result.title) ?? card.name,
      searchQuery,
      metadata: {
        discovery: {
          source: compactText(bestResult.result.source),
          price: compactText(String(bestResult.result.price ?? "")),
          offers: compactText(String(bestResult.result.offers ?? "")),
        },
      },
      lastDiscoveredAt: new Date(),
      lastVerifiedAt: new Date(),
    }),
  );
}

function buildGooglePriceSources(
  marketPrice: number | null,
  listingFloor: number | null,
  fairValue: number | null,
) {
  const priceSources: LiveFinancePriceSource[] = [];

  if (marketPrice != null) {
    priceSources.push({
      key: "google-shopping-market",
      label: "Google Shopping Typical",
      source: "google-shopping",
      role: "primary",
      type: "market",
      value: marketPrice,
      note: "Structured from the stored Google Shopping product detail feed via Serper.",
    });
  }

  if (listingFloor != null) {
    priceSources.push({
      key: "google-shopping-floor",
      label: "Google Store Floor",
      source: "google-shopping",
      role: "primary",
      type: "market",
      value: listingFloor,
      note: "Lowest currently visible Google Shopping store offer for the mapped product.",
    });
  }

  if (fairValue != null) {
    priceSources.push({
      key: "google-shopping-fair",
      label: "Google Fair Value",
      source: "google-shopping",
      role: "primary",
      type: "reference",
      value: fairValue,
      note: "Discounted slightly under visible asks so the archive does not treat list price as gospel.",
    });
  }

  return priceSources;
}

function buildGoogleRecentComps(offers: GoogleOfferEntry[]): LiveFinanceComp[] {
  return offers.slice(0, 5).map((offer, index) => ({
    id: `google-offer-${index}-${normalizeSearchText(offer.source)}`,
    price: offer.totalPrice ?? offer.price ?? 0,
    soldAt: "Live offer",
    marketplace: offer.source,
    condition: "Listed",
  }));
}

export function normalizeGoogleProductDetailsSnapshot(
  card: CardCatalogSummary,
  sourceRef: FinanceExternalSourceRef,
  payload: unknown,
  tier: MarketRefreshTier,
  mappingStatus: "stored" | "discovered",
) {
  const offers = extractOfferEntries(payload)
    .filter((offer) => offer.totalPrice != null || offer.price != null)
    .sort((left, right) => (left.totalPrice ?? Number.MAX_SAFE_INTEGER) - (right.totalPrice ?? Number.MAX_SAFE_INTEGER));

  const priceValues = offers
    .map((offer) => offer.totalPrice ?? offer.price)
    .filter((value): value is number => value != null && value > 0);
  const record = payload && typeof payload === "object"
    ? (payload as Record<string, unknown>)
    : null;

  const productTitle =
    compactText(
      String(
        record?.title ??
          (record?.product as Record<string, unknown> | undefined)?.title ??
          offers[0]?.title ??
          sourceRef.matchedTitle ??
          card.name,
      ),
    ) ?? card.name;
  const externalUrl =
    compactText(
      String(
        record?.link ??
          (record?.product as Record<string, unknown> | undefined)?.link ??
          offers[0]?.link ??
          sourceRef.externalUrl ??
          "",
      ),
    ) ?? sourceRef.externalUrl;

  const listingFloor = toCurrency(priceValues[0] ?? null);
  const marketPrice =
    toCurrency(
      toNumber(record?.price) ??
        toNumber((record?.product as Record<string, unknown> | undefined)?.price) ??
        getMedian(priceValues),
    ) ?? listingFloor;
  const fairValue = toCurrency((marketPrice ?? listingFloor ?? 0) * 0.94);
  const lowPrice = listingFloor;
  const soldMedian = toCurrency(getMedian(priceValues));
  const buylistFloor = toCurrency((fairValue ?? 0) * 0.72);
  const cashNowValue = toCurrency((fairValue ?? 0) * 0.77);
  const fastSellValue = toCurrency((fairValue ?? 0) * 0.87);
  const maxValueValue = toCurrency((fairValue ?? 0) * 1.03);
  const storeCreditValue = toCurrency((fairValue ?? 0) * 0.92);
  const gradeFirstValue = toCurrency((fairValue ?? 0) * 1.08);
  const stdev = priceValues.length > 1 ? getStandardDeviation(priceValues) : 0;
  const normalizedSpread =
    priceValues.length > 1 && marketPrice
      ? (Math.max(...priceValues) - Math.min(...priceValues)) / Math.max(marketPrice, 1)
      : 0;
  const liquidityScore = Math.round(
    clamp(48 + offers.length * 5 - normalizedSpread * 16, 30, 98),
  );
  const confidenceScore = Math.round(
    clamp(64 + offers.length * 4 - stdev * 10 + (mappingStatus === "stored" ? 6 : 0), 45, 98),
  );
  const ttlHours = getMarketRefreshTtlHours(tier);
  const priceSources = buildGooglePriceSources(marketPrice, listingFloor, fairValue);

  return {
    capturedAt: new Date().toISOString(),
    marketPrice,
    fairValue,
    lowPrice,
    soldMedian,
    activeListingFloor: listingFloor,
    buylistFloor,
    cashNowValue,
    fastSellValue,
    maxValueValue,
    storeCreditValue,
    gradeFirstValue,
    liquidityScore,
    confidenceScore,
    delta24h: null,
    deltaPercent24h: null,
    sourceLabel: "Google Shopping via Serper",
    externalUrl,
    priceSources,
    recentComps: buildGoogleRecentComps(offers),
    recentActivityLabel: "Google Store Offers",
    recentActivityDescription:
      "Current store offers pulled from Google Shopping using the saved product ID, not a new discovery search.",
    freshnessLabel: `Google product details cached for ${ttlHours} hours`,
    sourceCount: priceSources.filter((source) => source.value != null).length,
    dataQualityNote:
      offers.length > 0
        ? "Mapped Google Shopping offers are active and feeding the product detail view."
        : "A Google product ID is mapped, but the current detail payload did not include visible store offers.",
    note:
      mappingStatus === "stored"
        ? "Google Shopping is now the primary market lane for this product and refreshes by saved product ID."
        : "Google Shopping mapping was discovered during this request and is now stored for later refreshes.",
    sourceRef,
    productId: sourceRef.externalProductId,
    productTitle,
    searchQuery: sourceRef.searchQuery,
    tier,
    mappingStatus,
  } satisfies GoogleProductDetailsSnapshot;
}

export async function fetchGoogleProductDetails(
  sourceRef: FinanceExternalSourceRef,
  options?: {
    tier?: MarketRefreshTier;
    card?: CardCatalogSummary;
  },
  deps?: SerperDeps,
) {
  const config = getGoogleMarketConfig();
  if (!config.apiKey) {
    return null;
  }

  const query =
    sourceRef.searchQuery ??
    [sourceRef.matchedTitle, sourceRef.internalCardId].filter(Boolean).join(" ");

  const payload = await postToSerper(
    "/shopping",
    {
      q: query,
      productId: sourceRef.externalProductId,
      gl: config.country,
      hl: config.language,
      autocorrect: false,
    },
    config,
    deps,
  );

  const fallbackCard =
    options?.card ??
    ({
      id: sourceRef.cardCatalogId ?? sourceRef.internalCardId,
      game: sourceRef.game,
      name: sourceRef.matchedTitle ?? sourceRef.internalCardId,
      collectorNo: sourceRef.internalCardId,
      marketPrice: null,
      setCode: null,
      setName: null,
    } as CardCatalogSummary);

  return normalizeGoogleProductDetailsSnapshot(
    fallbackCard,
    sourceRef,
    payload,
    options?.tier ?? deriveTierFromCard(fallbackCard),
    "stored",
  );
}

export async function getGoogleProductDetailsSnapshot(
  card: CardCatalogSummary,
  options?: {
    refresh?: boolean;
    versionKey?: string | null;
    tier?: MarketRefreshTier;
  },
  deps?: SerperDeps,
) {
  const result = await getGoogleProductDetailsResult(card, options, deps);
  return result.snapshot;
}

export async function getGoogleProductDetailsResult(
  card: CardCatalogSummary,
  options?: {
    refresh?: boolean;
    versionKey?: string | null;
    tier?: MarketRefreshTier;
  },
  deps?: SerperDeps,
): Promise<GoogleProductDetailsLookupResult> {
  const config = getGoogleMarketConfig();
  const resolveSourceRef = deps?.resolveSourceRef ?? resolveFinanceExternalSourceRefForCard;
  const upsertSourceRef = deps?.upsertSourceRef ?? upsertFinanceExternalSourceRef;
  const tier = options?.tier ?? deriveTierFromCard(card);

  let sourceRef = await resolveSourceRef(card, "google-shopping", {
    versionKey: options?.versionKey,
  });
  const hadStoredMapping = Boolean(sourceRef);

  if (!config.apiKey) {
    return {
      snapshot: null,
      status: "disabled",
      lookupMode: "fallback-only",
      tier: null,
      hasStoredMapping: hadStoredMapping,
      failureReason: "no-api-key",
    };
  }

  let mappingStatus: "stored" | "discovered" = "stored";
  if (!sourceRef) {
    try {
      sourceRef = await discoverGoogleProductRef(
        card,
        { versionKey: options?.versionKey },
        deps,
      );
    } catch (error) {
      console.error(
        `Google product discovery failed for ${card.game}:${card.id}:`,
        error,
      );
      return {
        snapshot: null,
        status: "error",
        lookupMode: "fallback-only",
        tier,
        hasStoredMapping: false,
        failureReason: "request-failed",
      };
    }

    if (!sourceRef) {
      return {
        snapshot: null,
        status: "missing-mapping",
        lookupMode: "fallback-only",
        tier,
        hasStoredMapping: false,
        failureReason: "no-match",
      };
    }

    mappingStatus = "discovered";
  }

  let snapshot: GoogleProductDetailsSnapshot | null = null;
  try {
    snapshot = await fetchGoogleProductDetails(
      sourceRef,
      {
        tier,
        card,
      },
      deps,
    );
  } catch (error) {
    console.error(
      `Google product details refresh failed for ${card.game}:${card.id} using mapped product ${sourceRef.externalProductId}:`,
      error,
    );
    return {
      snapshot: null,
      status: "error",
      lookupMode: "fallback-only",
      tier,
      hasStoredMapping: hadStoredMapping || Boolean(sourceRef),
      failureReason: "request-failed",
    };
  }

  if (!snapshot) {
    console.warn(
      `Google product details refresh returned an empty payload for ${card.game}:${card.id} using mapped product ${sourceRef.externalProductId}.`,
    );
    return {
      snapshot: null,
      status: "error",
      lookupMode: "fallback-only",
      tier,
      hasStoredMapping: hadStoredMapping || Boolean(sourceRef),
      failureReason: "detail-empty",
    };
  }

  const refreshedRef = await upsertSourceRef(
    buildSourceRefUpsertInput(card, {
      versionKey: sourceRef.versionKey,
      externalProductId: sourceRef.externalProductId,
      externalUrl: snapshot.externalUrl ?? sourceRef.externalUrl,
      matchedTitle: snapshot.productTitle ?? sourceRef.matchedTitle,
      searchQuery: sourceRef.searchQuery,
      metadata: sourceRef.metadata,
      lastDiscoveredAt: new Date(sourceRef.lastDiscoveredAt),
      lastVerifiedAt: new Date(),
      lastScrapedAt: new Date(),
    }),
  );

  return {
    snapshot: {
      ...snapshot,
      sourceRef: refreshedRef,
      mappingStatus,
    } satisfies GoogleProductDetailsSnapshot,
    status: mappingStatus === "discovered" ? "discovered" : "active",
    lookupMode:
      mappingStatus === "discovered" ? "discovery-search" : "saved-product-id",
    tier,
    hasStoredMapping: hadStoredMapping,
    failureReason: null,
  } satisfies GoogleProductDetailsLookupResult;
}

export function getSourceRefLastScrapedAt(
  sourceRef: FinanceExternalSourceRef | null | undefined,
) {
  return sourceRef?.lastScrapedAt ?? sourceRef?.lastVerifiedAt ?? null;
}

export function getSourceMappingLookupHints(card: SourceMappingCardIdentity) {
  return getInternalCardIdCandidates(card);
}
