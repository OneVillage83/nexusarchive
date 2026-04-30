import {
  SYNERGY_PACKAGE_INFERENCE_RULES,
  type SynergyPackageInferenceRule,
  type SynergyPackageType,
} from "@/lib/synergy/constants/package-types";
import type { SynergyPackageCandidate } from "@/lib/synergy/types/synergy-package";

export type InferredSynergyPackageType = {
  type: SynergyPackageType;
  rule: SynergyPackageInferenceRule;
  matchedCount: number;
  possibleCount: number;
  confidence: number;
};

function countMatches<T extends string>(required: readonly T[] | undefined, values: Set<T>) {
  return (required ?? []).filter((value) => values.has(value)).length;
}

export function inferSynergyPackageTypes(
  candidate: Pick<SynergyPackageCandidate, "tags" | "roles" | "internalEdges">,
) {
  const tagSet = new Set(candidate.tags);
  const roleSet = new Set(candidate.roles);
  const edgeTypes = new Set(candidate.internalEdges.map((edge) => edge.synergyType));
  const inferred: InferredSynergyPackageType[] = [];

  for (const rule of SYNERGY_PACKAGE_INFERENCE_RULES) {
    const tagMatches = countMatches(rule.tags, tagSet);
    const roleMatches = countMatches(rule.roles, roleSet);
    const possibleCount = (rule.tags?.length ?? 0) + (rule.roles?.length ?? 0);
    const matchedCount = tagMatches + roleMatches;

    if (matchedCount >= rule.minMatches) {
      inferred.push({
        type: rule.type,
        rule,
        matchedCount,
        possibleCount,
        confidence: possibleCount === 0 ? 0 : matchedCount / possibleCount,
      });
    }
  }

  if (
    inferred.length === 0 &&
    (edgeTypes.has("engine_link") ||
      roleSet.has("engine_piece") ||
      tagSet.has("resource_conversion") ||
      tagSet.has("untap"))
  ) {
    const rule = SYNERGY_PACKAGE_INFERENCE_RULES.find(
      (candidateRule) => candidateRule.type === "engine_package",
    );

    if (rule) {
      inferred.push({
        type: "engine_package",
        rule,
        matchedCount: 1,
        possibleCount: Math.max((rule.tags?.length ?? 0) + (rule.roles?.length ?? 0), 1),
        confidence: 0.35,
      });
    }
  }

  return inferred.sort(
    (left, right) =>
      right.confidence - left.confidence ||
      right.matchedCount - left.matchedCount ||
      left.type.localeCompare(right.type),
  );
}
