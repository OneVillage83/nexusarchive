import assert from "node:assert/strict";
import test from "node:test";

import type {
  GoogleProductDetailsLookupResult,
  GoogleProductDetailsSnapshot,
} from "@/lib/finance/google-market";
import type { FinanceExternalSourceRef } from "@/lib/finance/source-mappings";
import type { LiveFinanceMarketSnapshot } from "@/lib/finance/live-market";

import {
  buildFinanceMarketProvenance,
  buildFinanceRecentActivity,
  getFinanceProductDetailCacheTtlSeconds,
  shouldPreserveCachedFinanceProductDetail,
  type FinanceProductDetail,
} from "./query";

function createSourceRef(
  overrides: Partial<FinanceExternalSourceRef> = {},
): FinanceExternalSourceRef {
  return {
    id: "google-ref-1",
    game: "one-piece",
    internalCardId: "OP06-081",
    cardCatalogId: "OP06-081",
    source: "google-shopping",
    versionKey: "default",
    externalProductId: "1234567890",
    externalUrl: "https://shopping.example/absalom",
    matchedTitle: "Absalom",
    searchQuery: "Absalom OP06-081 one piece card game",
    metadata: null,
    lastDiscoveredAt: "2026-04-20T12:00:00.000Z",
    lastVerifiedAt: "2026-04-20T12:00:00.000Z",
    lastScrapedAt: "2026-04-20T12:00:00.000Z",
    createdAt: "2026-04-20T12:00:00.000Z",
    updatedAt: "2026-04-20T12:00:00.000Z",
    ...overrides,
  };
}

function createGoogleSnapshot(
  overrides: Partial<GoogleProductDetailsSnapshot> = {},
): GoogleProductDetailsSnapshot {
  return {
    capturedAt: "2026-04-20T12:30:00.000Z",
    marketPrice: 5.99,
    fairValue: 5.63,
    lowPrice: 5.49,
    soldMedian: 5.75,
    activeListingFloor: 5.49,
    buylistFloor: 4.11,
    cashNowValue: 4.23,
    fastSellValue: 4.79,
    maxValueValue: 5.79,
    storeCreditValue: 5.12,
    gradeFirstValue: 6.02,
    liquidityScore: 66,
    confidenceScore: 72,
    delta24h: null,
    deltaPercent24h: null,
    sourceLabel: "Google Shopping via Serper",
    externalUrl: "https://shopping.example/absalom",
    priceSources: [
      {
        key: "google-shopping-market",
        label: "Google Shopping Typical",
        source: "google-shopping",
        role: "primary",
        type: "market",
        value: 5.99,
        note: "Structured from Google Shopping.",
      },
    ],
    recentComps: [],
    recentActivityLabel: "Google Store Offers",
    recentActivityDescription: "Current Google store offers.",
    freshnessLabel: "Google product details cached for 12 hours",
    sourceCount: 1,
    dataQualityNote: "Mapped Google Shopping offers are active.",
    note: "Google Shopping is the primary market lane.",
    sourceRef: createSourceRef(),
    productId: "1234567890",
    productTitle: "Absalom",
    searchQuery: "Absalom OP06-081 one piece card game",
    tier: "tier2",
    mappingStatus: "stored",
    ...overrides,
  };
}

function createGoogleLookupResult(
  overrides: Partial<GoogleProductDetailsLookupResult> = {},
): GoogleProductDetailsLookupResult {
  return {
    snapshot: createGoogleSnapshot(),
    status: "active",
    lookupMode: "saved-product-id",
    tier: "tier2",
    hasStoredMapping: true,
    failureReason: null,
    snapshotState: "fresh",
    canAutoRefresh: true,
    refreshInFlight: false,
    lastGoogleScrapedAt: "2026-04-20T12:00:00.000Z",
    ...overrides,
  };
}

