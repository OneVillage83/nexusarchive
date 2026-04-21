import assert from "node:assert/strict";
import test from "node:test";

import { isMarketSnapshotFresh } from "./google-market";
import { getCandidateTier } from "./refresh";

test("getCandidateTier keeps movers and reversals in the high-velocity lane", () => {
  assert.equal(
    getCandidateTier(
      {
        marketPrice: 65,
        liquidityScore: 92,
      } as never,
      "hottestMovers",
    ),
    "tier1",
  );
  assert.equal(
    getCandidateTier(
      {
        marketPrice: 22,
        liquidityScore: 70,
      } as never,
      "biggestReversals",
    ),
    "tier1",
  );
});

test("getCandidateTier keeps stable midrange playables in tier2 and the long tail in tier3", () => {
  assert.equal(
    getCandidateTier(
      {
        marketPrice: 18,
        liquidityScore: 60,
      } as never,
      "rawVsGraded",
    ),
    "tier2",
  );
  assert.equal(
    getCandidateTier(
      {
        marketPrice: 2,
        liquidityScore: 25,
      } as never,
      "buylistSpreadLeaders",
    ),
    "tier3",
  );
});

test("isMarketSnapshotFresh respects the tier TTL windows", () => {
  const now = new Date("2026-04-20T18:00:00.000Z");

  assert.equal(
    isMarketSnapshotFresh("2026-04-20T13:00:00.000Z", "tier1", now),
    true,
  );
  assert.equal(
    isMarketSnapshotFresh("2026-04-20T05:00:00.000Z", "tier1", now),
    false,
  );
  assert.equal(
    isMarketSnapshotFresh("2026-04-20T07:30:00.000Z", "tier2", now),
    true,
  );
  assert.equal(
    isMarketSnapshotFresh("2026-04-19T20:00:00.000Z", "tier3", now),
    true,
  );
  assert.equal(
    isMarketSnapshotFresh("2026-04-19T03:00:00.000Z", "tier3", now),
    false,
  );
});
