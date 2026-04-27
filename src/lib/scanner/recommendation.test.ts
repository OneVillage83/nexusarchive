import assert from "node:assert/strict";
import test from "node:test";

import type { FinanceProductDetail } from "@/lib/finance/query";

import { buildScannerRecommendation } from "./recommendation";

function createFinanceDetail(
  overrides: Partial<FinanceProductDetail> = {},
): FinanceProductDetail {
  return {
    financeProductId: "OP01-001",
    marketPrice: 12,
    fairValue: 13,
    delta24h: 0,
    deltaPercent24h: 0,
    liquidityScore: 70,
    confidenceScore: 80,
    cashNowValue: 9,
    fastSellValue: 10,
    maxValueValue: 15,
    storeCreditValue: 11,
    sourceLabel: "Archive",
    id: "OP01-001",
    game: "one-piece",
    name: "Monkey.D.Luffy",
    subtitle: "Leader",
    imageUrl: null,
    setName: "Romance Dawn",
    setCode: "OP01",
    collectorNo: "001",
    rarity: "L",
    tags: [],
    note: "Test note",
    baseCardName: "Monkey.D.Luffy",
    selectedVariantName: "Monkey.D.Luffy",
    selectedVariantLabel: "Base printing",
    artVariants: [],
    rulingNotes: [],
    synergyCards: [],
    source: "optcgapi-all-set-cards",
    externalUrl: null,
    lowPrice: 10,
    soldMedian: 12,
    activeListingFloor: 11,
    buylistFloor: 8,
    gradeFirstValue: 22,
    recommendation: {
      title: "Test",
      body: "Test",
    },
    priceSources: [],
    routeEstimates: [
      {
        key: "grade-first",
        label: "Grade First",
        netValue: 22,
        etaLabel: "3-4 weeks",
        confidenceScore: 74,
        note: "Test",
      },
      {
        key: "fast-sell",
        label: "Fast Sell",
        netValue: 14,
        etaLabel: "2-3 days",
        confidenceScore: 80,
        note: "Test",
      },
    ],
    history: [],
    recentComps: [],
    recentActivityLabel: "Recent activity",
    recentActivityDescription: "Recent activity",
    alerts: [],
    lastUpdatedAt: "2026-04-21T00:00:00.000Z",
    freshnessLabel: "Fresh",
    sourceCount: 2,
    dataQualityNote: "Good",
    marketProvenance: {
      primarySource: "reference",
      primaryLabel: "Reference",
      lookupMode: "fallback-only",
      googleStatus: "missing-mapping",
      cacheTier: null,
      freshnessLabel: "Fresh",
      supplementalSources: [],
      isFallback: false,
      fallbackMessage: null,
    },
    psaCertification: null,
    snapshotState: "fresh",
    canAutoRefresh: false,
    refreshInFlight: false,
    lastGoogleScrapedAt: null,
    ...overrides,
  };
}

test("buildScannerRecommendation returns grade candidate when pregrade is strong and grade-first wins", () => {
  const recommendation = buildScannerRecommendation({
    qualityScore: 84,
    pregrade: {
      financeProductId: "OP01-001",
      centeringScore: 9.3,
      cornersScore: 9.2,
      edgesScore: 9.2,
      surfaceScore: 9.4,
      printQualityAdjustment: 0.1,
      nexusPregradeScore: 9.3,
      gradeBand: "Mint+",
      confidence: 0.82,
      explanations: [],
    },
    financeDetail: createFinanceDetail(),
  });

  assert.equal(recommendation?.key, "grade-candidate");
});

test("buildScannerRecommendation returns recapture-needed when quality does not clear the gate", () => {
  const recommendation = buildScannerRecommendation({
    qualityScore: 48,
    pregrade: null,
    financeDetail: createFinanceDetail(),
  });

  assert.equal(recommendation?.key, "recapture-needed");
});
