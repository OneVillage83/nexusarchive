import assert from "node:assert/strict";
import test from "node:test";

import {
  Game as PrismaGame,
} from "@prisma/client";

import prisma from "@/lib/db";
import { getRedis } from "@/lib/storage/redis";

import {
  buildSourceMappingCacheKey,
  getInternalCardIdCandidates,
  resolveFinanceExternalSourceRef,
  type FinanceExternalSourceRef,
} from "./source-mappings";

function createFinanceSourceRef(
  overrides: Partial<FinanceExternalSourceRef> = {},
): FinanceExternalSourceRef {
  return {
    id: "ref-1",
    game: "one-piece",
    internalCardId: "OP-ST05-002",
    cardCatalogId: "OP-ST05-002",
    source: "google-shopping",
    versionKey: "default",
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

function createPrismaRecord(versionKey = "default") {
  return {
    id: `ref-${versionKey}`,
    game: PrismaGame.ONE_PIECE,
    internalCardId: "OP-ST05-002",
    cardCatalogId: "OP-ST05-002",
    source: "GOOGLE_SHOPPING",
    versionKey,
    externalProductId:
      versionKey === "default" ? "4172129135583325756" : "4172129135583325757",
    externalUrl: null,
    matchedTitle: "Ain",
    searchQuery: "Ain OP-ST05-002 one piece card game",
    metadata: null,
    lastDiscoveredAt: new Date("2026-04-20T12:00:00.000Z"),
    lastVerifiedAt: new Date("2026-04-20T12:00:00.000Z"),
    lastScrapedAt:
      versionKey === "default"
        ? new Date("2026-04-20T12:00:00.000Z")
        : new Date("2026-04-19T12:00:00.000Z"),
    createdAt: new Date("2026-04-20T12:00:00.000Z"),
    updatedAt: new Date("2026-04-20T12:00:00.000Z"),
  };
}

test("resolveFinanceExternalSourceRef returns cached redis mappings before hitting prisma", async () => {
  const cached = createFinanceSourceRef();
  let prismaTouched = false;
  const redis = {
    get: async (key: string) =>
      key ===
      buildSourceMappingCacheKey({
        game: "one-piece",
        internalCardId: "OP-ST05-002",
        source: "google-shopping",
        versionKey: "default",
      })
        ? cached
        : null,
    set: async () => undefined,
  } as unknown as ReturnType<typeof getRedis>;
  const fakePrisma = {
    financeExternalSourceRef: {
      findUnique: async () => {
        prismaTouched = true;
        return null;
      },
      findMany: async () => {
        prismaTouched = true;
        return [];
      },
    },
  } as unknown as typeof prisma;

  const result = await resolveFinanceExternalSourceRef(
    {
      game: "one-piece",
      internalCardId: "OP-ST05-002",
      source: "google-shopping",
    },
    { prisma: fakePrisma, redis },
  );

  assert.deepEqual(result, cached);
  assert.equal(prismaTouched, false);
});

test("resolveFinanceExternalSourceRef prefers the default version when multiple mappings exist", async () => {
  const persistedKeys: string[] = [];
  const redis = {
    get: async () => null,
    set: async (key: string) => {
      persistedKeys.push(key);
    },
  } as unknown as ReturnType<typeof getRedis>;
  const fakePrisma = {
    financeExternalSourceRef: {
      findMany: async () => [
        createPrismaRecord("online-only"),
        createPrismaRecord("default"),
      ],
    },
  } as unknown as typeof prisma;

  const result = await resolveFinanceExternalSourceRef(
    {
      game: "one-piece",
      internalCardId: "OP-ST05-002",
      source: "google-shopping",
    },
    { prisma: fakePrisma, redis },
  );

  assert.ok(result);
  assert.equal(result?.versionKey, "default");
  assert.ok(persistedKeys.some((key) => key.includes(":resolved:")));
});

test("getInternalCardIdCandidates keeps opaque collector identifiers ahead of numeric fallbacks", () => {
  const candidates = getInternalCardIdCandidates({
    game: "one-piece",
    id: "12345",
    collectorNo: "OP-ST05-002",
  });

  assert.deepEqual(candidates, ["OP-ST05-002", "12345"]);
});