function createEbaySnapshot(
  overrides: Partial<LiveFinanceMarketSnapshot> = {},
): LiveFinanceMarketSnapshot {
  return {
    capturedAt: "2026-04-20T12:35:00.000Z",
    marketPrice: 5.99,
    fairValue: 5.57,
    lowPrice: 3.0,
    soldMedian: 5.99,
    activeListingFloor: 3.0,
    buylistFloor: 4.0,
    cashNowValue: 4.23,
    fastSellValue: 4.79,
    maxValueValue: 5.79,
    storeCreditValue: 5.12,
    gradeFirstValue: 6.02,
    liquidityScore: 41,
    confidenceScore: 68,
    delta24h: 0.08,
    deltaPercent24h: 3.01,
    sourceLabel: "eBay supplemental pricing",
    externalUrl: "https://ebay.example/absalom",
    priceSources: [
      {
        key: "ebay-floor",
        label: "eBay Listing Floor",
        source: "ebay",
        role: "supplemental",
        type: "market",
        value: 3,
        note: "Lowest current eBay asking price.",
      },
    ],
    recentComps: [
      {
        id: "ebay-1",
        price: 3,
        soldAt: "Live ask",
        marketplace: "eBay active",
        condition: "Near Mint",
      },
    ],
    recentActivityLabel: "Recent eBay Listings",
    recentActivityDescription: "Live eBay listings.",
    freshnessLabel: "Live eBay listings cached for 30 minutes",
    sourceCount: 1,
    dataQualityNote: "Live eBay listings are active.",
    note: "Live marketplace data is active.",
    psaCertification: null,
    ...overrides,
  };
}

function createFinanceProductDetail(
  overrides: Partial<FinanceProductDetail> = {},
): FinanceProductDetail {
  return {
    financeProductId: "OP06-081",
    marketPrice: 5.99,
    fairValue: 5.63,
    delta24h: 0.08,
    deltaPercent24h: 3.01,
    liquidityScore: 66,
    confidenceScore: 72,
    cashNowValue: 4.23,
    fastSellValue: 4.79,
    maxValueValue: 5.79,
    storeCreditValue: 5.12,
    sourceLabel: "Google Shopping via Serper",
    id: "OP06-081",
    game: "one-piece",
    name: "Absalom",
    subtitle: "Character · Wings of the Captain",
    imageUrl: null,
    setName: "Wings of the Captain",
    setCode: "OP06",
    collectorNo: "081",
    rarity: "SR",
    tags: [],
    note: "Finance preview note.",
    baseCardName: "Absalom",
    selectedVariantName: "Absalom",
    selectedVariantLabel: "Alternate Art",
    artVariants: [],
    rulingNotes: [],
    synergyCards: [],
    source: "optcgapi-all-set-cards",
    externalUrl: "https://shopping.example/absalom",
    lowPrice: 5.49,
    soldMedian: 5.75,
    activeListingFloor: 5.49,
    buylistFloor: 4.11,
    gradeFirstValue: 6.02,
    recommendation: {
      title: "Best route",
      body: "Best route body.",
    },
    priceSources: [],
    routeEstimates: [],
    history: [],
    recentComps: [],
    recentActivityLabel: "eBay Showings",
    recentActivityDescription: "Live eBay listings.",
    alerts: [],
    lastUpdatedAt: "2026-04-20T12:35:00.000Z",
    freshnessLabel: "Google product details cached for 12 hours",
    sourceCount: 1,
    dataQualityNote: "Mapped Google Shopping offers are active.",
    marketProvenance: buildFinanceMarketProvenance(
      createGoogleLookupResult(),
      null,
      createEbaySnapshot(),
    ),
    psaCertification: null,
    snapshotState: "fresh",
    canAutoRefresh: true,
    refreshInFlight: false,
    lastGoogleScrapedAt: "2026-04-20T12:00:00.000Z",
    ...overrides,
  };
}

