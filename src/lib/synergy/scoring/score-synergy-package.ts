import type { InferredSynergyPackageType } from "@/lib/synergy/engine/infer-synergy-package";
import type { SynergyPackageCandidate } from "@/lib/synergy/types/synergy-package";

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

function getCompleteGraphEdgeCount(packageSize: number) {
  return (packageSize * (packageSize - 1)) / 2;
}

export function scoreSynergyPackage(input: {
  candidate: SynergyPackageCandidate;
  inference: InferredSynergyPackageType;
}) {
  const { candidate, inference } = input;
  const averageEdgeScore =
    candidate.internalEdges.reduce((total, edge) => total + edge.score, 0) /
    Math.max(candidate.internalEdges.length, 1);
  const completeEdgeCount = getCompleteGraphEdgeCount(candidate.identityKeys.length);
  const edgeDensity = Math.min(
    1,
    candidate.internalEdges.length / Math.max(completeEdgeCount, 1),
  );
  const packageSizeBonus =
    candidate.identityKeys.length === 3 ? 2 : candidate.identityKeys.length === 4 ? 1 : 0;
  const engineBonus = inference.rule.isEngine ? 3 : 0;
  const comboBonus = inference.rule.isCombo ? 3 : 0;
  const winConditionBonus = inference.rule.isWinCondition ? 4 : 0;
  const score =
    averageEdgeScore * 0.72 +
    edgeDensity * 18 +
    inference.confidence * 8 +
    packageSizeBonus +
    engineBonus +
    comboBonus +
    winConditionBonus;

  return clampScore(score);
}
