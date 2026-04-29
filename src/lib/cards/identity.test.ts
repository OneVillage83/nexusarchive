import assert from "node:assert/strict";
import { test } from "node:test";

import type { CardCatalogSummary } from "@/lib/cards/catalog";
import {
  cardsShareIdentity,
  getCardIdentityCandidates,
} from "@/lib/cards/identity";

function card(
  overrides: Partial<CardCatalogSummary> & Pick<CardCatalogSummary, "game" | "name">,
): CardCatalogSummary {
  return {
    id: overrides.id ?? `${overrides.game}:${overrides.name}`,
    game: overrides.game,
    name: overrides.name,
    familyKey: overrides.familyKey,
    language: overrides.language ?? "en",
    type: overrides.type ?? "Character",
    domains: overrides.domains ?? [],
    tags: overrides.tags ?? [],
    energyCost: overrides.energyCost ?? null,
    power: overrides.power ?? null,
    might: overrides.might ?? null,
    hp: overrides.hp ?? null,
    rarity: overrides.rarity ?? null,
    text: overrides.text ?? null,
    flavor: overrides.flavor ?? null,
    setCode: overrides.setCode ?? null,
    setName: overrides.setName ?? null,
    collectorNo: overrides.collectorNo ?? null,
    imageUrl: overrides.imageUrl ?? null,
    artist: overrides.artist ?? null,
    marketPrice: overrides.marketPrice ?? null,
    source: overrides.source ?? "scryfall-default-cards",
    externalUrl: overrides.externalUrl ?? null,
    searchText: overrides.searchText ?? "",
  };
}

test("MTG cards do not share identity through repeated collector numbers", () => {
  const firstCard = card({
    game: "magic-the-gathering",
    name: "Alpha Spell",
    familyKey: "oracle-alpha",
    collectorNo: "001",
    type: "Instant",
    text: "Draw a card.",
  });
  const secondCard = card({
    game: "magic-the-gathering",
    name: "Beta Spell",
    familyKey: "oracle-beta",
    collectorNo: "001",
    type: "Sorcery",
    text: "Create a token.",
  });

  assert.equal(cardsShareIdentity(firstCard, secondCard), false);
});

test("MTG reprints share identity through Scryfall oracle family keys", () => {
  const firstPrinting = card({
    game: "magic-the-gathering",
    name: "Lightning Bolt",
    familyKey: "oracle-lightning-bolt",
    collectorNo: "150",
    type: "Instant",
    text: "Lightning Bolt deals 3 damage to any target.",
  });
  const laterPrinting = card({
    game: "magic-the-gathering",
    name: "Lightning Bolt",
    familyKey: "oracle-lightning-bolt",
    collectorNo: "401",
    type: "Instant",
    text: "Lightning Bolt deals 3 damage to any target.",
  });

  assert.equal(cardsShareIdentity(firstPrinting, laterPrinting), true);
});

test("MTG identity candidates exclude bare collector numbers", () => {
  const candidates = getCardIdentityCandidates(
    card({
      game: "magic-the-gathering",
      name: "Collector Trap",
      collectorNo: "123",
      type: "Artifact",
      text: "Tap: Add one mana of any color.",
    }),
  );

  assert.equal(candidates.some((candidate) => candidate === "collector:123"), false);
});

test("One Piece collector identity behavior is preserved", () => {
  const firstPrinting = card({
    game: "one-piece",
    name: "Monkey.D.Luffy",
    collectorNo: "ST01-001",
    type: "LEADER",
    text: "[DON!! x2] This Leader gets +1000 power.",
    source: "optcgapi-all-set-cards",
  });
  const alternatePrinting = card({
    game: "one-piece",
    name: "Monkey.D.Luffy",
    collectorNo: "ST01-001",
    type: "LEADER",
    text: "Alternate art printing.",
    source: "optcgapi-all-set-cards",
  });

  assert.equal(cardsShareIdentity(firstPrinting, alternatePrinting), true);
});

test("Riftbound collector identity behavior is preserved", () => {
  const basePrinting = card({
    game: "riftbound",
    name: "Ahri",
    collectorNo: "OGN-001",
    type: "Champion",
    text: "Champion text.",
    source: "riftcodex-cards",
  });
  const alternatePrinting = card({
    game: "riftbound",
    name: "Ahri",
    collectorNo: "OGN-001",
    type: "Champion",
    text: "Alternate art printing.",
    source: "riftcodex-cards",
  });

  assert.equal(cardsShareIdentity(basePrinting, alternatePrinting), true);
});
