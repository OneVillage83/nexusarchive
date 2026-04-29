import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";
import type { ResourceProfile } from "@/lib/synergy/types/card-profile";

function extractNumberBefore(normalizedText: string, resource: string) {
  const match = normalizedText.match(new RegExp(`\\b(\\d+)\\s+${resource}\\b`));
  if (!match?.[1]) {
    return undefined;
  }

  const amount = Number.parseInt(match[1], 10);
  return Number.isFinite(amount) ? amount : undefined;
}

export function extractProducedResources(normalizedText: string, tags: MechanicTag[]) {
  const produces: ResourceProfile[] = [];

  if (tags.includes("draw")) {
    produces.push({
      resource: "card",
      amount: extractNumberBefore(normalizedText, "cards?") ?? "variable",
      condition: "draw effect",
    });
  }

  if (tags.includes("token_creation")) {
    produces.push({
      resource: "token",
      amount: extractNumberBefore(normalizedText, "tokens?") ?? "variable",
      condition: "token creation effect",
    });
  }

  if (tags.includes("resource_generation") || tags.includes("ramp")) {
    produces.push({
      resource: normalizedText.includes("mana")
        ? "mana"
        : normalizedText.includes("don")
          ? "don"
          : "energy",
      amount: "variable",
      condition: "resource generation effect",
    });
  }

  if (tags.includes("cost_reduction")) {
    produces.push({
      resource: "cost_reduction",
      amount: extractNumberBefore(normalizedText, "less") ?? "variable",
      condition: "cost reduction effect",
    });
  }

  if (tags.includes("damage") || tags.includes("burn")) {
    produces.push({
      resource: "damage",
      amount: extractNumberBefore(normalizedText, "damage") ?? "variable",
      condition: "damage effect",
    });
  }

  if (tags.includes("untap")) {
    produces.push({
      resource: "ready_state",
      amount: "variable",
      condition: "untap or ready effect",
    });
  }

  return produces;
}

export function extractConsumedResources(normalizedText: string, tags: MechanicTag[]) {
  const consumes: ResourceProfile[] = [];

  if (tags.includes("discard")) {
    consumes.push({
      resource: "card",
      amount: extractNumberBefore(normalizedText, "cards?") ?? "variable",
      condition: "discard cost or outlet",
    });
  }

  if (tags.includes("sacrifice")) {
    consumes.push({
      resource: normalizedText.includes("token") ? "token" : "unit",
      amount: "variable",
      condition: "sacrifice, KO, or trash cost",
    });
  }

  if (tags.includes("life_loss")) {
    consumes.push({
      resource: "life",
      amount: extractNumberBefore(normalizedText, "life") ?? "variable",
      condition: "life payment or loss",
    });
  }

  if (/\b(?:pay|spend)\s+\d+\s+(?:energy|mana|don)\b/.test(normalizedText)) {
    consumes.push({
      resource: normalizedText.includes("mana")
        ? "mana"
        : normalizedText.includes("don")
          ? "don"
          : "energy",
      amount: "variable",
      condition: "resource cost",
    });
  }

  return consumes;
}
