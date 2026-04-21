import type { CardCatalogSummary } from "@/lib/cards/catalog";
import { compactText, normalizeSearchText } from "@/lib/cards/catalog";
import { getRedis } from "@/lib/storage/redis";

export type LiveFinancePriceSource = {
  key: string;
  label: string;
  source: "google-shopping" | "ebay" | "tcgplayer" | "reference";
  role: "primary" | "supplemental" | "reference";
  type: "market" | "sold" | "buylist" | "reference";
  value: number | null;
  note: string;
};

export type LiveFinanceComp = {
  id: string;
  price: number;
  soldAt: string;
  marketplace: string;
  condition: string;
};

export type LiveFinancePsaCertification = {
  certNumber: string;
  title: string | null;
  grade: string | null;
  status: string | null;
  sourceUrl: string;
  note: string;
};

export type LiveFinanceMarketSnapshot = {
  capturedAt: string | null;
  marketPrice: number | null;
  fairValue: number | null;
  lowPrice: number | null;
  soldMedian: number | null;
  activeListingFloor: number | null;
  buylistFloor: number | null;
  cashNowValue: number | null;
  fastSellValue: number | null;
  maxValueValue: number | null;
  storeCreditValue: number | null;
  gradeFirstValue: number | null;
  liquidityScore: number | null;
  confidenceScore: number | null;
  delta24h: number | null;
  deltaPercent24h: number | null;
  sourceLabel: string;
  externalUrl: string | null;
  priceSources: LiveFinancePriceSource[];
  recentComps: LiveFinanceComp[];
  recentActivityLabel: string;
  recentActivityDescription: string;
  freshnessLabel: string;
  sourceCount: number;
  dataQualityNote: string;
  note: string;
  psaCertification: LiveFinancePsaCertification | null;
};

type EbaySearchResponse = {
  itemSummaries?: EbayItemSummary[];
};

type EbayItemSummary = {
  itemId?: string;
  title?: string;
  itemWebUrl?: string;
  itemAffiliateWebUrl?: string;
  image?: {
    imageUrl?: string;
  };
  thumbnailImages?: Array<{
    imageUrl?: string;
  }>;
  price?: {
    value?: string;
    currency?: string;
  };
  shippingOptions?: Array<{
    shippingCost?: {
      value?: string;
      currency?: string;
    };
  }>;
  condition?: string;
};

type EbayListing = {
  id: string;
  title: string;
  url: string | null;
  imageUrl: string | null;
  totalPrice: number;
  condition: string;
  score: number;
};

type PsaLookupResponse = {
  IsValidRequest?: boolean;
  ServerMessage?: string;
  [key: string]: unknown;
};

const LIVE_MARKET_CACHE_VERSION = "v3";
const LIVE_MARKET_TTL_SECONDS = 60 * 60 * 24 * 2;
const MAX_EBAY_RESULTS = 14;
const EBAY_OAUTH_SCOPE = "https://api.ebay.com/oauth/api_scope";

let ebayAppTokenCache:
  | {
      token: string;
      expiresAt: number;
    }
  | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
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

export function getEbayEnvironment() {
  const value = process.env.EBAY_ENVIRONMENT?.trim().toLowerCase();
  return value === "sandbox" ? "sandbox" : "production";
}

function getEbayClientId() {
  return (
    process.env.EBAY_APP_ID ??
    process.env.EBAY_CLIENT_ID ??
    process.env.EBAY_BROWSE_CLIENT_ID ??
    null
  );
}

function getEbayClientSecret() {
  return (
    process.env.EBAY_CERT_ID ??
    process.env.EBAY_CLIENT_SECRET ??
    process.env.EBAY_BROWSE_CLIENT_SECRET ??
    null
  );
}

function getEbayDirectToken() {
  return (
    process.env.EBAY_BROWSE_OAUTH_TOKEN ??
    process.env.EBAY_OAUTH_TOKEN ??
    process.env.EBAY_ACCESS_TOKEN ??
    null
  );
}

function getEbayApiBaseUrl() {
  return getEbayEnvironment() === "sandbox"
    ? "https://api.sandbox.ebay.com"
    : "https://api.ebay.com";
}

