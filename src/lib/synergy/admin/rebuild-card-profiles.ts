import type { Game, Prisma } from "@prisma/client";

import prisma from "@/lib/db";
import {
  buildCardProfile,
  type CardProfileSourceCard,
} from "@/lib/synergy/engine/build-card-profile";
import type { CardIntelligenceProfile } from "@/lib/synergy/types/card-profile";

export type RebuildCardProfilesInput = {
  game: Game;
  limit?: number;
  dryRun?: boolean;
};

export type RebuildCardProfilesResult = {
  game: Game;
  dryRun: boolean;
  processed: number;
  written: number;
  profiles: CardIntelligenceProfile[];
};

export type CardProfileRepository = {
  findCardsForProfiles: (
    input: Pick<RebuildCardProfilesInput, "game" | "limit">,
  ) => Promise<CardProfileSourceCard[]>;
  upsertCardProfile: (profile: CardIntelligenceProfile) => Promise<void>;
};

function toJsonValue<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export const prismaCardProfileRepository: CardProfileRepository = {
  async findCardsForProfiles(input) {
    return prisma.card.findMany({
      where: { game: input.game },
      orderBy: { id: "asc" },
      take: input.limit,
      select: {
        id: true,
        game: true,
        name: true,
        type: true,
        domains: true,
        text: true,
        energyCost: true,
        power: true,
        might: true,
        hp: true,
      },
    });
  },

  async upsertCardProfile(profile) {
    await prisma.cardProfile.upsert({
      where: { cardId: profile.cardId },
      create: {
        cardId: profile.cardId,
        game: profile.game,
        name: profile.name,
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
        game: profile.game,
        name: profile.name,
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

export async function rebuildCardProfiles(
  input: RebuildCardProfilesInput,
  repository: CardProfileRepository = prismaCardProfileRepository,
): Promise<RebuildCardProfilesResult> {
  const dryRun = input.dryRun ?? false;
  const cards = await repository.findCardsForProfiles({
    game: input.game,
    limit: input.limit,
  });
  const profiles = cards.map(buildCardProfile);

  if (!dryRun) {
    for (const profile of profiles) {
      await repository.upsertCardProfile(profile);
    }
  }

  return {
    game: input.game,
    dryRun,
    processed: profiles.length,
    written: dryRun ? 0 : profiles.length,
    profiles,
  };
}
