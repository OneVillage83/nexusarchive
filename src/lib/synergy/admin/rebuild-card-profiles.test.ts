import assert from "node:assert/strict";
import test from "node:test";

import { Game } from "@prisma/client";

import {
  rebuildCardProfiles,
  type CardProfileRepository,
} from "./rebuild-card-profiles";

function buildRepository() {
  let upsertCount = 0;

  const repository: CardProfileRepository = {
    async findCardsForProfiles() {
      return [
        {
          id: 1,
          game: Game.RIFTBOUND,
          name: "Token Maker",
          type: "Unit",
          domains: ["Arcane"],
          text: "Create a token.",
          energyCost: 1,
          power: 1,
          might: 1,
          hp: null,
        },
        {
          id: 2,
          game: Game.RIFTBOUND,
          name: "Death Reward",
          type: "Unit",
          domains: ["Void"],
          text: "When this dies, draw a card.",
          energyCost: 2,
          power: 2,
          might: 1,
          hp: null,
        },
      ];
    },
    async upsertCardProfile() {
      upsertCount += 1;
    },
  };

  return {
    repository,
    getUpsertCount: () => upsertCount,
  };
}

test("rebuildCardProfiles dry run returns profiles without writing", async () => {
  const { repository, getUpsertCount } = buildRepository();

  const result = await rebuildCardProfiles(
    { game: Game.RIFTBOUND, dryRun: true, limit: 2 },
    repository,
  );

  assert.equal(result.dryRun, true);
  assert.equal(result.processed, 2);
  assert.equal(result.written, 0);
  assert.equal(getUpsertCount(), 0);
  assert.ok(result.profiles[0]?.tags.includes("token_creation"));
  assert.ok(result.profiles[1]?.tags.includes("death_trigger"));
});

test("rebuildCardProfiles writes generated profiles when dryRun is false", async () => {
  const { repository, getUpsertCount } = buildRepository();

  const result = await rebuildCardProfiles(
    { game: Game.RIFTBOUND, dryRun: false, limit: 2 },
    repository,
  );

  assert.equal(result.dryRun, false);
  assert.equal(result.processed, 2);
  assert.equal(result.written, 2);
  assert.equal(getUpsertCount(), 2);
});
