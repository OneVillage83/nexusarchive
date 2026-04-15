import assert from "node:assert/strict";
import test from "node:test";

import * as engineModule from "./engine";

const { buildSynergySuggestions, scoreComboSynergyPair } = engineModule;

const tokenMaker = {
  familyKey: "token-maker",
  cardName: "Token Smith",
  quantity: 1,
  cardId: "1",
  imageUrl: null,
  typeLine: "Creature",
  text: "Create a token whenever you cast an artifact spell.",
  domains: ["Blue"],
  energyCost: 2,
  power: 2,
  might: 2,
  hp: 2,
};

const sacOutlet = {
  familyKey: "sac-outlet",
  cardName: "Ash Pit",
  quantity: 1,
  cardId: "2",
  imageUrl: null,
  typeLine: "Artifact",
  text: "Sacrifice a token: draw a card.",
  domains: ["Blue"],
  energyCost: 2,
  power: null,
  might: null,
  hp: null,
};

test("scoreComboSynergyPair rewards producer-payoff text and shared domains", () => {
  const result = scoreComboSynergyPair(tokenMaker, sacOutlet);

  assert.ok(result.score > 20);
  assert.ok(result.reasons.length > 0);
});

test("buildSynergySuggestions skips duplicate families and returns ranked suggestions", () => {
  const results = buildSynergySuggestions(
    "magic-the-gathering",
    [tokenMaker, sacOutlet],
    (slug) => `/magic-the-gathering/combos?selected=${slug}`,
  );

  assert.equal(results.length, 1);
  assert.equal(results[0]?.match?.bucket, "synergySuggestions");
});
