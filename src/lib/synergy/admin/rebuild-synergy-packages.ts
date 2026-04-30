import { Game } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import type { GameSlug } from "@/lib/games";
import prisma from "@/lib/db";
import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import {
  DEFAULT_MAX_PACKAGES,
  DEFAULT_MAX_PACKAGE_SIZE,
  DEFAULT_PACKAGE_MIN_EDGE_SCORE,
  DEFAULT_PACKAGE_MIN_SCORE,
  discoverSynergyPackages,
} from "@/lib/synergy/engine/discover-synergy-packages";
import type {
  SynergyPackageEdge,
  SynergyPackageResult,
} from "@/lib/synergy/types/synergy-package";
import type { SynergyEdgeSource } from "@/lib/synergy/types/synergy-edge";

export type RebuildSynergyPackagesInput = {
  game: GameSlug;
  source?: SynergyEdgeSource;
  dryRun?: boolean;
  minEdgeScore?: number;
  minPackageScore?: number;
  maxPackageSize?: number;
  maxPackages?: number;
};

export type RebuildSynergyPackagesResult = {
  game: GameSlug;
  source: SynergyEdgeSource;
  dryRun: boolean;
  edgesLoaded: number;
  packagesGenerated: number;
  written: number;
  minEdgeScore: number;
  minPackageScore: number;
  maxPackageSize: number;
  packages: SynergyPackageResult[];
};

export type SynergyPackageRepository = {
  findPackageEdges: (input: {
    game: GameSlug;
    source: SynergyEdgeSource;
    minEdgeScore: number;
  }) => Promise<SynergyPackageEdge[]>;
  replaceSynergyPackages: (input: {
    game: Game;
    source: SynergyEdgeSource;
    packages: SynergyPackageResult[];
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

export const prismaSynergyPackageRepository: SynergyPackageRepository = {
  async findPackageEdges(input) {
    const prismaGame = GAME_TO_PRISMA[input.game];
    const edges = await prisma.cardSynergy.findMany({
      where: {
        game: prismaGame,
        source: input.source,
        score: { gte: input.minEdgeScore },
      },
      orderBy: [{ score: "desc" }, { id: "asc" }],
    });

    return edges.map((edge) => ({
      id: String(edge.id),
      game: PRISMA_TO_GAME[edge.game],
      source: edge.source as SynergyEdgeSource,
      cardIds: asArray<string>(edge.cardIds),
      identityKeys: asArray<string>(edge.identityKeys),
      primaryCardId: edge.primaryCardId,
      secondaryCardId: edge.secondaryCardId,
      primaryIdentityKey: edge.primaryIdentityKey,
      secondaryIdentityKey: edge.secondaryIdentityKey,
      synergyType: edge.synergyType as SynergyPackageEdge["synergyType"],
      score: edge.score,
      tags: asArray<MechanicTag>(edge.tags),
      roles: asArray<CardRole>(edge.roles),
      explanation: edge.explanation,
      requiredConditions: asArray<string>(edge.requiredConditions),
      weaknesses: asArray<string>(edge.weaknesses),
    }));
  },

  async replaceSynergyPackages(input) {
    await prisma.synergyPackage.deleteMany({
      where: {
        game: input.game,
        source: input.source,
      },
    });

    let written = 0;
    for (let index = 0; index < input.packages.length; index += 500) {
      const chunk = input.packages.slice(index, index + 500);
      if (chunk.length === 0) {
        continue;
      }

      const result = await prisma.synergyPackage.createMany({
        data: chunk.map((synergyPackage) => ({
          game: input.game,
          source: input.source,
          packageKey: synergyPackage.packageKey,
          cardIds: toJsonValue(synergyPackage.cardIds),
          identityKeys: toJsonValue(synergyPackage.identityKeys),
          packageSize: synergyPackage.packageSize,
          packageType: synergyPackage.packageType,
          score: synergyPackage.score,
          tags: toJsonValue(synergyPackage.tags),
          roles: toJsonValue(synergyPackage.roles),
          requiredEdges: toJsonValue(synergyPackage.requiredEdges),
          explanation: synergyPackage.explanation,
          playPattern: synergyPackage.playPattern,
          requiredConditions: toJsonValue(synergyPackage.requiredConditions),
          weaknesses: toJsonValue(synergyPackage.weaknesses),
          isCombo: synergyPackage.isCombo,
          isEngine: synergyPackage.isEngine,
          isWinCondition: synergyPackage.isWinCondition,
        })),
        skipDuplicates: true,
      });
      written += result.count;
    }

    return written;
  },
};

async function loadEdges(
  input: RebuildSynergyPackagesInput,
  repository: SynergyPackageRepository,
  minEdgeScore: number,
) {
  const requestedSource = input.source ?? "catalog";
  let source = requestedSource;
  let edges = await repository.findPackageEdges({
    game: input.game,
    source,
    minEdgeScore,
  });

  if (!input.source && edges.length === 0) {
    source = "prisma";
    edges = await repository.findPackageEdges({
      game: input.game,
      source,
      minEdgeScore,
    });
  }

  return { source, edges };
}

export async function rebuildSynergyPackages(
  input: RebuildSynergyPackagesInput,
  repository: SynergyPackageRepository = prismaSynergyPackageRepository,
): Promise<RebuildSynergyPackagesResult> {
  const dryRun = input.dryRun ?? false;
  const minEdgeScore = input.minEdgeScore ?? DEFAULT_PACKAGE_MIN_EDGE_SCORE;
  const minPackageScore = input.minPackageScore ?? DEFAULT_PACKAGE_MIN_SCORE;
  const maxPackageSize = input.maxPackageSize ?? DEFAULT_MAX_PACKAGE_SIZE;
  const maxPackages = input.maxPackages ?? DEFAULT_MAX_PACKAGES;
  const { source, edges } = await loadEdges(input, repository, minEdgeScore);
  const packages = discoverSynergyPackages({
    edges,
    minEdgeScore,
    minPackageScore,
    maxPackageSize,
    maxPackages,
  });
  const written = dryRun
    ? 0
    : await repository.replaceSynergyPackages({
        game: GAME_TO_PRISMA[input.game],
        source,
        packages,
      });

  return {
    game: input.game,
    source,
    dryRun,
    edgesLoaded: edges.length,
    packagesGenerated: packages.length,
    written,
    minEdgeScore,
    minPackageScore,
    maxPackageSize,
    packages,
  };
}
