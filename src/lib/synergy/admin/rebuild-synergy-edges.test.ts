import assert from "node:assert/strict";
import test from "node:test";

import { Game } from "@prisma/client";

import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import {
  rebuildSynergyEdges,
  type SynergyEdgeRepository,
} from "@/lib/synergy/admin/rebuild-synergy-edges";
import type {
  SynergyEdgeProfile,
  SynergyEdgeResult,
  SynergyEdgeSource,
} from "@/lib/synergy/types/synergy-edge";

function profile(input: {
  id: string;
  identityKey?: string;
  name: string;
  tags: MechanicTag[];
  roles: CardRole[];
  confidence?: number;
}): SynergyEdgeProfile {
  return {
    id: input.id,
    identityKey: input.identityKey ?? input.id,
    source: "catalog",
    game: "riftbound",
    prismaGame: Game.RIFTBOUND,
    name: input.name,
    tags: input.tags,
    roles: input.roles,
    triggers: [],
    produces: [],
    consumes: [],
    payoffs: input.tags
      .filter((tag) => tag.endsWith("_payoff") || tag === "death_trigger")
      .map((tag) => ({
        condition: `${tag} condition`,
        reward: `${tag} reward`,
        tags: [tag],
      })),
    constraints: [],
    risks: [],
    parserVersion: "test",
    confidence: input.confidence ?? 0.9,
  };
}

function buildRepository(input: {
  catalogProfiles?: SynergyEdgeProfile[];
  prismaProfiles?: SynergyEdgeProfile[];
  writes?: SynergyEdgeResult[][];
  deletes?: Array<{ game: Game; source: SynergyEdgeSource }>;
} = {}): SynergyEdgeRepository {
  return {
    async findCatalogProfiles() {
      return input.catalogProfiles ?? [];
    },
    async findPrismaProfiles() {
      return input.prismaProfiles ?? [];
    },
    async replaceSynergyEdges(writeInput) {
      input.deletes?.push({
        game: writeInput.game,
        source: writeInput.source,
      });
      input.writes?.push(writeInput.edges);
      return writeInput.edges.length;
    },
  };
}

const tokenProfiles = [
  profile({
    id: "token-maker",
    name: "Token Maker",
    tags: ["token_creation"],
    roles: ["enabler"],
  }),
  profile({
    id: "token-payoff",
    name: "Token Payoff",
    tags: ["token_payoff"],
    roles: ["payoff"],
  }),
];

test("rebuildSynergyEdges dry-runs catalog profiles without writing", async () => {
  const writes: SynergyEdgeResult[][] = [];
  const result = await rebuildSynergyEdges(
    { game: "riftbound", dryRun: true },
    buildRepository({ catalogProfiles: tokenProfiles, writes }),
  );

  assert.equal(result.source, "catalog");
  assert.equal(result.profilesLoaded, 2);
  assert.equal(result.edgesGenerated, 1);
  assert.equal(result.written, 0);
  assert.equal(writes.length, 0);
});

test("rebuildSynergyEdges replaces scoped edges when dryRun is false", async () => {
  const writes: SynergyEdgeResult[][] = [];
  const deletes: Array<{ game: Game; source: SynergyEdgeSource }> = [];
  const result = await rebuildSynergyEdges(
    { game: "riftbound", dryRun: false },
    buildRepository({ catalogProfiles: tokenProfiles, writes, deletes }),
  );

  assert.equal(result.written, 1);
  assert.equal(writes.length, 1);
  assert.equal(deletes.length, 1);
  assert.deepEqual(deletes[0], {
    game: Game.RIFTBOUND,
    source: "catalog",
  });
});

test("rebuildSynergyEdges falls back to Prisma profiles when catalog is empty", async () => {
  const result = await rebuildSynergyEdges(
    { game: "riftbound", dryRun: true },
    buildRepository({
      catalogProfiles: [],
      prismaProfiles: tokenProfiles.map((entry) => ({
        ...entry,
        source: "prisma",
        identityKey: `card:${entry.id}`,
      })),
    }),
  );

  assert.equal(result.source, "prisma");
  assert.equal(result.profilesLoaded, 2);
  assert.equal(result.edgesGenerated, 1);
});

test("rebuildSynergyEdges dedupes repeated catalog identities", async () => {
  const duplicateTokenMakers = [
    profile({
      id: "token-maker-a",
      identityKey: "family:token-maker",
      name: "Token Maker A",
      tags: ["token_creation"],
      roles: ["enabler"],
      confidence: 0.8,
    }),
    profile({
      id: "token-maker-b",
      identityKey: "family:token-maker",
      name: "Token Maker B",
      tags: ["token_creation"],
      roles: ["enabler"],
      confidence: 0.95,
    }),
    tokenProfiles[1]!,
  ];
  const result = await rebuildSynergyEdges(
    { game: "riftbound", dryRun: true },
    buildRepository({ catalogProfiles: duplicateTokenMakers }),
  );

  assert.equal(result.profilesLoaded, 2);
  assert.equal(result.edgesGenerated, 1);
  assert.equal(result.edges[0]?.primaryCardId, "token-maker-b");
});

test("rebuildSynergyEdges never links a card identity to itself", async () => {
  const result = await rebuildSynergyEdges(
    { game: "riftbound", dryRun: true },
    buildRepository({
      catalogProfiles: [
        profile({
          id: "variant-a",
          identityKey: "same-card",
          name: "Variant A",
          tags: ["token_creation"],
          roles: ["enabler"],
        }),
        profile({
          id: "variant-b",
          identityKey: "same-card",
          name: "Variant B",
          tags: ["token_payoff"],
          roles: ["payoff"],
        }),
      ],
    }),
  );

  assert.equal(result.profilesLoaded, 1);
  assert.equal(result.edgesGenerated, 0);
});
