import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import type { TriggerProfile } from "@/lib/synergy/types/card-profile";

function includesAny(tags: MechanicTag[], candidates: MechanicTag[]) {
  return candidates.some((candidate) => tags.includes(candidate));
}

export function extractTriggers(normalizedText: string, tags: MechanicTag[]) {
  const triggers: TriggerProfile[] = [];
  const isOnce = /\bonce\s+(?:per|each)\s+turn\b/.test(normalizedText);
  const frequency = isOnce ? "once" : "repeatable";

  if (tags.includes("attack_trigger")) {
    triggers.push({
      event: "attack",
      condition: "when this or another card attacks",
      frequency,
    });
  }

  if (tags.includes("death_trigger")) {
    triggers.push({
      event: "death",
      condition: "when a card dies, is destroyed, or is KO'd",
      frequency,
    });
  }

  if (tags.includes("enter_trigger")) {
    triggers.push({
      event: "enter",
      condition: "when this card enters play or is summoned",
      frequency: "once",
    });
  }

  if (tags.includes("play_trigger")) {
    triggers.push({
      event: "play",
      condition: "when a card is played",
      frequency,
    });
  }

  if (tags.includes("cast_trigger")) {
    triggers.push({
      event: "cast",
      condition: "when a spell is cast",
      frequency,
    });
  }

  if (includesAny(tags, ["life_payoff", "token_payoff", "spell_payoff", "unit_payoff"])) {
    triggers.push({
      event: "payoff_condition",
      condition: "when the referenced payoff condition is met",
      frequency,
    });
  }

  return triggers;
}
