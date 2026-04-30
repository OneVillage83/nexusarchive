import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";

export const SYNERGY_PACKAGE_TYPES = [
  "token_package",
  "sacrifice_package",
  "graveyard_package",
  "draw_package",
  "resource_package",
  "removal_package",
  "protection_package",
  "aggro_package",
  "control_package",
  "combo_setup_package",
  "engine_package",
  "archetype_core_package",
] as const;

export type SynergyPackageType = (typeof SYNERGY_PACKAGE_TYPES)[number];

export type SynergyPackageInferenceRule = {
  type: SynergyPackageType;
  tags?: MechanicTag[];
  roles?: CardRole[];
  minMatches: number;
  isEngine?: boolean;
  isCombo?: boolean;
  isWinCondition?: boolean;
  label: string;
  playPattern: string;
};

export const SYNERGY_PACKAGE_INFERENCE_RULES: SynergyPackageInferenceRule[] = [
  {
    type: "sacrifice_package",
    tags: ["token_creation", "sacrifice", "death_trigger"],
    roles: ["sacrifice_outlet", "payoff"],
    minMatches: 3,
    isEngine: true,
    label: "Sacrifice Package",
    playPattern:
      "Create or supply expendable units, sacrifice them for value, then convert death triggers into cards, damage, resources, or board advantage.",
  },
  {
    type: "token_package",
    tags: ["token_creation", "token_payoff", "wide_board"],
    roles: ["enabler", "payoff"],
    minMatches: 2,
    isEngine: true,
    label: "Token Package",
    playPattern:
      "Create tokens, keep a wide board, and use payoffs that reward token-heavy board states.",
  },
  {
    type: "graveyard_package",
    tags: ["discard", "graveyard_payoff", "recursion", "graveyard"],
    roles: ["enabler", "payoff"],
    minMatches: 3,
    isEngine: true,
    label: "Graveyard Package",
    playPattern:
      "Move cards into the graveyard, trash, or discard pile, then turn that zone into recursion or payoff value.",
  },
  {
    type: "resource_package",
    tags: ["resource_generation", "ramp", "resource_conversion", "draw"],
    roles: ["resource_generator", "resource_sink"],
    minMatches: 3,
    isEngine: true,
    label: "Resource Package",
    playPattern:
      "Generate extra resources, spend them through resource sinks, and convert the surplus into card flow or board advantage.",
  },
  {
    type: "draw_package",
    tags: ["draw", "hand_size_payoff"],
    roles: ["draw", "payoff"],
    minMatches: 2,
    isEngine: true,
    label: "Draw Package",
    playPattern:
      "Use repeatable card draw to keep options flowing and enable payoffs that care about hand size.",
  },
  {
    type: "control_package",
    tags: ["removal", "draw", "protection", "control"],
    roles: ["removal", "draw", "protection", "support_piece"],
    minMatches: 3,
    label: "Control Package",
    playPattern:
      "Trade resources with removal and protection, then pull ahead with card advantage or resilient engine pieces.",
  },
  {
    type: "removal_package",
    tags: ["removal", "damage", "debuff"],
    roles: ["removal"],
    minMatches: 2,
    label: "Removal Package",
    playPattern:
      "Combine removal and damage effects to clear blockers, protect tempo, or keep opposing engines offline.",
  },
  {
    type: "protection_package",
    tags: ["protection"],
    roles: ["protection", "engine_piece"],
    minMatches: 2,
    label: "Protection Package",
    playPattern:
      "Protect key engine pieces or payoffs so the deck can keep its main plan online across interaction.",
  },
  {
    type: "combo_setup_package",
    tags: ["combo", "search", "protection", "cost_reduction", "play_trigger", "cast_trigger"],
    roles: ["combo_piece", "search", "protection"],
    minMatches: 3,
    isCombo: true,
    label: "Combo Setup Package",
    playPattern:
      "Find key pieces, reduce setup friction, and protect the cards needed for a future ordered combo chain.",
  },
  {
    type: "aggro_package",
    tags: ["aggro", "buff", "burn", "damage", "wide_board"],
    roles: ["finisher", "enabler"],
    minMatches: 3,
    isWinCondition: true,
    label: "Aggro Package",
    playPattern:
      "Apply pressure early, amplify attackers or damage, and convert board presence into a finishing threat.",
  },
  {
    type: "archetype_core_package",
    tags: ["tribal", "leader_synergy"],
    roles: ["archetype_core"],
    minMatches: 2,
    label: "Archetype Core Package",
    playPattern:
      "Cluster cards around a shared leader, trait, type, or archetype rule that defines the deck's core identity.",
  },
  {
    type: "engine_package",
    tags: ["resource_conversion", "untap", "copy", "draw"],
    roles: ["engine_piece", "payoff", "enabler"],
    minMatches: 3,
    isEngine: true,
    label: "Engine Package",
    playPattern:
      "Link enablers and payoffs into a repeatable value pattern that can snowball over multiple turns.",
  },
];
