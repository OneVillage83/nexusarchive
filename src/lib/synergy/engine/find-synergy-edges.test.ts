import assert from "node:assert/strict";
import test from "node:test";

import { Game } from "@prisma/client";

import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import { findSynergyEdges } from "@/lib/synergy/engine/find-synergy-edges";
import type { SynergyEdgeProfile } from "@/lib/synergy/types/synergy-edge";

function profile(input: {
  id: string;
  name: string;
  identityKey?: string;
  tags: MechanicTag[];
  roles?: CardRole[];
  produces?: SynergyEdgeProfile["produces"];
  consumes?: SynergyEdgeProfile["consumes"];
  confidence?: number;
  risks?: string[];
}): SynergyEdgeProfile {
  return {
    id: input.id,
    identityKey: input.identityKey ?? input.id,
    source: "catalog",
    game: "riftbound",
    prismaGame: Game.RIFTBOUND,
    name: input.name,
    tags: input.tags,
    roles: input.roles ?? [],
    triggers: [],
    produces: input.produces ?? [],
    consumes: input.consumes ?? [],
    payoffs: input.tags
      .filter((tag) => tag.endsWith("_payoff") || tag === "death_trigger")
      .map((tag) => ({
        condition: `${tag} condition`,
        reward: `${tag} reward`,
        tags: [tag],
      })),
    constraints: [],
    risks: input.risks ?? [],
    parserVersion: "test",
    confidence: input.confidence ?? 0.9,
  };
}

test("findSynergyEdges detects token creator to token payoff", () => {
  const edges = findSynergyEdges({
    profiles: [
      profile({
        id: "token-maker",
        name: "Token Maker",
        tags: ["token_creation"],
        roles: ["enabler"],
        produces: [{ resource: "token", amount: "variable" }],
      }),
      profile({
        id: "token-payoff",
        name: "Token Payoff",
        tags: ["token_payoff"],
        roles: ["payoff"],
      }),
    ],
  });

  assert.equal(edges[0]?.synergyType, "direct_synergy");
  assert.equal(edges[0]?.primaryCardId, "token-maker");
  assert.equal(edges[0]?.secondaryCardId, "token-payoff");
});

test("findSynergyEdges detects sacrifice outlet to death trigger payoff", () => {
  const edges = findSynergyEdges({
    profiles: [
      profile({
        id: "sac-outlet",
        name: "Sacrifice Outlet",
        tags: ["sacrifice"],
        roles: ["sacrifice_outlet", "enabler"],
      }),
      profile({
        id: "death-payoff",
        name: "Death Payoff",
        tags: ["death_trigger"],
        roles: ["payoff"],
      }),
    ],
  });

  assert.equal(edges[0]?.synergyType, "engine_link");
  assert.ok(edges[0]?.tags.includes("sacrifice"));
});

test("findSynergyEdges detects discard outlet to graveyard payoff", () => {
  const edges = findSynergyEdges({
    profiles: [
      profile({
        id: "discard-outlet",
        name: "Discard Outlet",
        tags: ["discard"],
        roles: ["enabler"],
      }),
      profile({
        id: "grave-payoff",
        name: "Graveyard Payoff",
        tags: ["graveyard_payoff"],
        roles: ["payoff"],
      }),
    ],
  });

  assert.equal(edges[0]?.synergyType, "direct_synergy");
  assert.equal(edges[0]?.secondaryCardId, "grave-payoff");
});

test("findSynergyEdges detects draw engine to hand-size payoff", () => {
  const edges = findSynergyEdges({
    profiles: [
      profile({
        id: "draw-engine",
        name: "Draw Engine",
        tags: ["draw"],
        roles: ["draw"],
        produces: [{ resource: "card", amount: "variable" }],
      }),
      profile({
        id: "hand-payoff",
        name: "Hand Payoff",
        tags: ["hand_size_payoff"],
        roles: ["payoff"],
      }),
    ],
  });

  assert.equal(edges[0]?.synergyType, "payoff_link");
});

test("findSynergyEdges detects resource generator to resource sink", () => {
  const edges = findSynergyEdges({
    profiles: [
      profile({
        id: "resource-maker",
        name: "Resource Maker",
        tags: ["resource_generation"],
        roles: ["resource_generator"],
        produces: [{ resource: "energy", amount: "variable" }],
      }),
      profile({
        id: "resource-sink",
        name: "Resource Sink",
        tags: ["resource_conversion"],
        roles: ["resource_sink"],
        consumes: [{ resource: "energy", amount: "variable" }],
      }),
    ],
  });

  assert.equal(edges[0]?.synergyType, "engine_link");
  assert.ok(edges[0]?.score >= 60);
});

test("findSynergyEdges detects search to combo piece", () => {
  const edges = findSynergyEdges({
    profiles: [
      profile({
        id: "searcher",
        name: "Searcher",
        tags: ["search"],
        roles: ["search"],
      }),
      profile({
        id: "combo-piece",
        name: "Combo Piece",
        tags: ["combo"],
        roles: ["combo_piece"],
      }),
    ],
  });

  assert.equal(edges[0]?.synergyType, "consistency_link");
});

test("findSynergyEdges detects protection to engine piece", () => {
  const edges = findSynergyEdges({
    profiles: [
      profile({
        id: "protector",
        name: "Protector",
        tags: ["protection"],
        roles: ["protection"],
      }),
      profile({
        id: "engine",
        name: "Engine",
        tags: ["untap"],
        roles: ["engine_piece"],
      }),
    ],
  });

  assert.equal(edges[0]?.synergyType, "protection_link");
});

test("findSynergyEdges skips self edges by identity key", () => {
  const edges = findSynergyEdges({
    profiles: [
      profile({
        id: "variant-a",
        identityKey: "shared-card",
        name: "Variant A",
        tags: ["token_creation"],
        roles: ["enabler"],
      }),
      profile({
        id: "variant-b",
        identityKey: "shared-card",
        name: "Variant B",
        tags: ["token_payoff"],
        roles: ["payoff"],
      }),
    ],
  });

  assert.equal(edges.length, 0);
});
