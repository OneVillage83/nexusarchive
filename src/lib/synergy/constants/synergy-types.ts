import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";

export const SYNERGY_EDGE_TYPES = [
  "soft_synergy",
  "direct_synergy",
  "engine_link",
  "combo_setup",
  "protection_link",
  "consistency_link",
  "payoff_link",
  "archetype_link",
] as const;

export type SynergyEdgeType = (typeof SYNERGY_EDGE_TYPES)[number];

export type SynergyEdgeRule = {
  id: string;
  producerTag?: MechanicTag;
  consumerTag?: MechanicTag;
  producerRole?: CardRole;
  consumerRole?: CardRole;
  type: SynergyEdgeType;
  baseScore: number;
  label: string;
  tags?: MechanicTag[];
  roles?: CardRole[];
  requiredConditions?: string[];
  weaknesses?: string[];
};

export const SYNERGY_EDGE_RULES: SynergyEdgeRule[] = [
  {
    id: "token-creator-token-payoff",
    producerTag: "token_creation",
    consumerTag: "token_payoff",
    type: "direct_synergy",
    baseScore: 75,
    label: "Token creator supports token payoff",
    tags: ["token_creation", "token_payoff"],
    roles: ["enabler", "payoff"],
    requiredConditions: ["Token payoff needs tokens to be created or present."],
    weaknesses: ["Weak if the token creator is removed before producing tokens."],
  },
  {
    id: "sacrifice-death-trigger",
    producerTag: "sacrifice",
    consumerTag: "death_trigger",
    type: "engine_link",
    baseScore: 82,
    label: "Sacrifice outlet enables death trigger payoff",
    tags: ["sacrifice", "death_trigger"],
    roles: ["sacrifice_outlet", "payoff", "engine_piece"],
    requiredConditions: ["A unit, creature, or character must be available to sacrifice."],
    weaknesses: ["Needs multiple pieces online and can be disrupted by removal."],
  },
  {
    id: "discard-graveyard-payoff",
    producerTag: "discard",
    consumerTag: "graveyard_payoff",
    type: "direct_synergy",
    baseScore: 78,
    label: "Discard outlet fuels graveyard payoff",
    tags: ["discard", "graveyard_payoff"],
    roles: ["enabler", "payoff"],
    requiredConditions: ["Cards must reach the graveyard, trash, or discard pile."],
    weaknesses: ["Weak against effects that exile or clear the graveyard."],
  },
  {
    id: "draw-hand-size-payoff",
    producerTag: "draw",
    consumerTag: "hand_size_payoff",
    type: "payoff_link",
    baseScore: 72,
    label: "Draw supports hand-size payoff",
    tags: ["draw", "hand_size_payoff"],
    roles: ["draw", "payoff"],
    requiredConditions: ["The deck must be able to keep enough cards in hand."],
    weaknesses: ["Weak if the deck empties its hand too quickly."],
  },
  {
    id: "resource-generator-resource-sink",
    producerTag: "resource_generation",
    consumerRole: "resource_sink",
    type: "engine_link",
    baseScore: 76,
    label: "Resource generation feeds resource sink",
    tags: ["resource_generation"],
    roles: ["resource_generator", "resource_sink", "engine_piece"],
    requiredConditions: ["The generated resource must be usable by the payoff card."],
    weaknesses: ["Weak if the payoff cannot spend the generated resource efficiently."],
  },
  {
    id: "search-combo-piece",
    producerRole: "search",
    consumerRole: "combo_piece",
    type: "consistency_link",
    baseScore: 68,
    label: "Search improves combo consistency",
    tags: ["search", "combo"],
    roles: ["search", "combo_piece"],
    requiredConditions: ["The search effect must be able to find the combo piece."],
    weaknesses: ["Does not win alone and can be slowed by search restrictions."],
  },
  {
    id: "protection-engine-piece",
    producerRole: "protection",
    consumerRole: "engine_piece",
    type: "protection_link",
    baseScore: 65,
    label: "Protection supports engine piece",
    tags: ["protection"],
    roles: ["protection", "engine_piece"],
    requiredConditions: ["The engine piece must be important enough to protect."],
    weaknesses: ["Protection is lower value if the engine piece is not under pressure."],
  },
  {
    id: "removal-control-plan",
    producerRole: "removal",
    consumerTag: "control",
    type: "archetype_link",
    baseScore: 62,
    label: "Removal supports control game plan",
    tags: ["removal", "control"],
    roles: ["removal", "support_piece"],
    requiredConditions: ["The deck needs a control plan that benefits from interaction."],
    weaknesses: ["Removal can be dead against low-target or resilient strategies."],
  },
  {
    id: "cost-reduction-cast-payoff",
    producerTag: "cost_reduction",
    consumerTag: "cast_trigger",
    type: "combo_setup",
    baseScore: 66,
    label: "Cost reduction helps trigger cast payoffs",
    tags: ["cost_reduction", "cast_trigger"],
    roles: ["enabler", "engine_piece"],
    requiredConditions: ["The reduced card type must match the payoff trigger."],
    weaknesses: ["Timing or card-type restrictions can prevent the setup."],
  },
  {
    id: "cost-reduction-play-payoff",
    producerTag: "cost_reduction",
    consumerTag: "play_trigger",
    type: "combo_setup",
    baseScore: 66,
    label: "Cost reduction helps trigger play payoffs",
    tags: ["cost_reduction", "play_trigger"],
    roles: ["enabler", "engine_piece"],
    requiredConditions: ["The reduced card type must match the payoff trigger."],
    weaknesses: ["Timing or card-type restrictions can prevent the setup."],
  },
];
