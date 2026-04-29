import { LOW_PROFILE_CONFIDENCE_THRESHOLD } from "@/lib/synergy/constants/game-config";
import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import type {
  PayoffProfile,
  ResourceProfile,
  TriggerProfile,
} from "@/lib/synergy/types/card-profile";

type ConfidenceInput = {
  normalizedText: string;
  tags: MechanicTag[];
  roles: CardRole[];
  triggers: TriggerProfile[];
  produces: ResourceProfile[];
  consumes: ResourceProfile[];
  payoffs: PayoffProfile[];
};

function roundConfidence(value: number) {
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
}

export function scoreProfileConfidence(input: ConfidenceInput) {
  if (!input.normalizedText) {
    return 0.08;
  }

  let score = 0.22;

  score += Math.min(input.tags.filter((tag) => tag !== "unknown").length * 0.05, 0.3);
  score += Math.min(input.roles.filter((role) => role !== "unknown").length * 0.04, 0.18);
  score += Math.min(input.triggers.length * 0.08, 0.16);
  score += Math.min((input.produces.length + input.consumes.length) * 0.06, 0.18);
  score += Math.min(input.payoffs.length * 0.08, 0.16);

  return roundConfidence(score);
}

export function isLowProfileConfidence(confidence: number) {
  return confidence < LOW_PROFILE_CONFIDENCE_THRESHOLD;
}
