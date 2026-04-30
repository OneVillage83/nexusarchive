import assert from "node:assert/strict";
import test from "node:test";

import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import { discoverSynergyPackages } from "@/lib/synergy/engine/discover-synergy-packages";
import type { SynergyPackageEdge } from "@/lib/synergy/types/synergy-package";

function edge(input: {
  left: string;
  right: string;
  tags: MechanicTag[];
  roles?: CardRole[];
  score?: number;
  id?: string;
}): SynergyPackageEdge {
  return {
    id: input.id,
    game: "riftbound",
    source: "catalog",
    cardIds: [`card-${input.left}`, `card-${input.right}`],
    identityKeys: [input.left, input.right],
    primaryCardId: `card-${input.left}`,
    secondaryCardId: `card-${input.right}`,
    primaryIdentityKey: input.left,
    secondaryIdentityKey: input.right,
    synergyType: "direct_synergy",
    score: input.score ?? 82,
    tags: input.tags,
    roles: input.roles ?? ["enabler", "payoff"],
    explanation: `${input.left} helps ${input.right}.`,
    requiredConditions: ["Both cards need to be playable together."],
    weaknesses: ["Needs multiple pieces online."],
  };
}

test("discoverSynergyPackages generates a connected 3-card package", () => {
  const packages = discoverSynergyPackages({
    edges: [
      edge({
        left: "a",
        right: "b",
        tags: ["token_creation", "token_payoff"],
      }),
      edge({
        left: "b",
        right: "c",
        tags: ["token_payoff", "wide_board"],
      }),
    ],
  });

  assert.equal(packages[0]?.packageType, "token_package");
  assert.equal(packages[0]?.packageSize, 3);
  assert.equal(packages[0]?.requiredEdges.length, 2);
});

test("discoverSynergyPackages generates 4-5 card packages when connected", () => {
  const packages = discoverSynergyPackages({
    edges: [
      edge({
        left: "a",
        right: "b",
        tags: ["resource_generation", "resource_conversion"],
        roles: ["resource_generator", "resource_sink"],
      }),
      edge({
        left: "b",
        right: "c",
        tags: ["resource_conversion", "draw"],
        roles: ["resource_sink", "draw"],
      }),
      edge({
        left: "c",
        right: "d",
        tags: ["resource_generation", "draw"],
        roles: ["resource_generator", "draw"],
      }),
      edge({
        left: "d",
        right: "e",
        tags: ["resource_conversion", "draw"],
        roles: ["resource_sink", "draw"],
      }),
    ],
    maxPackageSize: 5,
  });

  assert.ok(packages.some((synergyPackage) => synergyPackage.packageSize === 4));
  assert.ok(packages.some((synergyPackage) => synergyPackage.packageSize === 5));
});

test("discoverSynergyPackages skips disconnected candidate sets", () => {
  const packages = discoverSynergyPackages({
    edges: [
      edge({ left: "a", right: "b", tags: ["token_creation", "token_payoff"] }),
      edge({ left: "c", right: "d", tags: ["token_creation", "wide_board"] }),
    ],
  });

  assert.equal(packages.length, 0);
});

test("discoverSynergyPackages dedupes the same identity set", () => {
  const packages = discoverSynergyPackages({
    edges: [
      edge({
        id: "edge-1",
        left: "a",
        right: "b",
        tags: ["token_creation", "token_payoff"],
      }),
      edge({
        id: "edge-2",
        left: "b",
        right: "a",
        tags: ["token_creation", "token_payoff"],
      }),
      edge({
        id: "edge-3",
        left: "b",
        right: "c",
        tags: ["token_payoff", "wide_board"],
      }),
    ],
  });
  const tokenPackages = packages.filter(
    (synergyPackage) => synergyPackage.packageType === "token_package",
  );

  assert.equal(tokenPackages.length, 1);
});

test("discoverSynergyPackages respects min score, max size, and max package limits", () => {
  const edges = [
    edge({ left: "a", right: "b", tags: ["token_creation", "token_payoff"] }),
    edge({ left: "b", right: "c", tags: ["token_payoff", "wide_board"] }),
    edge({ left: "c", right: "d", tags: ["token_creation", "wide_board"] }),
  ];

  assert.equal(
    discoverSynergyPackages({ edges, minPackageScore: 99 }).length,
    0,
  );
  assert.ok(
    discoverSynergyPackages({ edges, maxPackageSize: 3 }).every(
      (synergyPackage) => synergyPackage.packageSize <= 3,
    ),
  );
  assert.equal(discoverSynergyPackages({ edges, maxPackages: 1 }).length, 1);
});
