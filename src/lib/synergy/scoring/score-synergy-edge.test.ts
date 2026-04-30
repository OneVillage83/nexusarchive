import assert from "node:assert/strict";
import test from "node:test";

import { Game } from "@prisma/client";

import type { SynergyEdgeRule } from "@/lib/synergy/constants/synergy-types";
import { SYNERGY_EDGE_RULES } from "@/lib/synergy/constants/synergy-types";
import { scoreSynergyEdge } from "@/lib/synergy/scoring/score-synergy-edge";
import type { SynergyEdgeProfile } from "@/lib/synergy/types/synergy-edge";

function rule(id: string) {
  const match = SYNERGY_EDGE_RULES.find((candidate) => candidate.id === id);
  assert.ok(match, `Expected rule ${id} to exist`);
  return match;
}

function profile(input: Partial<SynergyEdgeProfile>): SynergyEdgeProfile {
  return {
    id: "card-a",
    identityKey: "card-a",
    source: "catalog",
    game: "riftbound",
    prismaGame: Game.RIFTBOUND,
    name: "Card A",
    tags: [],
    roles: [],
    triggers: [],
    produces: [],
    consumes: [],
    payoffs: [],
    constraints: [],
    risks: [],
    parserVersion: "test",
    confidence: 0.9,
    ...input,
  };
}

test("scoreSynergyEdge keeps strong complementary profiles above threshold", () => {
  const score = scoreSynergyEdge({
    rule: rule("token-creator-token-payoff"),
    primary: profile({
      tags: ["token_creation"],
      roles: ["enabler"],
      produces: [{ resource: "token", amount: "variable" }],
    }),
    secondary: profile({
      id: "card-b",
      identityKey: "card-b",
      name: "Card B",
      tags: ["token_payoff"],
      roles: ["payoff"],
      payoffs: [
        {
          condition: "tokens are present",
          reward: "token payoff",
          tags: ["token_payoff"],
        },
      ],
    }),
  });

  assert.ok(score >= 75);
});

test("scoreSynergyEdge penalizes low-confidence and unknown-heavy profiles", () => {
  const strongScore = scoreSynergyEdge({
    rule: rule("discard-graveyard-payoff"),
    primary: profile({ tags: ["discard"], roles: ["enabler"] }),
    secondary: profile({
      id: "card-b",
      identityKey: "card-b",
      tags: ["graveyard_payoff"],
      roles: ["payoff"],
    }),
  });
  const weakScore = scoreSynergyEdge({
    rule: rule("discard-graveyard-payoff"),
    primary: profile({
      tags: ["discard", "unknown"],
      roles: ["enabler"],
      confidence: 0.3,
      risks: ["low_parser_confidence"],
    }),
    secondary: profile({
      id: "card-b",
      identityKey: "card-b",
      tags: ["graveyard_payoff", "unknown"],
      roles: ["payoff"],
      confidence: 0.3,
      risks: ["low_parser_confidence"],
    }),
  });

  assert.ok(weakScore < strongScore);
});

test("scoreSynergyEdge clamps scores to 0-100", () => {
  const highRule: SynergyEdgeRule = {
    id: "high",
    producerTag: "draw",
    consumerTag: "hand_size_payoff",
    type: "payoff_link",
    baseScore: 150,
    label: "High score",
  };
  const lowRule: SynergyEdgeRule = {
    id: "low",
    producerTag: "draw",
    consumerTag: "hand_size_payoff",
    type: "payoff_link",
    baseScore: -50,
    label: "Low score",
  };
  const primary = profile({ tags: ["draw"], roles: ["draw"] });
  const secondary = profile({
    id: "card-b",
    identityKey: "card-b",
    tags: ["hand_size_payoff"],
    roles: ["payoff"],
  });

  assert.equal(scoreSynergyEdge({ rule: highRule, primary, secondary }), 100);
  assert.equal(scoreSynergyEdge({ rule: lowRule, primary, secondary }), 0);
});
