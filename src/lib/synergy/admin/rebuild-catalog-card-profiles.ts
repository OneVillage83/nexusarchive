import type { CardCatalogMeta, CardCatalogSummary } from "@/lib/cards/catalog";
import { Game } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import {
  cardCatalogAllIdsKey,
  cardCatalogMetaKey,
  cardCatalogSummaryKey,
} from "@/lib/cards/catalog";
import type { GameSlug } from "@/lib/games";
import { GAME_ORDER } from "@/lib/games";
import prisma from "@/lib/db";
import { getRedis } from "@/lib/storage/redis";
import { buildCatalogCardProfile } from "@/lib/synergy/engine/build-card-profile";
import type { CatalogCardIntelligenceProfile } from "@/lib/synergy/types/card-profile";

export type CatalogCardProfileSourceSummary = {
  game: GameSlug;
  catalogConfigured: boolean;
  catalogCards: number;
  catalogImportedAt: string | null;
  catalogSource: string | null;
  prismaCards?: number;
  storedPrismaProfiles?: number;
  storedCatalogProfiles?: number;
};

export type RebuildCatalogCardProfilesInput = {
  game: GameSlug;
  limit?: number;
  dryRun?: boolean;
};

export type RebuildCatalogCardProfilesResult = {
  game: GameSlug;
  dryRun: boolean;
  source: "redis-catalog";
  catalogCards: number;
  processed: number;
  written: number;
  storageDecision: "catalog_card_profile";
  profiles: CatalogCardIntelligenceProfile[];
};

export type CatalogCardProfileRepository = {
  getCatalogMeta: (game: GameSlug) => Promise<CardCatalogMeta | null>;
  getCatalogCards: (game: GameSlug, limit?: number) => Promise<CardCatalogSummary[]>;
  upsertCatalogCardProfile: (
    profile: CatalogCardIntelligenceProfile,
  ) => Promise<void>;
};

const GAME_TO_PRISMA: Record<GameSlug, Game> = {
  riftbound: Game.RIFTBOUND,
  "one-piece": Game.ONE_PIECE,
  "magic-the-gathering": Game.MAGIC_THE_GATHERING,
};

function toJsonValue<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function getRedisCatalogCards(game: GameSlug, limit?: number) {
  const redis = getRedis();
  if (!redis) {
    return [];
  }

  const stop = limit && limit > 0 ? limit - 1 : -1;
  const ids =
    ((await redis.lrange(cardCatalogAllIdsKey(game), 0, stop)) as string[] | null) ?? [];

  if (ids.length === 0) {
    return [];
  }

  const pipeline = redis.pipeline();
  for (const id of ids) {
    pipeline.get(cardCatalogSummaryKey(game, id));
  }

  const results = (await pipeline.exec()) as unknown[];
  return results.filter((value): value is CardCatalogSummary => {
    return Boolean(value && typeof value === "object" && "id" in value && "name" in value);
  });
}

export const redisCatalogCardProfileRepository: CatalogCardProfileRepository = {
  async getCatalogMeta(game) {
    const redis = getRedis();
    if (!redis) {
      return null;
    }

    return (await redis.get<CardCatalogMeta>(cardCatalogMetaKey(game))) ?? null;
  },

  getCatalogCards: getRedisCatalogCards,

  async upsertCatalogCardProfile(profile) {
    const game = GAME_TO_PRISMA[profile.game];

    await prisma.catalogCardProfile.upsert({
      where: {
        game_catalogCardId: {
          game,
          catalogCardId: profile.catalogCardId,
        },
      },
      create: {
        game,
        catalogCardId: profile.catalogCardId,
        name: profile.name,
        source: profile.source,
        familyKey: profile.familyKey ?? null,
        tags: toJsonValue(profile.tags),
        roles: toJsonValue(profile.roles),
        triggers: toJsonValue(profile.triggers),
        produces: toJsonValue(profile.produces),
        consumes: toJsonValue(profile.consumes),
        payoffs: toJsonValue(profile.payoffs),
        constraints: toJsonValue(profile.constraints),
        risks: toJsonValue(profile.risks),
        parserVersion: profile.parserVersion,
        confidence: profile.confidence,
      },
      update: {
        name: profile.name,
        source: profile.source,
        familyKey: profile.familyKey ?? null,
        tags: toJsonValue(profile.tags),
        roles: toJsonValue(profile.roles),
        triggers: toJsonValue(profile.triggers),
        produces: toJsonValue(profile.produces),
        consumes: toJsonValue(profile.consumes),
        payoffs: toJsonValue(profile.payoffs),
        constraints: toJsonValue(profile.constraints),
        risks: toJsonValue(profile.risks),
        parserVersion: profile.parserVersion,
        confidence: profile.confidence,
      },
    });
  },
};

export async function rebuildCatalogCardProfiles(
  input: RebuildCatalogCardProfilesInput,
  repository: CatalogCardProfileRepository = redisCatalogCardProfileRepository,
): Promise<RebuildCatalogCardProfilesResult> {
  const dryRun = input.dryRun ?? false;
  const meta = await repository.getCatalogMeta(input.game);
  const cards = await repository.getCatalogCards(input.game, input.limit);
  const profiles = cards.map(buildCatalogCardProfile);

  if (!dryRun) {
    for (const profile of profiles) {
      await repository.upsertCatalogCardProfile(profile);
    }
  }

  return {
    game: input.game,
    dryRun,
    source: "redis-catalog",
    catalogCards: meta?.cardCount ?? cards.length,
    processed: profiles.length,
    written: dryRun ? 0 : profiles.length,
    storageDecision: "catalog_card_profile",
    profiles,
  };
}

export async function getCatalogCardProfileSourceSummary(
  repository: CatalogCardProfileRepository = redisCatalogCardProfileRepository,
) {
  const redisConfigured = Boolean(getRedis());
  const summaries: CatalogCardProfileSourceSummary[] = [];

  for (const game of GAME_ORDER) {
    const meta = await repository.getCatalogMeta(game);
    const prismaGame = GAME_TO_PRISMA[game];
    const [prismaCards, storedPrismaProfiles, storedCatalogProfiles] = await Promise.all([
      prisma.card.count({ where: { game: prismaGame } }),
      prisma.cardProfile.count({ where: { game: prismaGame } }),
      prisma.catalogCardProfile.count({ where: { game: prismaGame } }),
    ]);

    summaries.push({
      game,
      catalogConfigured: redisConfigured,
      catalogCards: meta?.cardCount ?? 0,
      catalogImportedAt: meta?.importedAt ?? null,
      catalogSource: meta?.source ?? null,
      prismaCards,
      storedPrismaProfiles,
      storedCatalogProfiles,
    });
  }

  return summaries;
}
