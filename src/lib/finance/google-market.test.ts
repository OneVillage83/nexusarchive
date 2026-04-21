import assert from "node:assert/strict";
import test from "node:test";

import type { CardCatalogSummary } from "@/lib/cards/catalog";
import type { FinanceExternalSourceRef } from "@/lib/finance/source-mappings";

import {
  buildDiscoveryQuery,
  getGoogleProductDetailsResult,
  normalizeGoogleProductDetailsSnapshot,
  refreshGoogleProductDetailsResult,
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

function createStoredGoogleSnapshotPayload() {
  const snapshot = normalizeGoogleProductDetailsSnapshot(
    createCard(),
    createSourceRef({ metadata: null }),
    {
      title: "Ain",
      offers: [
        { source: "ToyWiz", price: "0.35", link: "https://example.com/toywiz" },
        { source: "Star City Games", price: "0.29", link: "https://example.com/scg" },
      ],
    },
    "tier2",
    "stored",
  );
  const { sourceRef: _sourceRef, ...stored } = snapshot;
  return {
    ...stored,
    schemaVersion: 1,
  };
}

class FakeRedis {
  private store = new Map<string, unknown>();

  async get<T>(key: string) {
    return (this.store.get(key) as T | undefined) ?? null;
  }

  async set(
    key: string,
    value: unknown,
    options?: { ex?: number; nx?: boolean },
  ) {
    if (options?.nx && this.store.has(key)) {
      return null;
    }

    this.store.set(key, value);
    return "OK";
  }

  async del(key: string) {
    this.store.delete(key);
    return 1;
  }
}

function waitForMicrotask() {
  return new Promise((resolve) => queueMicrotask(resolve));
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

test("getGoogleProductDetailsResult returns a fresh stored snapshot without spending Serper credits", async () => {
  const previousKey = process.env.SERPER_API_KEY;
  process.env.SERPER_API_KEY = "test-serper-key";

  const requests: Array<Record<string, unknown>> = [];
  const fetchImpl: typeof fetch = (async (_url, init) => {
    requests.push(JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>);
    throw new Error("live fetch should not run for a fresh stored snapshot");
  }) as typeof fetch;

  try {
    const result = await getGoogleProductDetailsResult(
      createCard(),
      { tier: "tier2" },
      {
        fetchImpl,
        now: new Date("2026-04-21T00:00:00.000Z"),
        resolveSourceRef: (async () =>
          createSourceRef({
            metadata: {
              googleSnapshot: createStoredGoogleSnapshotPayload(),
            },
            lastScrapedAt: "2026-04-20T22:00:00.000Z",
          })) as never,
      },
    );

    assert.ok(result.snapshot);
    assert.equal(result.snapshotState, "fresh");
    assert.equal(result.status, "active");
    assert.equal(result.lookupMode, "saved-product-id");
    assert.equal(requests.length, 0);
  } finally {
    process.env.SERPER_API_KEY = previousKey;
  }
});

test("getGoogleProductDetailsResult returns a stale placeholder and does not call Serper", async () => {
  const previousKey = process.env.SERPER_API_KEY;
  process.env.SERPER_API_KEY = "test-serper-key";

  const requests: Array<Record<string, unknown>> = [];
  const fetchImpl: typeof fetch = (async (_url, init) => {
    requests.push(JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>);
    throw new Error("read path should not call Serper for stale snapshots");
  }) as typeof fetch;

  try {
    const result = await getGoogleProductDetailsResult(
      createCard(),
      { tier: "tier2" },
      {
        fetchImpl,
        allowLiveSpend: true,
        resolveSourceRef: (async () =>
          createSourceRef({
            metadata: {
              googleSnapshot: createStoredGoogleSnapshotPayload(),
            },
            lastScrapedAt: "2026-04-19T12:00:00.000Z",
          })) as never,
      },
    );

    assert.equal(result.snapshot, null);
    assert.equal(result.snapshotState, "stale");
    assert.equal(result.lookupMode, "saved-product-id");
    assert.equal(result.hasStoredMapping, true);
    assert.equal(requests.length, 0);
  } finally {
    process.env.SERPER_API_KEY = previousKey;
  }
});

test("refreshGoogleProductDetailsResult discovers a product id once and then fetches product details once", async () => {
  const previousKey = process.env.SERPER_API_KEY;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.SERPER_API_KEY = "test-serper-key";
  process.env.NODE_ENV = "production";
  process.env.VERCEL_ENV = "production";

  const requests: Array<Record<string, unknown>> = [];
  let currentSourceRef: FinanceExternalSourceRef | null = null;
  const fetchImpl: typeof fetch = (async (_url, init) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    requests.push(body);

    if (!("productId" in body)) {
      return {
        ok: true,
        json: async () => ({
          shopping: [
            {
              title: "Ain",
              source: "ToyWiz",
              link: "https://example.com/toywiz",
              price: "0.35",
              productId: "4172129135583325756",
            },
          ],
        }),
        text: async () => "",
      } as Response;
    }

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
    const result = await refreshGoogleProductDetailsResult(
      createCard(),
      { tier: "tier2" },
      {
        fetchImpl,
        resolveSourceRef: (async () => currentSourceRef) as never,
        upsertSourceRef: (async (input) => {
          currentSourceRef = createSourceRef({
            versionKey: input.versionKey ?? "default",
            externalProductId: input.externalProductId,
            externalUrl: input.externalUrl ?? null,
            matchedTitle: input.matchedTitle ?? null,
            searchQuery: input.searchQuery ?? null,
            metadata: input.metadata ?? null,
            lastDiscoveredAt:
              input.lastDiscoveredAt?.toISOString() ??
              "2026-04-20T12:00:00.000Z",
            lastVerifiedAt:
              input.lastVerifiedAt?.toISOString() ??
              "2026-04-20T12:00:00.000Z",
            lastScrapedAt: input.lastScrapedAt?.toISOString() ?? null,
          });
          return currentSourceRef;
        }) as never,
      },
    );

    assert.ok(result.snapshot);
    assert.equal(result.snapshotState, "fresh");
    assert.equal(result.status, "discovered");
    assert.equal(result.lookupMode, "discovery-search");
    assert.equal(requests.length, 2);
    assert.equal(requests[0]?.productId, undefined);
    assert.equal(requests[1]?.productId, "4172129135583325756");
  } finally {
    process.env.SERPER_API_KEY = previousKey;
    process.env.NODE_ENV = previousNodeEnv;
    process.env.VERCEL_ENV = previousVercelEnv;
  }
});

test("refreshGoogleProductDetailsResult dedupes concurrent refreshes with a Redis lock", async () => {
  const previousKey = process.env.SERPER_API_KEY;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.SERPER_API_KEY = "test-serper-key";
  process.env.NODE_ENV = "production";
  process.env.VERCEL_ENV = "production";

  const redis = new FakeRedis();
  const requests: Array<Record<string, unknown>> = [];
  let releaseFetch: (() => void) | null = null;
  const fetchGate = new Promise<void>((resolve) => {
    releaseFetch = resolve;
  });
  const fetchImpl: typeof fetch = (async (_url, init) => {
    requests.push(JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>);
    await fetchGate;
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
    const deps = {
      redis,
      fetchImpl,
      allowLiveSpend: true,
      resolveSourceRef: (async () =>
        createSourceRef({
          metadata: {
            googleSnapshot: createStoredGoogleSnapshotPayload(),
          },
          lastScrapedAt: "2026-04-19T12:00:00.000Z",
        })) as never,
      upsertSourceRef: (async (input) =>
        createSourceRef({
          metadata: input.metadata ?? null,
          lastScrapedAt: input.lastScrapedAt?.toISOString() ?? null,
          lastVerifiedAt: input.lastVerifiedAt?.toISOString() ?? null,
        })) as never,
    };

    const first = refreshGoogleProductDetailsResult(createCard(), { tier: "tier2" }, deps);
    await waitForMicrotask();
    const second = await refreshGoogleProductDetailsResult(
      createCard(),
      { tier: "tier2" },
      deps,
    );

    assert.equal(second.snapshot, null);
    assert.equal(second.snapshotState, "refreshing");
    assert.equal(requests.length, 1);

    releaseFetch?.();
    const firstResult = await first;
    assert.equal(firstResult.snapshotState, "fresh");
  } finally {
    process.env.SERPER_API_KEY = previousKey;
    process.env.NODE_ENV = previousNodeEnv;
    process.env.VERCEL_ENV = previousVercelEnv;
  }
});

test("refreshGoogleProductDetailsResult stays preview-readonly and never spends in preview or development", async () => {
  const previousKey = process.env.SERPER_API_KEY;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.SERPER_API_KEY = "test-serper-key";
  process.env.NODE_ENV = "development";
  process.env.VERCEL_ENV = "preview";

  const requests: Array<Record<string, unknown>> = [];
  const fetchImpl: typeof fetch = (async (_url, init) => {
    requests.push(JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>);
    throw new Error("preview mode should not spend live Serper credits");
  }) as typeof fetch;

  try {
    const result = await refreshGoogleProductDetailsResult(
      createCard(),
      { tier: "tier2" },
      {
        fetchImpl,
        allowLiveSpend: false,
        resolveSourceRef: (async () => null) as never,
      },
    );

    assert.equal(result.snapshot, null);
    assert.equal(result.snapshotState, "preview-readonly");
    assert.equal(result.canAutoRefresh, false);
    assert.equal(requests.length, 0);
  } finally {
    process.env.SERPER_API_KEY = previousKey;
    process.env.NODE_ENV = previousNodeEnv;
    process.env.VERCEL_ENV = previousVercelEnv;
  }
});
