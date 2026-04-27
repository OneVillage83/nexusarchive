import {
  Game as PrismaGame,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/db";
import type { GameSlug } from "@/lib/games";
import { getRedis } from "@/lib/storage/redis";

export type SourceMappingCardIdentity = {
  game: GameSlug;
  id: string;
  collectorNo?: string | null;
};

type SourceMappingRecord = Awaited<
  ReturnType<typeof prisma.financeExternalSourceRef.findFirst>
>;

type SourceMappingRedis = NonNullable<ReturnType<typeof getRedis>>;

export type FinanceExternalSourceKey = "google-shopping" | "ebay" | "tcgplayer";

export type FinanceExternalSourceRef = {
  id: string;
  game: GameSlug;
  internalCardId: string;
  cardCatalogId: string | null;
  source: FinanceExternalSourceKey;
  versionKey: string;
  externalProductId: string;
  externalUrl: string | null;
  matchedTitle: string | null;
  searchQuery: string | null;
  metadata: Prisma.JsonValue | null;
  lastDiscoveredAt: string;
  lastVerifiedAt: string | null;
  lastScrapedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceExternalSourceRefQuery = {
  game: GameSlug;
  internalCardId: string;
  source: FinanceExternalSourceKey;
  versionKey?: string | null;
};

export type FinanceExternalSourceRefUpsertInput = {
  game: GameSlug;
  internalCardId: string;
  cardCatalogId?: string | null;
  source: FinanceExternalSourceKey;
  versionKey?: string | null;
  externalProductId: string;
  externalUrl?: string | null;
  matchedTitle?: string | null;
  searchQuery?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  lastDiscoveredAt?: Date | null;
  lastVerifiedAt?: Date | null;
  lastScrapedAt?: Date | null;
};

type SourceMappingDeps = {
  prisma?: typeof prisma;
  redis?: SourceMappingRedis;
};

const SOURCE_MAPPING_CACHE_VERSION = "v1";
const SOURCE_MAPPING_CACHE_TTL_SECONDS = 60 * 60 * 24 * 14;

const GAME_TO_PRISMA: Record<GameSlug, PrismaGame> = {
  riftbound: PrismaGame.RIFTBOUND,
  "one-piece": PrismaGame.ONE_PIECE,
  "magic-the-gathering": PrismaGame.MAGIC_THE_GATHERING,
};

type PrismaFinanceExternalSourceValue = "GOOGLE_SHOPPING" | "EBAY" | "TCGPLAYER";

const PRISMA_TO_GAME: Record<PrismaGame, GameSlug> = {
  [PrismaGame.RIFTBOUND]: "riftbound",
  [PrismaGame.ONE_PIECE]: "one-piece",
  [PrismaGame.MAGIC_THE_GATHERING]: "magic-the-gathering",
};

const SOURCE_TO_PRISMA: Record<FinanceExternalSourceKey, PrismaFinanceExternalSourceValue> = {
  "google-shopping": "GOOGLE_SHOPPING",
  ebay: "EBAY",
  tcgplayer: "TCGPLAYER",
};

const PRISMA_TO_SOURCE: Record<PrismaFinanceExternalSourceValue, FinanceExternalSourceKey> = {
  GOOGLE_SHOPPING: "google-shopping",
  EBAY: "ebay",
  TCGPLAYER: "tcgplayer",
};

function compactText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const compacted = value.replace(/\s+/g, " ").trim();
  return compacted || null;
}

function getDeps(overrides?: SourceMappingDeps) {
  return {
    prisma: overrides?.prisma ?? prisma,
    redis: overrides?.redis ?? getRedis(),
  };
}

export function normalizeSourceVersionKey(value?: string | null) {
  return compactText(value)?.toLowerCase() ?? "default";
}

export function buildSourceMappingCacheKey(query: FinanceExternalSourceRefQuery) {
  return [
    "finance",
    "source-mapping",
    SOURCE_MAPPING_CACHE_VERSION,
    query.game,
    query.source,
    normalizeSourceVersionKey(query.versionKey),
    query.internalCardId,
  ].join(":");
}

function buildResolvedSourceMappingCacheKey(
  game: GameSlug,
  source: FinanceExternalSourceKey,
  internalCardId: string,
) {
  return [
    "finance",
    "source-mapping",
    SOURCE_MAPPING_CACHE_VERSION,
    game,
    source,
    "resolved",
    internalCardId,
  ].join(":");
}

function serializeSourceMapping(
  record: NonNullable<SourceMappingRecord>,
): FinanceExternalSourceRef {
  return {
    id: record.id,
    game: PRISMA_TO_GAME[record.game],
    internalCardId: record.internalCardId,
    cardCatalogId: record.cardCatalogId,
    source: PRISMA_TO_SOURCE[record.source],
    versionKey: record.versionKey,
    externalProductId: record.externalProductId,
    externalUrl: record.externalUrl,
    matchedTitle: record.matchedTitle,
    searchQuery: record.searchQuery,
    metadata: (record.metadata as Prisma.JsonValue | null) ?? null,
    lastDiscoveredAt: record.lastDiscoveredAt.toISOString(),
    lastVerifiedAt: record.lastVerifiedAt?.toISOString() ?? null,
    lastScrapedAt: record.lastScrapedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function writeCachedSourceMapping(
  record: FinanceExternalSourceRef,
  redis: SourceMappingRedis,
) {
  const exactKey = buildSourceMappingCacheKey({
    game: record.game,
    internalCardId: record.internalCardId,
    source: record.source,
    versionKey: record.versionKey,
  });
  await redis.set(exactKey, record, { ex: SOURCE_MAPPING_CACHE_TTL_SECONDS });
  await redis.set(
    buildResolvedSourceMappingCacheKey(record.game, record.source, record.internalCardId),
    record,
    { ex: SOURCE_MAPPING_CACHE_TTL_SECONDS },
  );
}

async function readCachedSourceMapping(
  query: FinanceExternalSourceRefQuery,
  redis: SourceMappingRedis,
) {
  return redis.get<FinanceExternalSourceRef>(buildSourceMappingCacheKey(query));
}

async function readResolvedCachedSourceMapping(
  game: GameSlug,
  source: FinanceExternalSourceKey,
  internalCardId: string,
  redis: SourceMappingRedis,
) {
  return redis.get<FinanceExternalSourceRef>(
    buildResolvedSourceMappingCacheKey(game, source, internalCardId),
  );
}

function chooseResolvedSourceMapping(records: FinanceExternalSourceRef[]) {
  if (records.length === 0) {
    return null;
  }

  return [...records].sort((left, right) => {
    if (left.versionKey === "default" && right.versionKey !== "default") {
      return -1;
    }

    if (right.versionKey === "default" && left.versionKey !== "default") {
      return 1;
    }

    const leftScrapedAt = left.lastScrapedAt ?? left.lastVerifiedAt ?? left.lastDiscoveredAt;
    const rightScrapedAt =
      right.lastScrapedAt ?? right.lastVerifiedAt ?? right.lastDiscoveredAt;

    return rightScrapedAt.localeCompare(leftScrapedAt);
  })[0] ?? null;
}

export async function resolveFinanceExternalSourceRef(
  query: FinanceExternalSourceRefQuery,
  overrides?: SourceMappingDeps,
): Promise<FinanceExternalSourceRef | null> {
  const deps = getDeps(overrides);
  const versionKey = normalizeSourceVersionKey(query.versionKey);

  if (deps.redis) {
    const cachedExact = await readCachedSourceMapping(
      { ...query, versionKey },
      deps.redis,
    );
    if (cachedExact) {
      return cachedExact;
    }

    if (versionKey === "default") {
      const cachedResolved = await readResolvedCachedSourceMapping(
        query.game,
        query.source,
        query.internalCardId,
        deps.redis,
      );
      if (cachedResolved) {
        return cachedResolved;
      }
    }
  }

  const prismaSource = SOURCE_TO_PRISMA[query.source];
  if (versionKey !== "default") {
    const exact = await deps.prisma.financeExternalSourceRef.findUnique({
      where: {
        game_internalCardId_source_versionKey: {
          game: GAME_TO_PRISMA[query.game],
          internalCardId: query.internalCardId,
          source: prismaSource,
          versionKey,
        },
      },
    });

    if (!exact) {
      return null;
    }

    const serialized = serializeSourceMapping(exact);
    if (deps.redis) {
      await writeCachedSourceMapping(serialized, deps.redis);
    }
    return serialized;
  }

  const matches = await deps.prisma.financeExternalSourceRef.findMany({
    where: {
      game: GAME_TO_PRISMA[query.game],
      internalCardId: query.internalCardId,
      source: prismaSource,
    },
    orderBy: [{ lastScrapedAt: "desc" }, { updatedAt: "desc" }],
  });
  if (matches.length === 0) {
    return null;
  }

  const resolved = chooseResolvedSourceMapping(matches.map(serializeSourceMapping));
  if (!resolved) {
    return null;
  }

  if (deps.redis) {
    await writeCachedSourceMapping(resolved, deps.redis);
  }

  return resolved;
}

export function getPreferredInternalCardId(card: SourceMappingCardIdentity) {
  const normalizedId = compactText(card.id);
  const normalizedCollector = compactText(card.collectorNo);

  if (normalizedId && /[a-z-]/i.test(normalizedId)) {
    return normalizedId;
  }

  if (normalizedCollector && /[a-z-]/i.test(normalizedCollector)) {
    return normalizedCollector;
  }

  return normalizedId ?? normalizedCollector ?? null;
}

export function getInternalCardIdCandidates(card: SourceMappingCardIdentity) {
  const values = [
    getPreferredInternalCardId(card),
    compactText(card.id),
    compactText(card.collectorNo),
  ].filter((value): value is string => Boolean(value));

  return [...new Set(values)];
}

export async function resolveFinanceExternalSourceRefForCard(
  card: SourceMappingCardIdentity,
  source: FinanceExternalSourceKey,
  options?: {
    versionKey?: string | null;
  },
  overrides?: SourceMappingDeps,
) {
  for (const internalCardId of getInternalCardIdCandidates(card)) {
    const record = await resolveFinanceExternalSourceRef(
      {
        game: card.game,
        internalCardId,
        source,
        versionKey: options?.versionKey,
      },
      overrides,
    );
    if (record) {
      return record;
    }
  }

  return null;
}

export async function upsertFinanceExternalSourceRef(
  input: FinanceExternalSourceRefUpsertInput,
  overrides?: SourceMappingDeps,
) {
  const deps = getDeps(overrides);
  const versionKey = normalizeSourceVersionKey(input.versionKey);
  const now = new Date();
  const record = await deps.prisma.financeExternalSourceRef.upsert({
    where: {
      game_internalCardId_source_versionKey: {
        game: GAME_TO_PRISMA[input.game],
        internalCardId: input.internalCardId,
        source: SOURCE_TO_PRISMA[input.source],
        versionKey,
      },
    },
    update: {
      cardCatalogId: compactText(input.cardCatalogId) ?? null,
      externalProductId: input.externalProductId,
      externalUrl: compactText(input.externalUrl) ?? null,
      matchedTitle: compactText(input.matchedTitle) ?? null,
      searchQuery: compactText(input.searchQuery) ?? null,
      metadata: input.metadata ?? undefined,
      lastDiscoveredAt: input.lastDiscoveredAt ?? now,
      lastVerifiedAt:
        input.lastVerifiedAt === undefined ? undefined : input.lastVerifiedAt,
      lastScrapedAt:
        input.lastScrapedAt === undefined ? undefined : input.lastScrapedAt,
    },
    create: {
      game: GAME_TO_PRISMA[input.game],
      internalCardId: input.internalCardId,
      cardCatalogId: compactText(input.cardCatalogId) ?? null,
      source: SOURCE_TO_PRISMA[input.source],
      versionKey,
      externalProductId: input.externalProductId,
      externalUrl: compactText(input.externalUrl) ?? null,
      matchedTitle: compactText(input.matchedTitle) ?? null,
      searchQuery: compactText(input.searchQuery) ?? null,
      metadata: input.metadata ?? undefined,
      lastDiscoveredAt: input.lastDiscoveredAt ?? now,
      lastVerifiedAt:
        input.lastVerifiedAt === undefined ? undefined : input.lastVerifiedAt,
      lastScrapedAt:
        input.lastScrapedAt === undefined ? undefined : input.lastScrapedAt,
    },
  });

  const serialized = serializeSourceMapping(record);
  if (deps.redis) {
    await writeCachedSourceMapping(serialized, deps.redis);
  }
  return serialized;
}

export async function listFinanceExternalSourceRefs(
  overrides?: SourceMappingDeps,
) {
  const deps = getDeps(overrides);
  const records = await deps.prisma.financeExternalSourceRef.findMany({
    orderBy: [{ game: "asc" }, { source: "asc" }, { internalCardId: "asc" }],
  });

  return records.map(serializeSourceMapping);
}

export async function warmFinanceExternalSourceRefs(
  records: FinanceExternalSourceRef[],
  overrides?: SourceMappingDeps,
) {
  const deps = getDeps(overrides);
  if (!deps.redis) {
    return;
  }

  for (const record of records) {
    await writeCachedSourceMapping(record, deps.redis);
  }
}
