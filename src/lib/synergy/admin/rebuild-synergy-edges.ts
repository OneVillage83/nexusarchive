import { Game } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import type { GameSlug } from "@/lib/games";
import prisma from "@/lib/db";
import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import {
  DEFAULT_MAX_EDGES_PER_PRIMARY,
  DEFAULT_SYNERGY_EDGE_MIN_SCORE,
  findSynergyEdges,
} from "@/lib/synergy/engine/find-synergy-edges";
import type {
  ConstraintProfile,
  PayoffProfile,
  ResourceProfile,
  TriggerProfile,
} from "@/lib/synergy/types/card-profile";
import type {
  SynergyEdgeProfile,
  SynergyEdgeResult,
  SynergyEdgeSource,
} from "@/lib/synergy/types/synergy-edge";

export type RebuildSynergyEdgesInput = {
  game: GameSlug;
  source?: SynergyEdgeSource;
  dryRun?: boolean;
  limit?: number;
  minScore?: number;
  maxEdgesPerPrimary?: number;
};

export type RebuildSynergyEdgesResult = {
  game: GameSlug;
  source: SynergyEdgeSource;
  dryRun: boolean;
  profilesLoaded: number;
  edgesGenerated: number;
  written: number;
  minScore: number;
  maxEdgesPerPrimary: number;
  edges: SynergyEdgeResult[];
};

export type SynergyEdgeRepository = {
  findCatalogProfiles: (
    input: Pick<RebuildSynergyEdgesInput, "game" | "limit">,
  ) => Promise<SynergyEdgeProfile[]>;
  findPrismaProfiles: (
    input: Pick<RebuildSynergyEdgesInput, "game" | "limit">,
  ) => Promise<SynergyEdgeProfile[]>;
  replaceSynergyEdges: (input: {
    game: Game;
    source: SynergyEdgeSource;
    edges: SynergyEdgeResult[];
  }) => Promise<number>;
};

const GAME_TO_PRISMA: Record<GameSlug, Game> = {
  riftbound: Game.RIFTBOUND,
  "one-piece": Game.ONE_PIECE,
  "magic-the-gathering": Game.MAGIC_THE_GATHERING,
};

const PRISMA_TO_GAME: Record<Game, GameSlug> = {
  [Game.RIFTBOUND]: "riftbound",
  [Game.ONE_PIECE]: "one-piece",
  [Game.MAGIC_THE_GATHERING]: "magic-the-gathering",
};

