import assert from "node:assert/strict";
import test from "node:test";

import type { CardCatalogSummary } from "@/lib/cards/catalog";
import type { FinanceExternalSourceRef } from "@/lib/finance/source-mappings";

import {
  buildDiscoveryQuery,
  getGoogleProductDetailsSnapshot,
  normalizeGoogleProductDetailsSnapshot,
} from "./google-market";

function createCard(overrides: Partial<CardCatalogSummary> = {}) {
  return {
    id: "OP-ST05-002",
    game: "one-piece",
    name: "Ain",
    type: "Character",
    domains: ["Blue"],
    tags: [],
    energyCost: 3,
    power: 5000,
    might: null,
    hp: null,
    rarity: "Common",
    text: null,
    flavor: null,
    setCode: "ST-05",
    setName: "ONE PIECE FILM edition [ST-05]",
    collectorNo: "OP-ST05-002",
    imageUrl: null,
    artist: null,
    marketPrice: 0.35,
    source: "optcgapi-all-set-cards",
    externalUrl: null,
    searchText: "ain op st05 002 one piece film edition st 05",
    ...overrides,
  } satisfies CardCatalogSummary;
}

function createSourceRef(
  overrides: Partial<FinanceExternalSourceRef> = {},
): FinanceExternalSourceRef {
  return {
    id: "ref-ain",
    game: "one-piece",
    internalCardId: "OP-ST05-002",
    cardCatalogId: "OP-ST05-002",
    source: "google-shopping",
    versionKey: "online-only",
    externalProductId: "4172129135583325756",
    externalUrl: "https://shopping.example/ain",
    matchedTitle: "Ain",
    searchQuery: "Ain OP-ST05-002 one piece card game",
    metadata: null,
    lastDiscoveredAt: "2026-04-20T12:00:00.000Z",
    lastVerifiedAt: "2026-04-20T12:00:00.000Z",
    lastScrapedAt: "2026-04-20T12:00:00.000Z",
    createdAt: "2026-04-20T12:00:00.000Z",
    updatedAt: "2026-04-20T12:00:00.000Z",
    ...overrides,
  };
}

test("buildDiscoveryQuery keeps the collector, set, and game cue in the Serper search", () => {
  const query = buildDiscoveryQuery(createCard(), "online-only");

  assert.match(query, /Ain/);
  assert.match(query, /OP-ST05-002/);
  assert.match(query, /ST-05/);
  assert.match(query, /one piece card game/i);
  assert.match(query, /online-only/i);
});

test("normalizeGoogleProductDetailsSnapshot turns Google store offers into finance metrics", () => {
  const snapshot = normalizeGoogleProductDetailsSnapshot(
    createCard(),
    createSourceRef(),
    {
      title: "Ain",
      offers: [
        { source: "Walmart - Toywiz", price: "0.35", link: "https://example.com/walmart" },
        { source: "Star City Games", price: "0.29", link: "https://example.com/scg" },
        { source: "Atlantis Games", price: "0.30", link: "https://example.com/atlantis" },
      ],
    },
    "tier2",
    "stored",
  );

  assert.equal(snapshot.productId, "4172129135583325756");
  assert.equal(snapshot.lowPrice, 0.29);
  assert.equal(snapshot.activeListingFloor, 0.29);
  assert.equal(snapshot.marketPrice, 0.3);
  assert.equal(snapshot.recentComps.length, 3);
  assert.equal(snapshot.priceSources[0]?.label, "Google Shopping Typical");
  assert.match(snapshot.freshnessLabel, /12 hours/);
});

test("getGoogleProductDetailsSnapshot uses the stored product id and skips discovery search", async () => {
  const previousKey = process.env.SERPER_API_KEY;
  process.env.SERPER_API_KEY = "test-serper-key";

  const requests: Array<Record<string, unknown>> = [];
  const fetchImpl: typeof fetch = (async (_url, init) => {
    requests.push(JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>);
    return {
      ok: true,
      json: async () => ({
        title: "Ain",
        offers: [{ source: "ToyWiz", price: "0.35", link: "https://example.com/toywiz" }],
      }),
      text: async () => "",
    } as Response;
  }) as typeof fetch;

  try {
    const snapshot = await getGoogleProductDetailsSnapshot(
      createCard(),
      { tier: "tier2" },
      {
        fetchImpl,
        resolveSourceRef: (async () => createSourceRef()) as never,
        upsertSourceRef: (async () => createSourceRef()) as never,
      },
    );

    assert.ok(snapshot);
    assert.equal(requests.length, 1);
    assert.equal(requests[0]?.productId, "4172129135583325756");
    assert.equal("q" in requests[0]!, false);
  } finally {
    process.env.SERPER_API_KEY = previousKey;
  }
});
