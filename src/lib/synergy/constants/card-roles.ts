export const CARD_ROLES = [
  "enabler",
  "payoff",
  "engine_piece",
  "combo_piece",
  "finisher",
  "protection",
  "removal",
  "draw",
  "ramp",
  "search",
  "sacrifice_outlet",
  "resource_generator",
  "resource_sink",
  "archetype_core",
  "support_piece",
  "sideboard_tech",
  "unknown",
] as const;

export type CardRole = (typeof CARD_ROLES)[number];