async function getEbayToken() {
  const directToken = getEbayDirectToken();
  if (directToken) {
    return directToken;
  }

  const clientId = getEbayClientId();
  const clientSecret = getEbayClientSecret();

  if (!clientId || !clientSecret) {
    return null;
  }

  if (ebayAppTokenCache && ebayAppTokenCache.expiresAt > Date.now() + 60_000) {
    return ebayAppTokenCache.token;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenUrl = `${getEbayApiBaseUrl()}/identity/v1/oauth2/token`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: EBAY_OAUTH_SCOPE,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`eBay token mint failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new Error("eBay token mint returned no access token.");
  }

  ebayAppTokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + Math.max((payload.expires_in ?? 7200) - 120, 300) * 1000,
  };

  return payload.access_token;
}

function getEbayMarketplaceId() {
  return process.env.EBAY_MARKETPLACE_ID?.trim() || "EBAY_US";
}

function getPsaAccessToken() {
  return (
    process.env.PSA_ACCESS_TOKEN ??
    process.env.PSA_API_KEY ??
    process.env.PSA_TOKEN ??
    null
  );
}

async function readCachedLiveSnapshot(key: string) {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  return redis.get<LiveFinanceMarketSnapshot>(key);
}

async function writeCachedLiveSnapshot(
  key: string,
  snapshot: LiveFinanceMarketSnapshot,
) {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  await redis.set(key, snapshot, { ex: LIVE_MARKET_TTL_SECONDS });
}

function getCatalogReferenceLabel(card: Pick<CardCatalogSummary, "game">) {
  switch (card.game) {
    case "one-piece":
      return "Imported OPTCG Reference";
    case "magic-the-gathering":
      return "Imported Scryfall Reference";
    case "riftbound":
    default:
      return "Imported RiftCodex Reference";
  }
}

function buildLiveMarketCacheKey(card: CardCatalogSummary) {
  return `finance:live-market:${LIVE_MARKET_CACHE_VERSION}:${getEbayEnvironment()}:${card.game}:${card.id}`;
}

function stampSnapshot(
  snapshot: Omit<LiveFinanceMarketSnapshot, "capturedAt">,
  capturedAt = new Date().toISOString(),
): LiveFinanceMarketSnapshot {
  return {
    capturedAt,
    ...snapshot,
  };
}

function normalizeIdentifier(value: string | null | undefined) {
  return normalizeSearchText(value ?? "").replace(/\s+/g, "");
}

function getCardGameCue(card: CardCatalogSummary) {
  switch (card.game) {
    case "one-piece":
      return "one piece card game";
    case "magic-the-gathering":
      return "magic the gathering";
    case "riftbound":
    default:
      return "riftbound";
  }
}

function buildEbaySearchCandidates(card: CardCatalogSummary) {
  const baseName = compactText(card.baseName ?? card.name) ?? card.name;
  const gameCue = getCardGameCue(card);
  const collector = compactText(card.collectorNo);
  const setCode = compactText(card.setCode);
  const setName = compactText(card.setName);

  const queries = [
    [gameCue, baseName, collector, setCode],
    [gameCue, baseName, collector],
    [gameCue, baseName, setCode],
    [gameCue, baseName, setName],
    [baseName, collector, setCode],
    [baseName, collector],
    [baseName],
  ]
    .map((parts) => parts.filter(Boolean).join(" ").trim())
    .filter(Boolean);

  return [...new Set(queries)].slice(0, 5);
}

function isAccessoryOrSealedTitle(title: string) {
  const normalized = normalizeSearchText(title);
  const blockedFragments = [
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
    "play set",
    "playset",
    "case break",
    "custom proxy",
    "proxy",
    "altar",
    "graded slab storage",
  ];

  return blockedFragments.some((fragment) => normalized.includes(fragment));
}

function scoreEbayListing(card: CardCatalogSummary, item: EbayItemSummary) {
  const title = compactText(item.title);
  if (!title || isAccessoryOrSealedTitle(title)) {
    return Number.NEGATIVE_INFINITY;
  }

  const normalizedTitle = normalizeSearchText(title);
  const baseName = compactText(card.baseName ?? card.name) ?? card.name;
  const nameTokens = normalizeSearchText(baseName)
    .split(/\s+/)
    .filter((token) => token.length >= 2);

  if (!nameTokens.length || nameTokens.some((token) => !normalizedTitle.includes(token))) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 120;

  const normalizedFullName = normalizeSearchText(baseName);
  if (normalizedTitle.includes(normalizedFullName)) {
    score += 45;
  }

  const collectorNo = normalizeIdentifier(card.collectorNo);
  if (collectorNo && normalizedTitle.includes(collectorNo)) {
    score += 80;
  }

  const setCode = normalizeIdentifier(card.setCode);
  if (setCode && normalizedTitle.includes(setCode)) {
    score += 48;
  }

  const setNameTokens = normalizeSearchText(card.setName ?? "")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
  score +=
    setNameTokens.filter((token) => normalizedTitle.includes(token)).length * 8;

  const gameCueTokens = normalizeSearchText(getCardGameCue(card))
    .split(/\s+/)
    .filter((token) => token.length >= 3);
  score +=
    gameCueTokens.filter((token) => normalizedTitle.includes(token)).length * 7;

  const typeTokens = normalizeSearchText(card.type ?? "")
    .split(/\s+/)
    .filter((token) => token.length >= 4);
  score += typeTokens.filter((token) => normalizedTitle.includes(token)).length * 4;

  if (
    normalizedTitle.includes("psa ") ||
    normalizedTitle.includes("bgs ") ||
    normalizedTitle.includes("cgc ")
  ) {
    score -= 24;
  }

  return score;
}

function normalizeEbayListing(item: EbayItemSummary): EbayListing | null {
  const price = toNumber(item.price?.value);
  if (price == null || price <= 0) {
    return null;
  }

  const shipping =
    item.shippingOptions
      ?.map((option) => toNumber(option.shippingCost?.value))
      .find((value) => value != null) ?? 0;

  return {
    id: item.itemId ?? `${item.title ?? "listing"}-${price}`,
    title: compactText(item.title) ?? "Listing",
    url: item.itemAffiliateWebUrl ?? item.itemWebUrl ?? null,
    imageUrl: item.image?.imageUrl ?? item.thumbnailImages?.[0]?.imageUrl ?? null,
    totalPrice: price + shipping,
    condition: compactText(item.condition) ?? "Listed",
    score: Number.NEGATIVE_INFINITY,
  };
}

async function searchEbayListings(
  card: CardCatalogSummary,
): Promise<EbayListing[]> {
  const token = await getEbayToken();
  if (!token) {
    return [];
  }

  const marketplaceId = getEbayMarketplaceId();
  const accepted: EbayListing[] = [];
  const seenIds = new Set<string>();

  for (const query of buildEbaySearchCandidates(card)) {
    const url = new URL(`${getEbayApiBaseUrl()}/buy/browse/v1/item_summary/search`);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(MAX_EBAY_RESULTS));

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = compactText(await response.text());
      throw new Error(
        `eBay search failed with HTTP ${response.status}${errorBody ? `: ${errorBody.slice(0, 220)}` : ""}`,
      );
    }

    const payload = (await response.json()) as EbaySearchResponse;
    const scoredListings = (payload.itemSummaries ?? [])
      .map((item) => {
        const listing = normalizeEbayListing(item);
        if (!listing) {
          return null;
        }

        const score = scoreEbayListing(card, item);
        if (!Number.isFinite(score)) {
          return null;
        }

        return {
          ...listing,
          score,
        };
      })
      .filter((listing): listing is EbayListing => Boolean(listing))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.totalPrice - right.totalPrice;
      });

    for (const listing of scoredListings) {
      if (listing.score < 120 || seenIds.has(listing.id)) {
        continue;
      }

      seenIds.add(listing.id);
      accepted.push(listing);
    }

    if (accepted.length >= 8) {
      break;
    }
  }

  return accepted.slice(0, 12);
}

function buildEbayUnavailableSnapshot(
  card: CardCatalogSummary,
  psaCertification: LiveFinancePsaCertification | null,
  errorMessage: string,
  capturedAt?: string,
): LiveFinanceMarketSnapshot {
  const isSandbox = getEbayEnvironment() === "sandbox";
  const catalogReference = toCurrency(card.marketPrice);
  const note = isSandbox
    ? "eBay sandbox browse search is wired in, but the sandbox endpoint is currently returning internal errors. Falling back to imported catalog/reference pricing for now."
    : "Live eBay pricing could not be fetched right now, so the page is temporarily leaning on imported catalog/reference pricing.";
  const priceSources: LiveFinancePriceSource[] = [
    {
      key: "ebay-status",
      label: isSandbox ? "eBay Sandbox Status" : "eBay Feed Status",
      source: "ebay",
      role: "supplemental",
      type: "reference",
      value: null,
      note: `${note} ${errorMessage}`,
    },
  ];

  if (catalogReference != null) {
    priceSources.push({
      key: "catalog-reference",
      label: getCatalogReferenceLabel(card),
      source: "reference",
      role: "reference",
      type: "reference",
      value: catalogReference,
      note: "Imported catalog-side market/reference value used as the temporary fallback.",
    });
  }

  if (psaCertification) {
    priceSources.push({
      key: "psa-cert",
      label: "PSA Certification",
      source: "reference",
      role: "reference",
      type: "reference",
      value: null,
      note:
        psaCertification.grade != null
          ? `PSA cert ${psaCertification.certNumber} verified at grade ${psaCertification.grade}.`
          : `PSA cert ${psaCertification.certNumber} verified.`,
    });
  }

  return stampSnapshot({
    marketPrice: null,
    fairValue: null,
    lowPrice: null,
    soldMedian: null,
    activeListingFloor: null,
    buylistFloor: null,
    cashNowValue: null,
    fastSellValue: null,
    maxValueValue: null,
    storeCreditValue: null,
    gradeFirstValue: null,
    liquidityScore: null,
    confidenceScore: null,
    delta24h: null,
    deltaPercent24h: null,
    sourceLabel: isSandbox ? "eBay sandbox fallback" : "eBay fallback",
    externalUrl: card.externalUrl,
    priceSources,
    recentComps: [],
    recentActivityLabel: isSandbox ? "Sandbox eBay status" : "eBay feed status",
    recentActivityDescription: note,
    freshnessLabel: isSandbox
      ? "Sandbox eBay is connected, but the Browse endpoint is erroring."
      : "Live eBay pricing is temporarily unavailable.",
    sourceCount:
      priceSources.filter((source) => source.value != null).length + (psaCertification ? 1 : 0),
    dataQualityNote: note,
    note,
    psaCertification,
  }, capturedAt);
}

function buildPsaSourceUrl(certNumber: string) {
  return `https://www.psacard.com/cert/${encodeURIComponent(certNumber)}`;
}

function extractLikelyPsaCertNumber(card: CardCatalogSummary) {
  const candidates = [
    card.collectorNo,
    card.text,
    card.tags.join(" "),
    card.flavor,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const match = String(candidate).match(/\b(?:psa|cert(?:ification)?)\D{0,8}(\d{8,10})\b/i);
    if (match?.[1]) {
      return match[1];
    }
  }

  for (const candidate of candidates) {
    const match = String(candidate).match(/\b(\d{8,10})\b/);
    if (match?.[0]) {
      return match[0];
    }
  }

  return null;
}

function readFirstStringValue(
  value: unknown,
  candidateKeys: string[],
): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  for (const key of candidateKeys) {
    const candidate = (value as Record<string, unknown>)[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

async function lookupPsaCertification(
  card: CardCatalogSummary,
): Promise<LiveFinancePsaCertification | null> {
  const token = getPsaAccessToken();
  const certNumber = extractLikelyPsaCertNumber(card);

  if (!token || !certNumber) {
    return null;
  }

  const response = await fetch(
    `https://api.psacard.com/publicapi/cert/GetByCertNumber/${encodeURIComponent(certNumber)}`,
    {
      headers: {
        Authorization: `bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as PsaLookupResponse;
  if (payload.IsValidRequest === false || /no data/i.test(payload.ServerMessage ?? "")) {
    return null;
  }

  const title =
    readFirstStringValue(payload, [
      "Description",
      "SpecDescription",
      "Subject",
      "ItemDescription",
      "CardDescription",
      "Brand",
    ]) ??
    readFirstStringValue(payload.Cert as Record<string, unknown>, [
      "Description",
      "SpecDescription",
      "Subject",
      "ItemDescription",
      "CardDescription",
      "Brand",
    ]);

  const grade =
    readFirstStringValue(payload, ["Grade", "CardGrade", "NumericGrade"]) ??
    readFirstStringValue(payload.Cert as Record<string, unknown>, [
      "Grade",
      "CardGrade",
      "NumericGrade",
    ]);

  const status =
    readFirstStringValue(payload, ["ServerMessage", "Status"]) ??
    readFirstStringValue(payload.Cert as Record<string, unknown>, [
      "Status",
      "ServerMessage",
    ]);

  return {
    certNumber,
    title,
    grade,
    status,
    sourceUrl: buildPsaSourceUrl(certNumber),
    note: "Verified through PSA cert lookup.",
  };
}

function getLiveSourceLabel(card: CardCatalogSummary) {
  switch (card.game) {
    case "one-piece":
      return "eBay + archive market blend";
    case "magic-the-gathering":
      return "eBay + Scryfall market blend";
    case "riftbound":
    default:
      return "eBay live market blend";
  }
}

function buildLiveSnapshotFromListings(
  card: CardCatalogSummary,
  listings: EbayListing[],
  psaCertification: LiveFinancePsaCertification | null,
  capturedAt?: string,
): LiveFinanceMarketSnapshot | null {
  if (!listings.length) {
    return null;
  }

  const prices = listings.map((listing) => listing.totalPrice).filter((value) => value > 0);
  if (!prices.length) {
    return null;
  }

  const listingFloor = toCurrency(Math.min(...prices));
  const medianAsk = toCurrency(getMedian(prices));
  const averageAsk = toCurrency(
    prices.reduce((sum, value) => sum + value, 0) / prices.length,
  );
  const marketPrice = medianAsk ?? averageAsk ?? listingFloor;
  const fairValue = toCurrency((marketPrice ?? 0) * 0.93);
  const lowPrice = listingFloor;
  const soldMedian = medianAsk;
  const buylistFloor = toCurrency((fairValue ?? 0) * 0.71);
  const cashNowValue = toCurrency((fairValue ?? 0) * 0.76);
  const fastSellValue = toCurrency((fairValue ?? 0) * 0.86);
  const maxValueValue = toCurrency((fairValue ?? 0) * 1.04);
  const storeCreditValue = toCurrency((fairValue ?? 0) * 0.92);
  const gradeFirstValue = toCurrency(
    (fairValue ?? 0) * (card.game === "magic-the-gathering" ? 1.14 : 1.08),
  );

  const spread = (Math.max(...prices) - Math.min(...prices)) / Math.max(medianAsk ?? 1, 1);
  const stdev = getStandardDeviation(prices) / Math.max(medianAsk ?? 1, 1);
  const liquidityScore = Math.round(
    clamp(48 + listings.length * 4 - spread * 22, 26, 98),
  );
  const confidenceScore = Math.round(
    clamp(56 + listings.length * 3 - stdev * 38 + (psaCertification ? 4 : 0), 38, 97),
  );

  const priceSources: LiveFinancePriceSource[] = [
    {
      key: "ebay-floor",
      label: "eBay Listing Floor",
      source: "ebay",
      role: "supplemental",
      type: "market",
      value: listingFloor,
      note: "Lowest current eBay asking price from the matched single-card listings.",
    },
    {
      key: "ebay-median-ask",
      label: "eBay Median Ask",
      source: "ebay",
      role: "supplemental",
      type: "market",
      value: medianAsk,
      note: "Median asking price across the strongest live eBay matches.",
    },
  ];

  if (card.marketPrice != null) {
    priceSources.push({
      key: "catalog-reference",
      label: getCatalogReferenceLabel(card),
      source: "reference",
      role: "reference",
      type: "reference",
      value: toCurrency(card.marketPrice),
      note: "Imported catalog-side reference price retained as a second opinion.",
    });
  }

  priceSources.push({
    key: "nexus-fair",
    label: "Nexus Fair Value",
    source: "reference",
    role: "reference",
    type: "reference",
    value: fairValue,
    note: "Weighted slightly under asking prices so the archive stops acting like list price is law.",
  });

  if (psaCertification) {
    priceSources.push({
      key: "psa-cert",
      label: "PSA Certification",
      source: "reference",
      role: "reference",
      type: "reference",
      value: null,
      note:
        psaCertification.grade != null
          ? `PSA cert ${psaCertification.certNumber} verified at grade ${psaCertification.grade}.`
          : `PSA cert ${psaCertification.certNumber} verified.`,
    });
  }

  const recentComps: LiveFinanceComp[] = listings.slice(0, 5).map((listing) => ({
    id: listing.id,
    price: listing.totalPrice,
    soldAt: "Live ask",
    marketplace: "eBay active",
    condition: listing.condition,
  }));

  return stampSnapshot({
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
    sourceLabel: getLiveSourceLabel(card),
    externalUrl: listings[0]?.url ?? card.externalUrl,
    priceSources,
    recentComps,
    recentActivityLabel: "Recent eBay Listings",
    recentActivityDescription:
      "Live matched eBay listings for this exact card lane. Useful as current market signal, not confirmed sold history.",
    freshnessLabel: "Live eBay listings cached for 30 minutes",
    sourceCount:
      priceSources.filter((source) => source.value != null).length + (psaCertification ? 1 : 0),
    dataQualityNote:
      "Live eBay listings are active as the supplemental showings lane. Treat them as current market signal, not a confirmed sold-comp feed.",
    note: "Live marketplace data is active for this product detail view.",
    psaCertification,
  }, capturedAt);
}

export async function getLiveFinanceMarketSnapshot(
  card: CardCatalogSummary,
  options?: {
    refresh?: boolean;
  },
): Promise<LiveFinanceMarketSnapshot | null> {
  const cacheKey = buildLiveMarketCacheKey(card);
  const cachedSnapshot = await readCachedLiveSnapshot(cacheKey);
  const hasEbay = Boolean(getEbayDirectToken() || (getEbayClientId() && getEbayClientSecret()));
  const hasPsa = Boolean(getPsaAccessToken());
  const refresh = Boolean(options?.refresh);

  if (!refresh && cachedSnapshot) {
    return cachedSnapshot;
  }

  if (!hasEbay && !hasPsa) {
    return cachedSnapshot;
  }

  let ebayErrorMessage: string | null = null;
  const capturedAt = new Date().toISOString();
  const [listings, psaCertification] = await Promise.all([
    hasEbay
      ? searchEbayListings(card).catch((error) => {
          ebayErrorMessage = error instanceof Error ? error.message : String(error);
          console.error(
            `Live eBay lookup failed for ${card.game}:${card.id}:`,
            ebayErrorMessage,
          );
          return [];
        })
      : Promise.resolve([]),
    hasPsa ? lookupPsaCertification(card) : Promise.resolve(null),
  ]);

  const liveSnapshot = buildLiveSnapshotFromListings(
    card,
    listings,
    psaCertification,
    capturedAt,
  );
  if (liveSnapshot) {
    await writeCachedLiveSnapshot(cacheKey, liveSnapshot);
    return liveSnapshot;
  }

  if (ebayErrorMessage) {
    if (cachedSnapshot) {
      return cachedSnapshot;
    }

    const unavailableSnapshot = buildEbayUnavailableSnapshot(
      card,
      psaCertification,
      ebayErrorMessage,
      capturedAt,
    );
    await writeCachedLiveSnapshot(cacheKey, unavailableSnapshot);
    return unavailableSnapshot;
  }

  return cachedSnapshot;
}