test("buildFinanceMarketProvenance marks Google as primary when a stored mapping is active", () => {
  const provenance = buildFinanceMarketProvenance(
    createGoogleLookupResult(),
    {
      marketPrice: 5.75,
      lowPrice: 5.25,
      activeListingFloor: 5.25,
      externalUrl: "https://tcgplayer.example/absalom",
      sourceLabel: "TCGplayer listing enrichment",
      priceSources: [],
      recentComps: [],
      note: "TCGplayer listing enrichment.",
      dataQualityNote: "TCGplayer listing depth is available.",
    },
    createEbaySnapshot(),
  );

  assert.equal(provenance.primarySource, "google-shopping");
  assert.equal(provenance.lookupMode, "saved-product-id");
  assert.equal(provenance.isFallback, false);
  assert.deepEqual(provenance.supplementalSources, ["tcgplayer", "ebay"]);
  assert.equal(provenance.cacheTier, "tier2");
});

test("buildFinanceMarketProvenance keeps Google primary while a missing mapping waits on refresh", () => {
  const provenance = buildFinanceMarketProvenance(
    createGoogleLookupResult({
      snapshot: null,
      status: "missing-mapping",
      lookupMode: "fallback-only",
      hasStoredMapping: false,
      failureReason: null,
      snapshotState: "missing",
      canAutoRefresh: true,
      refreshInFlight: false,
      lastGoogleScrapedAt: null,
    }),
    null,
    createEbaySnapshot(),
  );

  assert.equal(provenance.primarySource, "google-shopping");
  assert.equal(provenance.isFallback, true);
  assert.match(provenance.fallbackMessage ?? "", /does not have a saved Google Shopping mapping/i);
});

test("buildFinanceRecentActivity keeps eBay showings visible even when Google is primary", () => {
  const provenance = buildFinanceMarketProvenance(
    createGoogleLookupResult(),
    null,
    createEbaySnapshot(),
  );
  const activity = buildFinanceRecentActivity(createEbaySnapshot(), provenance);

  assert.equal(activity.recentActivityLabel, "eBay Showings");
  assert.equal(activity.recentComps.length, 1);
  assert.match(activity.recentActivityDescription, /Google Shopping via Serper/i);
});

test("buildFinanceRecentActivity explains the missing eBay lane when Google is primary", () => {
  const provenance = buildFinanceMarketProvenance(
    createGoogleLookupResult(),
    null,
    null,
  );
  const activity = buildFinanceRecentActivity(null, provenance);

  assert.equal(activity.recentComps.length, 0);
  assert.match(activity.recentActivityDescription, /eBay showings are unavailable/i);
  assert.match(activity.recentActivityDescription, /Google Shopping via Serper/i);
});

test("getFinanceProductDetailCacheTtlSeconds caps fresh detail cache by the remaining Google freshness window", () => {
  const ttl = getFinanceProductDetailCacheTtlSeconds(
    createFinanceProductDetail({
      lastGoogleScrapedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    }),
  );

  assert.ok(ttl > 0);
  assert.ok(ttl <= 60 * 5);
});

test("getFinanceProductDetailCacheTtlSeconds keeps stale placeholder detail on a short memoization window", () => {
  const ttl = getFinanceProductDetailCacheTtlSeconds(
    createFinanceProductDetail({
      snapshotState: "stale",
      marketPrice: null,
      fairValue: null,
      cashNowValue: null,
      fastSellValue: null,
      maxValueValue: null,
      storeCreditValue: null,
    }),
  );

  assert.equal(ttl, 15);
});

test("shouldPreserveCachedFinanceProductDetail no longer keeps stale Google numbers alive", () => {
  assert.equal(
    shouldPreserveCachedFinanceProductDetail(
      buildFinanceMarketProvenance(createGoogleLookupResult(), null, createEbaySnapshot()),
      buildFinanceMarketProvenance(
        createGoogleLookupResult({
          snapshot: null,
          status: "error",
          lookupMode: "saved-product-id",
          hasStoredMapping: true,
          failureReason: "request-failed",
          snapshotState: "stale",
        }),
        null,
        createEbaySnapshot(),
      ),
    ),
    false,
  );
});
