import type { InferredSynergyPackageType } from "@/lib/synergy/engine/infer-synergy-package";
import type { SynergyPackageCandidate } from "@/lib/synergy/types/synergy-package";

function dedupe(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function explainSynergyPackage(input: {
  candidate: SynergyPackageCandidate;
  inference: InferredSynergyPackageType;
}) {
  const { candidate, inference } = input;
  const label = inference.rule.label.toLowerCase();
  const explanation = `This ${candidate.identityKeys.length}-card ${label} is built from connected direct synergy edges. The cards support the same mechanical plan rather than functioning as isolated pieces.`;
  const requiredConditions = dedupe([
    ...candidate.internalEdges.flatMap((edge) => edge.requiredConditions),
    "The package needs enough pieces online to connect its enablers and payoffs.",
  ]);
  const weaknesses = dedupe([
    ...candidate.internalEdges.flatMap((edge) => edge.weaknesses),
    "Needs multiple pieces online.",
    "Can be disrupted by removal, timing restrictions, or missing enablers.",
  ]);

  return {
    explanation,
    playPattern: inference.rule.playPattern,
    requiredConditions,
    weaknesses,
  };
}
