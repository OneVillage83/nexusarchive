import assert from "node:assert/strict";
import test from "node:test";

import type { CardCatalogSummary } from "@/lib/cards/catalog";

import {
  rebuildCatalogCardProfiles,
  type CatalogCardProfileRepository,
} from "./rebuild-catalog-card-profiles";
import type { CatalogCardIntelligenceProfile } from "@/lib/synergy/types/card-profile";

const sampleCard = {
  id: "magic-test-card",
  game: "magic-the-gathering",
  name: "Archive Test Mage",
  familyKey: "archive-test-mage",
  type: "Creature - Wizard",
  domains: ["U"],
  tags: [],
  energyCost: 2,
  power: 1,
  might: 3,
  hp: null,
  rarity: "rare",
  text: "When Archive Test Mage enters the battlefield, draw a card.",
  flavor: null,
  setCode: "TST",
  setName: "Test Set",
  collectorNo: "1",
  imageUrl: null,
  artist: null,
  marketPrice: null,
  source: "scryfall-default-cards",
  externalUrl: null,
  searchText: "archive test mage creature wizard enters battlefield draw card en",
} satisfies CardCatalogSummary;

function buildRepository(written: CatalogCardIntelligenceProfile[] = []): CatalogCardProfileRepository {
  return {
    async getCatalogMeta(game) {
      return {
        game,
        source: "scryfall-default-cards",
        sourceLabel: "Scryfall default cards",
        sourceUrl: "https://scryfall.com",
        cardCount: 1,
        importedAt: "2026-04-29T00:00:00.000Z",
        upstreamUpdatedAt: null,
      };
    },
    async getCatalogCards() {
      return [sampleCard];
    },
    async upsertCatalogCardProfile(profile) {
      written.push(profile);
    },
  };
}

test("rebuildCatalogCardProfiles dry-runs catalog cards without writing", async () => {
  const result = await rebuildCatalogCardProfiles(
    { game: "magic-the-gathering", limit: 1, dryRun: true },
    buildRepository(),
  );

  assert.equal(result.source, "redis-catalog");
  assert.equal(result.processed, 1);
  assert.equal(result.written, 0);
  assert.equal(result.storageDecision, "catalog_card_profile");
  assert.equal(result.profiles[0]?.catalogCardId, "magic-test-card");
  assert.ok(result.profiles[0]?.tags.includes("draw"));
  assert.ok(result.profiles[0]?.tags.includes("enter_trigger"));
});

test("rebuildCatalogCardProfiles writes catalog profiles when dryRun is false", async () => {
  const written: CatalogCardIntelligenceProfile[] = [];
  const result = await rebuildCatalogCardProfiles(
    { game: "magic-the-gathering", limit: 1, dryRun: false },
    buildRepository(written),
  );

  assert.equal(result.processed, 1);
  assert.equal(result.written, 1);
  assert.equal(written.length, 1);
  assert.equal(written[0]?.catalogCardId, "magic-test-card");
});