function asArray<T>(value: Prisma.JsonValue) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toJsonValue<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function dedupeProfilesByIdentity(profiles: SynergyEdgeProfile[]) {
  const byIdentity = new Map<string, SynergyEdgeProfile>();

  for (const profile of profiles) {
    const existing = byIdentity.get(profile.identityKey);
    if (
      !existing ||
      profile.confidence > existing.confidence ||
      (profile.confidence === existing.confidence &&
        profile.name.localeCompare(existing.name) < 0)
    ) {
      byIdentity.set(profile.identityKey, profile);
    }
  }

  return [...byIdentity.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export const prismaSynergyEdgeRepository: SynergyEdgeRepository = {
  async findCatalogProfiles(input) {
    const prismaGame = GAME_TO_PRISMA[input.game];
    const profiles = await prisma.catalogCardProfile.findMany({
      where: { game: prismaGame },
      orderBy: [{ familyKey: "asc" }, { id: "asc" }],
      take: input.limit,
    });

    return dedupeProfilesByIdentity(
      profiles.map((profile) => ({
        id: profile.catalogCardId,
        identityKey: profile.familyKey ?? profile.catalogCardId,
        source: "catalog",
        game: PRISMA_TO_GAME[profile.game],
        prismaGame: profile.game,
        name: profile.name,
        tags: asArray<MechanicTag>(profile.tags),
        roles: asArray<CardRole>(profile.roles),
        triggers: asArray<TriggerProfile>(profile.triggers),
        produces: asArray<ResourceProfile>(profile.produces),
        consumes: asArray<ResourceProfile>(profile.consumes),
        payoffs: asArray<PayoffProfile>(profile.payoffs),
        constraints: asArray<ConstraintProfile>(profile.constraints),
        risks: asArray<string>(profile.risks),
        parserVersion: profile.parserVersion,
        confidence: profile.confidence,
      })),
    );
  },

  async findPrismaProfiles(input) {
    const prismaGame = GAME_TO_PRISMA[input.game];
    const profiles = await prisma.cardProfile.findMany({
      where: { game: prismaGame },
      orderBy: { cardId: "asc" },
      take: input.limit,
    });

    return profiles.map((profile) => ({
      id: String(profile.cardId),
      identityKey: `card:${profile.cardId}`,
      source: "prisma",
      game: PRISMA_TO_GAME[profile.game],
      prismaGame: profile.game,
      name: profile.name,
      tags: asArray<MechanicTag>(profile.tags),
      roles: asArray<CardRole>(profile.roles),
      triggers: asArray<TriggerProfile>(profile.triggers),
      produces: asArray<ResourceProfile>(profile.produces),
      consumes: asArray<ResourceProfile>(profile.consumes),
      payoffs: asArray<PayoffProfile>(profile.payoffs),
      constraints: asArray<ConstraintProfile>(profile.constraints),
      risks: asArray<string>(profile.risks),
      parserVersion: profile.parserVersion,
      confidence: profile.confidence,
    }));
  },

  async replaceSynergyEdges(input) {
    await prisma.cardSynergy.deleteMany({
      where: {
        game: input.game,
        source: input.source,
      },
    });

    let written = 0;
    for (let index = 0; index < input.edges.length; index += 500) {
      const chunk = input.edges.slice(index, index + 500);
      if (chunk.length === 0) {
        continue;
      }

      const result = await prisma.cardSynergy.createMany({
        data: chunk.map((edge) => ({
          game: input.game,
          source: input.source,
          primaryCardId: edge.primaryCardId,
          secondaryCardId: edge.secondaryCardId,
          primaryIdentityKey: edge.primaryIdentityKey,
          secondaryIdentityKey: edge.secondaryIdentityKey,
          cardIds: toJsonValue(edge.cardIds),
          identityKeys: toJsonValue(edge.identityKeys),
          synergyType: edge.synergyType,
          score: edge.score,
          tags: toJsonValue(edge.tags),
          roles: toJsonValue(edge.roles),
          explanation: edge.explanation,
          requiredConditions: toJsonValue(edge.requiredConditions),
          weaknesses: toJsonValue(edge.weaknesses),
        })),
        skipDuplicates: true,
      });
      written += result.count;
    }

    return written;
  },
};

async function loadProfiles(input: RebuildSynergyEdgesInput, repository: SynergyEdgeRepository) {
  const requestedSource = input.source ?? "catalog";
  let source = requestedSource;
  let profiles =
    requestedSource === "catalog"
      ? await repository.findCatalogProfiles(input)
      : await repository.findPrismaProfiles(input);

  if (!input.source && profiles.length === 0) {
    source = "prisma";
    profiles = await repository.findPrismaProfiles(input);
  }

  return { source, profiles: dedupeProfilesByIdentity(profiles) };
}

export async function rebuildSynergyEdges(
  input: RebuildSynergyEdgesInput,
  repository: SynergyEdgeRepository = prismaSynergyEdgeRepository,
): Promise<RebuildSynergyEdgesResult> {
  const dryRun = input.dryRun ?? false;
  const minScore = input.minScore ?? DEFAULT_SYNERGY_EDGE_MIN_SCORE;
  const maxEdgesPerPrimary =
    input.maxEdgesPerPrimary ?? DEFAULT_MAX_EDGES_PER_PRIMARY;
  const { source, profiles } = await loadProfiles(input, repository);
  const edges = findSynergyEdges({
    profiles,
    minScore,
    maxEdgesPerPrimary,
  });
  const written = dryRun
    ? 0
    : await repository.replaceSynergyEdges({
        game: GAME_TO_PRISMA[input.game],
        source,
        edges,
      });

  return {
    game: input.game,
    source,
    dryRun,
    profilesLoaded: profiles.length,
    edgesGenerated: edges.length,
    written,
    minScore,
    maxEdgesPerPrimary,
    edges,
  };
}
