import type { SynergyEdgeRule } from "@/lib/synergy/constants/synergy-types";
import type { SynergyEdgeProfile } from "@/lib/synergy/types/synergy-edge";

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function explainSynergyEdge(input: {
  rule: SynergyEdgeRule;
  primary: SynergyEdgeProfile;
  secondary: SynergyEdgeProfile;
}) {
  const { rule, primary, secondary } = input;
  const explanation = `${primary.name} helps ${secondary.name}: ${rule.label.toLowerCase()}.`;
  const requiredConditions = dedupe([
    ...(rule.requiredConditions ?? []),
    "Both cards need to be playable in the same deck or game plan.",
  ]);
  const weaknesses = dedupe([
    ...(rule.weaknesses ?? []),
    ...(primary.risks.includes("low_parser_confidence") ||
    secondary.risks.includes("low_parser_confidence")
      ? ["Parser confidence is low; review this edge before relying on it."]
      : []),
  ]);

  return {
    explanation,
    requiredConditions,
    weaknesses,
  };
}
