export const RESOURCE_TYPES = [
  "card",
  "discarded_card",
  "energy",
  "mana",
  "don",
  "token",
  "unit",
  "creature",
  "graveyard_card",
  "trash_card",
  "life",
  "damage",
  "cost_reduction",
  "attack",
  "ready_state",
  "unknown",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];
