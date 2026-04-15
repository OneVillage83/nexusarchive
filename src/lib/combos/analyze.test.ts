import assert from "node:assert/strict";
import test from "node:test";

import * as analyzeModule from "./analyze";
import type { ComboResultSummary } from "./types";

const { matchComboAgainstDeck } = analyzeModule;

const combo = {
  id: 1,
  slug: "sol-ring-loop",
  game: "magic-the-gathering",
  source: "test",
  kind: "combo",
  name: "Sol Ring Loop",
  summary: "A fake test combo.",
  resultText: "Infinite mana",
  steps: [],
  prerequisites: [],
  tags: ["Mana"],
  formatTags: ["Commander"],
  isComplete: true,
  popularity: 10,
  href: "/magic-the-gathering/combos?selected=sol-ring-loop",
  match: null,
  pieces: [
    {
      role: "piece",
      familyKey: "sol-ring",
      cardName: "Sol Ring",
      quantity: 1,
      cardId: "1",
      imageUrl: null,
      typeLine: "Artifact",
      text: null,
      domains: [],
      energyCost: 1,
      power: null,
      might: null,
      hp: null,
    },
    {
      role: "piece",
      familyKey: "hullbreaker-horror",
      cardName: "Hullbreaker Horror",
      quantity: 1,
      cardId: "2",
      imageUrl: null,
      typeLine: "Creature",
      text: null,
      domains: [],
      energyCost: 7,
      power: 7,
      might: 8,
      hp: null,
    },
  ],
} satisfies ComboResultSummary;

test("matchComboAgainstDeck returns exact matches when all pieces are present", () => {
  const result = matchComboAgainstDeck(
    combo,
    "exactMatches",
    new Map([
      ["sol-ring", 1],
      ["hullbreaker-horror", 1],
    ]),
  );

  assert.ok(result);
  assert.equal(result?.match?.bucket, "exactMatches");
  assert.equal(result?.match?.missingPieces.length, 0);
});

test("matchComboAgainstDeck returns near misses when one piece is missing", () => {
  const result = matchComboAgainstDeck(
    combo,
    "nearMisses",
    new Map([["sol-ring", 1]]),
  );

  assert.ok(result);
  assert.equal(result?.match?.bucket, "nearMisses");
  assert.equal(result?.match?.missingPieces.length, 1);
});
