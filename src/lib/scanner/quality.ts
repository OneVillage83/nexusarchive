import type { ScannerQualityDecision } from "./types";

type QualityScoreInput = {
  sharpnessScore: number;
  glareScore: number;
  framingScore: number;
  perspectiveScore: number;
  resolutionScore: number;
  frontBackCompletenessScore: number;
};

export function clampScannerScore(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function normalizePercentScore(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return 0;
  }

  return Math.round(clampScannerScore(value, 0, 100));
}

export function computeScannerQualityScore(input: QualityScoreInput) {
  return Math.round(
    normalizePercentScore(input.sharpnessScore) * 0.3 +
      normalizePercentScore(input.glareScore) * 0.2 +
      normalizePercentScore(input.framingScore) * 0.15 +
      normalizePercentScore(input.perspectiveScore) * 0.15 +
      normalizePercentScore(input.resolutionScore) * 0.1 +
      normalizePercentScore(input.frontBackCompletenessScore) * 0.1,
  );
}

export function getScannerQualityDecision(
  qualityScore: number | null | undefined,
): ScannerQualityDecision | null {
  if (qualityScore == null || !Number.isFinite(qualityScore)) {
    return null;
  }

  if (qualityScore < 50) {
    return "reject";
  }

  if (qualityScore < 70) {
    return "id-only";
  }

  return "pregrade";
}
