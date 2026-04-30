import type { SynergyEdgeRule } from "@/lib/synergy/constants/synergy-types";
import type { ResourceProfile } from "@/lib/synergy/types/card-profile";
import type { SynergyEdgeProfile } from "@/lib/synergy/types/synergy-edge";

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

function hasLowConfidenceRisk(profile: SynergyEdgeProfile) {
  return profile.risks.includes("low_parser_confidence");
}

function hasUnknownMechanics(profile: SynergyEdgeProfile) {
  return profile.tags.includes("unknown") || profile.roles.includes("unknown");
}

function resourcesCompatible(
  produced: ResourceProfile,
  consumed: ResourceProfile,
) {
  if (produced.resource === consumed.resource) {
    return true;
  }

  if (produced.resource === "token" && consumed.resource === "unit") {
    return true;
  }

  if (produced.resource === "mana" && consumed.resource === "energy") {
    return true;
  }

  return produced.resource === "energy" && consumed.resource === "mana";
}

function hasResourceBridge(
  primary: SynergyEdgeProfile,
  secondary: SynergyEdgeProfile,
) {
  return primary.produces.some((produced) =>
    secondary.consumes.some((consumed) => resourcesCompatible(produced, consumed)),
  );
}

function hasPayoffTagMatch(
  rule: SynergyEdgeRule,
  secondary: SynergyEdgeProfile,
) {
  if (!rule.consumerTag) {
    return false;
  }

  return secondary.payoffs.some((payoff) =>
    payoff.tags.includes(rule.consumerTag!),
  );
}

export function scoreSynergyEdge(input: {
  rule: SynergyEdgeRule;
  primary: SynergyEdgeProfile;
  secondary: SynergyEdgeProfile;
}) {
  const { rule, primary, secondary } = input;
  const confidenceAverage = (primary.confidence + secondary.confidence) / 2;
  let score = rule.baseScore;

  score += (confidenceAverage - 0.7) * 12;

  if (rule.producerTag && rule.consumerTag) {
    score += 4;
  }

  if (rule.producerRole && rule.consumerRole) {
    score += 3;
  }

  if (hasResourceBridge(primary, secondary)) {
    score += 5;
  }

  if (hasPayoffTagMatch(rule, secondary)) {
    score += 4;
  }

  if (hasUnknownMechanics(primary)) {
    score -= 6;
  }

  if (hasUnknownMechanics(secondary)) {
    score -= 6;
  }

  if (hasLowConfidenceRisk(primary)) {
    score -= 5;
  }

  if (hasLowConfidenceRisk(secondary)) {
    score -= 5;
  }

  return clampScore(score);
}
