import assert from "node:assert/strict";
import test from "node:test";

import { Game } from "@prisma/client";

import { parseCardProfile } from "./parse-card-profile";

function parseText(text: string | null) {
  return parseCardProfile({
    cardId: 1,
    game: Game.RIFTBOUND,
    name: "Test Card",
    type: "Unit",
    domains: ["Arcane"],
    text,
    energyCost: 2,
    power: 2,
    might: 1,
    hp: null,
  });
}

test("parseCardProfile detects common engine mechanics", () => {
  const profile = parseText(
    "When this dies, draw a card, then discard a card. Create a token.",
  );

  assert.ok(profile.tags.includes("death_trigger"));
  assert.ok(profile.tags.includes("draw"));
  assert.ok(profile.tags.includes("discard"));
  assert.ok(profile.tags.includes("token_creation"));
  assert.ok(profile.roles.includes("draw"));
  assert.ok(profile.roles.includes("enabler"));
  assert.ok(profile.roles.includes("payoff"));
  assert.ok(profile.triggers.some((trigger) => trigger.event === "death"));
  assert.ok(profile.produces.some((resource) => resource.resource === "card"));
  assert.ok(profile.produces.some((resource) => resource.resource === "token"));
  assert.ok(profile.consumes.some((resource) => resource.resource === "card"));
  assert.ok(profile.payoffs.some((payoff) => payoff.tags.includes("death_trigger")));
  assert.ok(profile.confidence >= 0.45);
  assert.ok(!profile.risks.includes("low_parser_confidence"));
});

test("parseCardProfile detects search, cost reduction, and ready effects", () => {
  const profile = parseText(
    "Search your deck for a unit. That unit costs 1 less this turn. Ready a unit.",
  );

  assert.ok(profile.tags.includes("search"));
  assert.ok(profile.tags.includes("cost_reduction"));
  assert.ok(profile.tags.includes("untap"));
  assert.ok(profile.roles.includes("search"));
  assert.ok(profile.roles.includes("engine_piece"));
  assert.ok(profile.produces.some((resource) => resource.resource === "cost_reduction"));
  assert.ok(profile.produces.some((resource) => resource.resource === "ready_state"));
  assert.ok(
    profile.constraints.some((constraint) => constraint.timing?.includes("this_turn")),
  );
});

test("parseCardProfile keeps blank cards safe and low confidence", () => {
  const profile = parseText(null);

  assert.deepEqual(profile.tags, ["unknown"]);
  assert.deepEqual(profile.roles, ["unknown"]);
  assert.equal(profile.triggers.length, 0);
  assert.equal(profile.produces.length, 0);
  assert.equal(profile.consumes.length, 0);
  assert.equal(profile.payoffs.length, 0);
  assert.ok(profile.confidence < 0.45);
  assert.ok(profile.risks.includes("empty_rules_text"));
  assert.ok(profile.risks.includes("no_mechanics_detected"));
  assert.ok(profile.risks.includes("low_parser_confidence"));
});

test("parseCardProfile marks weird unmatched text as low confidence", () => {
  const profile = parseText("A quiet relic remembers yesterday.");

  assert.deepEqual(profile.tags, ["unknown"]);
  assert.deepEqual(profile.roles, ["unknown"]);
  assert.ok(profile.confidence < 0.45);
  assert.ok(profile.risks.includes("low_parser_confidence"));
});
