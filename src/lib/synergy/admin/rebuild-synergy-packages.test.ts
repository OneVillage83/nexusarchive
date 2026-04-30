import assert from "node:assert/strict";
import test from "node:test";

import { Game } from "@prisma/client";

import {
  rebuildSynergyPackages,
  type SynergyPackageRepository,
} from "@/lib/synergy/admin/rebuild-synergy-packages";
import type {
  SynergyPackageEdge,
  SynergyPackageResult,
} from "@/lib/synergy/types/synergy-package";
import type { SynergyEdgeSource } from "@/lib/synergy/types/synergy-edge";

function edge(left: string, right: string, tags: SynergyPackageEdge["tags"]): SynergyPackageEdge {
  return {
    id: `${left}-${right}`,
    game: "riftbound",
    source: "catalog",
    cardIds: [`card-${left}`, `card-${right}`],
    identityKeys: [left, right],
    primaryCardId: `card-${left}`,
    secondaryCardId: `card-${right}`,
    primaryIdentityKey: left,
    secondaryIdentityKey: right,
    synergyType: "direct_synergy",
    score: 82,
    tags,
    roles: ["enabler", "payoff"],
    explanation: `${left} helps ${right}.`,
    requiredConditions: ["Both cards need to be playable together."],
    weaknesses: ["Needs multiple pieces online."],
  };
}

function buildRepository(input: {
  catalogEdges?: SynergyPackageEdge[];
  prismaEdges?: SynergyPackageEdge[];
  writes?: SynergyPackageResult[][];
  deletes?: Array<{ game: Game; source: SynergyEdgeSource }>;
} = {}): SynergyPackageRepository {
  return {
    async findPackageEdges(query) {
      const edges = query.source === "catalog"
        ? (input.catalogEdges ?? [])
        : (input.prismaEdges ?? []);

      return edges
        .filter((candidate) => candidate.score >= query.minEdgeScore)
        .map((candidate) => ({
          ...candidate,
          source: query.source,
        }));
    },
    async replaceSynergyPackages(writeInput) {
      input.deletes?.push({
        game: writeInput.game,
        source: writeInput.source,
      });
      input.writes?.push(writeInput.packages);
      return writeInput.packages.length;
    },
  };
}

const tokenEdges = [
  edge("a", "b", ["token_creation", "token_payoff"]),
  edge("b", "c", ["token_payoff", "wide_board"]),
];

test("rebuildSynergyPackages dry-runs packages without writing", async () => {
  const writes: SynergyPackageResult[][] = [];
  const result = await rebuildSynergyPackages(
    { game: "riftbound", dryRun: true },
    buildRepository({ catalogEdges: tokenEdges, writes }),
  );

  assert.equal(result.source, "catalog");
  assert.equal(result.edgesLoaded, 2);
  assert.equal(result.packagesGenerated, 1);
  assert.equal(result.written, 0);
  assert.equal(writes.length, 0);
});

test("rebuildSynergyPackages replaces scoped packages when dryRun is false", async () => {
  const writes: SynergyPackageResult[][] = [];
  const deletes: Array<{ game: Game; source: SynergyEdgeSource }> = [];
  const result = await rebuildSynergyPackages(
    { game: "riftbound", dryRun: false },
    buildRepository({ catalogEdges: tokenEdges, writes, deletes }),
  );

  assert.equal(result.written, 1);
  assert.equal(writes.length, 1);
  assert.equal(deletes.length, 1);
  assert.deepEqual(deletes[0], {
    game: Game.RIFTBOUND,
    source: "catalog",
  });
});

test("rebuildSynergyPackages falls back to Prisma edges when catalog is empty", async () => {
  const result = await rebuildSynergyPackages(
    { game: "riftbound", dryRun: true },
    buildRepository({ catalogEdges: [], prismaEdges: tokenEdges }),
  );

  assert.equal(result.source, "prisma");
  assert.equal(result.edgesLoaded, 2);
  assert.equal(result.packagesGenerated, 1);
});
