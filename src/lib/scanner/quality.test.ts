import assert from "node:assert/strict";
import test from "node:test";

import {
  computeScannerQualityScore,
  getScannerQualityDecision,
} from "./quality";

test("computeScannerQualityScore applies the weighted quality formula", () => {
  const score = computeScannerQualityScore({
    sharpnessScore: 90,
    glareScore: 80,
    framingScore: 70,
    perspectiveScore: 60,
    resolutionScore: 95,
    frontBackCompletenessScore: 100,
  });

  assert.equal(score, 82);
});

test("getScannerQualityDecision splits reject, id-only, and pregrade thresholds", () => {
  assert.equal(getScannerQualityDecision(49), "reject");
  assert.equal(getScannerQualityDecision(50), "id-only");
  assert.equal(getScannerQualityDecision(69), "id-only");
  assert.equal(getScannerQualityDecision(70), "pregrade");
});
