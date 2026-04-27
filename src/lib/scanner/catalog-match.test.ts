import assert from "node:assert/strict";
import test from "node:test";

import type { CardCatalogSummary } from "@/lib/cards/catalog";

import { scoreScannerCardMatch } from "./catalog-match";

const baseCard: CardCatalogSummary = {
  id: "OP01-001",
  game: "one-piece",
  name: "Monkey.D.Luffy",
  type: "Leader",
  domains: ["Red"],
  tags: [],
  energyCost: 5,
  power: 5000,
  might: null,
  hp: null,
  rarity: "L",
  language: "en",
  text: "Rush into finance.",
  flavor: null,
  setCode: "OP01",
  setName: "Romance Dawn",
  collectorNo: "001",
  imageUrl: null,
  artist: null,
  marketPrice: 12.5,
  financeProductId: "OP01-001",
  fairValue: 13,
  delta24h: 0.2,
  deltaPercent24h: 1.4,
  liquidityScore: 70,
  confidenceScore: 80,
  cashNowValue: 9.8,
  fastSellValue: 10.2,
  maxValueValue: 14.2,
  storeCreditValue: 11.5,
  sourceLabel: "Archive",
  source: "optcgapi-all-set-cards",
  externalUrl: null,
  searchText: "monkey d luffy leader red op01 romance dawn 001",
};

test("scoreScannerCardMatch heavily rewards exact name, set, and collector matches", () => {
  const exactScore = scoreScannerCardMatch(baseCard, {
    name: "Monkey.D.Luffy",
    setGuess: "OP01",
    numberGuess: "001",
    rarityGuess: "L",
    finishGuess: null,
    languageGuess: "en",
    confidence: 0.91,
  });

  const fuzzyScore = scoreScannerCardMatch(baseCard, {
    name: "Luffy",
    setGuess: null,
    numberGuess: null,
    rarityGuess: null,
    finishGuess: null,
    languageGuess: "en",
    confidence: 0.4,
  });

  assert.ok(exactScore > fuzzyScore);
  assert.ok(exactScore >= 90);
});
