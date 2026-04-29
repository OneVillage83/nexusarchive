import type { CardRole } from "@/lib/synergy/constants/card-roles";
import type { MechanicTag } from "@/lib/synergy/constants/mechanic-tags";

export type MechanicRule = {
  tag: MechanicTag;
  patterns: RegExp[];
  roles?: CardRole[];
};

export const MECHANIC_RULES: MechanicRule[] = [
  {
    tag: "draw",
    patterns: [/\bdraw\b/, /\bdraws?\s+(?:a|one|two|three|\d+)\s+cards?\b/],
    roles: ["draw"],
  },
  {
    tag: "discard",
    patterns: [/\bdiscard\b/, /\bdiscarded\b/],
    roles: ["enabler"],
  },
  {
    tag: "search",
    patterns: [/\bsearch\s+(?:your|the)\s+(?:deck|library)\b/, /\blook\s+at\s+the\s+top\b/],
    roles: ["search"],
  },
  {
    tag: "tutor",
    patterns: [/\bsearch\s+(?:your|the)\s+(?:deck|library).*put.*(?:hand|play)\b/, /\btutor\b/],
    roles: ["search"],
  },
  {
    tag: "ramp",
    patterns: [/\bramp\b/, /\bgain\s+\d+\s+energy\b/, /\badd\s+(?:one|\d+|\{[a-z0-9]+\})\s+mana\b/],
    roles: ["ramp", "resource_generator"],
  },
  {
    tag: "cost_reduction",
    patterns: [/\bcosts?\s+\d+\s+less\b/, /\breduce\s+(?:the\s+)?cost\b/, /\bcost\s+reduction\b/],
    roles: ["enabler"],
  },
  {
    tag: "resource_generation",
    patterns: [
      /\bgain\s+\d+\s+energy\b/,
      /\badd\s+(?:one|\d+|\{[a-z0-9]+\})\s+mana\b/,
      /\badd\s+\d+\s+don\b/,
      /\bcreate\s+(?:a\s+)?treasure\b/,
      /\bgenerate\b/,
    ],
    roles: ["resource_generator"],
  },
  {
    tag: "resource_conversion",
    patterns: [/\bif\s+you\s+do\b/, /\bconvert\b/, /\binstead\b/, /\bspend\b/],
    roles: ["engine_piece"],
  },
  {
    tag: "token_creation",
    patterns: [/\bcreate(?:s)?\b.*\btoken\b/, /\bsummon(?:s)?\b.*\btoken\b/, /\bput\b.*\btoken\b/],
    roles: ["enabler"],
  },
  {
    tag: "wide_board",
    patterns: [/\ball\s+(?:your\s+)?(?:units|creatures|characters)\b/, /\beach\s+(?:unit|creature|character)\b/, /\bfor\s+each\s+(?:unit|creature|character)\b/],
    roles: ["payoff"],
  },
  {
    tag: "sacrifice",
    patterns: [/\bsacrifice\b/, /\bko\s+(?:one|a|\d+)\s+of\s+your\b/, /\btrash\s+(?:one|a|\d+)\s+of\s+your\b/],
    roles: ["sacrifice_outlet", "enabler"],
  },
  {
    tag: "death_trigger",
    patterns: [/\bwhen\b.*\b(?:dies|is destroyed|is ko'?d|is ko'd)\b/, /\bif\b.*\b(?:dies|is destroyed|is ko'?d|is ko'd)\b/],
    roles: ["payoff"],
  },
  {
    tag: "attack_trigger",
    patterns: [/\bwhen\b.*\battacks?\b/, /\bon\s+attack\b/, /\bwhenever\b.*\battacks?\b/],
    roles: ["enabler"],
  },
  {
    tag: "play_trigger",
    patterns: [/\bwhen\s+you\s+play\b/, /\bon\s+play\b/, /\bwhenever\s+you\s+play\b/],
    roles: ["engine_piece"],
  },
  {
    tag: "cast_trigger",
    patterns: [/\bwhen\s+you\s+cast\b/, /\bwhenever\s+you\s+cast\b/, /\bcast\s+a\s+spell\b/],
    roles: ["engine_piece"],
  },
  {
    tag: "enter_trigger",
    patterns: [/\benters?\s+(?:the\s+)?(?:battlefield|field|play)\b/, /\bon\s+summon\b/, /\bwhen\b.*\b(?:is summoned|summoned)\b/],
    roles: ["enabler"],
  },
  {
    tag: "graveyard",
    patterns: [/\bgraveyard\b/, /\btrash\b/, /\bdiscard\s+pile\b/, /\bko'?d\b/],
    roles: ["enabler"],
  },
  {
    tag: "recursion",
    patterns: [/\breturn\b.*\bfrom\b.*\b(?:graveyard|trash|discard\s+pile)\b/, /\breanimate\b/, /\bresurrect\b/],
    roles: ["payoff"],
  },
  {
    tag: "removal",
    patterns: [/\bdestroy\b/, /\bko\b/, /\bbanish\b/, /\bexile\b/, /\breturn\b.*\bto\s+(?:its\s+owner'?s\s+)?hand\b/],
    roles: ["removal"],
  },
  {
    tag: "damage",
    patterns: [/\bdeal\s+(?:\d+|x)\s+damage\b/, /\bdamage\b/],
    roles: ["removal"],
  },
  {
    tag: "burn",
    patterns: [/\bdeal\s+(?:\d+|x)\s+damage\s+to\s+(?:an\s+)?(?:opponent|player|leader|nexus)\b/],
    roles: ["finisher"],
  },
  {
    tag: "buff",
    patterns: [/\bgets?\s+\+\d+/, /\bgains?\s+\+\d+/, /\bgive\b.*\+\d+/, /\bincrease\b.*\bpower\b/],
    roles: ["support_piece"],
  },
  {
    tag: "debuff",
    patterns: [/\bgets?\s+-\d+/, /\bloses?\s+\d+\s+power\b/, /\breduce\b.*\bpower\b/],
    roles: ["removal"],
  },
  {
    tag: "protection",
    patterns: [/\bshield\b/, /\bbarrier\b/, /\bprevent\b/, /\bcan'?t\s+be\b/, /\bcannot\s+be\b/, /\bward\b/, /\bhexproof\b/, /\bindestructible\b/],
    roles: ["protection"],
  },
  {
    tag: "evasion",
    patterns: [/\bflying\b/, /\bunblockable\b/, /\belusive\b/, /\bcan'?t\s+be\s+blocked\b/],
    roles: ["finisher"],
  },
  {
    tag: "copy",
    patterns: [/\bcopy\b/, /\bcopies\b/],
    roles: ["combo_piece"],
  },
  {
    tag: "untap",
    patterns: [/\buntap\b/, /\bready\b/, /\bset\b.*\bactive\b/, /\brestand\b/],
    roles: ["engine_piece"],
  },
  {
    tag: "extra_attack",
    patterns: [/\battack\s+again\b/, /\badditional\s+attack\b/, /\bextra\s+attack\b/],
    roles: ["finisher"],
  },
  {
    tag: "extra_turn",
    patterns: [/\bextra\s+turn\b/, /\btake\s+another\s+turn\b/],
    roles: ["finisher", "combo_piece"],
  },
  {
    tag: "tribal",
    patterns: [/\bshares?\s+a\s+(?:type|trait)\b/, /\b(?:type|trait)\s+you\s+control\b/],
    roles: ["archetype_core"],
  },
  {
    tag: "leader_synergy",
    patterns: [/\bleader\b/, /\bchampion\b/, /\bcommander\b/],
    roles: ["archetype_core"],
  },
  {
    tag: "hand_size_payoff",
    patterns: [/\bif\s+you\s+have\s+\d+\s+or\s+more\s+cards?\s+in\s+hand\b/, /\bfor\s+each\s+card\s+in\s+your\s+hand\b/],
    roles: ["payoff"],
  },
  {
    tag: "graveyard_payoff",
    patterns: [/\bfor\s+each\b.*\b(?:graveyard|trash|discard\s+pile)\b/, /\bif\b.*\b(?:graveyard|trash|discard\s+pile)\b/],
    roles: ["payoff"],
  },
  {
    tag: "token_payoff",
    patterns: [/\bfor\s+each\b.*\btoken\b/, /\btoken\b.*\bgets?\b/, /\bwhenever\b.*\btoken\b/],
    roles: ["payoff"],
  },
  {
    tag: "spell_payoff",
    patterns: [/\bwhenever\s+you\s+cast\b.*\bspell\b/, /\bfor\s+each\s+spell\b/],
    roles: ["payoff"],
  },
  {
    tag: "unit_payoff",
    patterns: [/\bfor\s+each\s+(?:unit|creature|character)\b/, /\bwhenever\b.*\b(?:unit|creature|character)\b/],
    roles: ["payoff"],
  },
  {
    tag: "equipment_payoff",
    patterns: [/\bequipment\b/, /\bequip\b/, /\battached\b/],
    roles: ["payoff"],
  },
  {
    tag: "life_gain",
    patterns: [/\bgain\s+\d+\s+life\b/, /\blifegain\b/],
    roles: ["support_piece"],
  },
  {
    tag: "life_loss",
    patterns: [/\blose\s+\d+\s+life\b/, /\bpays?\s+\d+\s+life\b/],
    roles: ["enabler"],
  },
  {
    tag: "life_payoff",
    patterns: [/\bwhenever\s+you\s+gain\s+life\b/, /\bif\s+you\s+gained\s+life\b/],
    roles: ["payoff"],
  },
  {
    tag: "control",
    patterns: [/\bcounter\b/, /\btap\b/, /\bstun\b/, /\bremove\b/],
    roles: ["support_piece"],
  },
  {
    tag: "tempo",
    patterns: [/\breturn\b.*\bhand\b/, /\btap\b/, /\bcan'?t\s+attack\b/],
    roles: ["support_piece"],
  },
  {
    tag: "aggro",
    patterns: [/\brush\b/, /\bhaste\b/, /\baggressive\b/, /\battack\b.*\bthis\s+turn\b/],
    roles: ["finisher"],
  },
  {
    tag: "combo",
    patterns: [/\bcombo\b/, /\bloop\b/, /\binfinite\b/],
    roles: ["combo_piece"],
  },
];
