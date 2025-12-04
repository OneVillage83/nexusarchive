// rules-concepts.ts

export interface RulesConcept {
  id: string;
  name: string;
  description: string;
  ruleIds: string[];
  relatedConcepts: string[];
}

export const RULES_CONCEPTS: RulesConcept[] = [
  {
    id: "game-overview",
    name: "Game Overview",
    description:
      "High-level structure of a Riftbound game: what the game is, required components, and the overall turn loop until someone wins.",
    ruleIds: ["100", "102", "300", "302", "303"],
    relatedConcepts: [
      "golden-and-silver-rules",
      "deck-construction",
      "turn-structure-and-phases",
      "modes-of-play",
    ],
  },

  {
    id: "golden-and-silver-rules",
    name: "Golden & Silver Rules",
    description:
      "The fundamental precedence rules: card text overrides rules (Golden Rule) and how card wording interacts with rules terminology (Silver Rule), including “can’t beats can” and impossible-instruction handling.",
    ruleIds: ["000", "001", "050", "051", "052", "053", "054", "055"],
    relatedConcepts: [
      "card-anatomy-and-types",
      "playing-cards-and-costs",
      "targeting-and-choices",
    ],
  },

  {
    id: "deck-construction",
    name: "Deck Construction",
    description:
      "How players build decks: required decks and counts, Champion Legend and Chosen Champion, copy limits, Signature card limits, and Domain Identity constraints on deck contents.",
    ruleIds: ["101", "103", "103.1", "103.2", "103.2.a", "103.2.b", "103.2.c", "103.2.d", "103.3", "103.4"],
    relatedConcepts: [
      "domain-identity",
      "runes-and-rune-pool",
      "battlefields",
      "legends-and-champions",
      "card-anatomy-and-types",
    ],
  },

  {
    id: "domain-identity",
    name: "Domain Identity",
    description:
      "How a deck’s Domain Identity is set by its Champion Legend and how that identity constrains what cards and runes can be included.",
    ruleIds: [
      "103.1.b",
      "103.1.b.1",
      "103.1.b.2",
      "103.1.b.3",
      "103.1.b.4",
      "103.3.a.1",
      "133",
      "133.1",
      "133.2",
      "169",
      "169.1",
    ],
    relatedConcepts: ["deck-construction", "domains", "runes-and-rune-pool", "legends-and-champions"],
  },

  {
    id: "zones-and-play-area",
    name: "Zones & Play Area",
    description:
      "The structure of the play area: the Board, Bases, Battlefield Zone, Facedown Zones, Legend Zone, and how they connect as locations or non-locations.",
    ruleIds: [
      "105",
      "106",
      "106.1",
      "106.2",
      "106.3",
      "106.4",
      "106.5",
      "107",
      "108",
      "109",
    ],
    relatedConcepts: [
      "non-board-zones-and-privacy",
      "battlefields",
      "legends-and-champions",
      "game-objects-and-ownership",
    ],
  },

  {
    id: "non-board-zones-and-privacy",
    name: "Non-Board Zones & Information Levels",
    description:
      "Definition and behavior of all non-board zones (Trash, Champion Zone, Main Deck Zone, Rune Deck Zone, Banishment, Hand) and the Privacy levels: Secret, Private, and Public information.",
    ruleIds: [
      "107.1",
      "107.2",
      "107.3",
      "107.4",
      "107.5",
      "107.6",
      "127",
      "127.1",
      "127.2",
      "127.3",
      "127.4",
      "127.5",
    ],
    relatedConcepts: [
      "zones-and-play-area",
      "game-objects-and-ownership",
      "targeting-and-choices",
      "tokens",
    ],
  },

  {
    id: "game-objects-and-ownership",
    name: "Game Objects & Ownership",
    description:
      "What counts as a Game Object, how ownership is defined for gameplay (including loaned decks), and which entities are objects vs. values.",
    ruleIds: ["119", "120", "121", "122", "123", "124", "125", "126", "126.1"],
    relatedConcepts: [
      "card-anatomy-and-types",
      "units",
      "gear",
      "spells",
      "runes-and-rune-pool",
      "battlefields",
      "tokens",
      "control",
    ],
  },

  {
    id: "card-anatomy-and-types",
    name: "Card Anatomy & Types",
    description:
      "Physical and logical structure of cards: front/back sides, Cost, Name, Categories and Types (Permanents, Spells, Runes, Battlefields, Legends), Supertypes and Tags, Rules Text vs. Flavor Text vs. Illustration.",
    ruleIds: [
      "128",
      "128.1",
      "128.2",
      "128.3",
      "128.4",
      "129",
      "129.1",
      "129.2",
      "129.3",
      "129.4",
      "130",
      "130.1",
      "130.2",
      "130.3",
      "130.4",
      "131",
      "131.1",
      "131.2",
      "131.3",
      "131.4",
      "132",
      "132.3",
      "132.4",
      "132.5",
      "132.6",
      "132.7",
      "132.8",
      "134",
      "134.1",
      "134.2",
      "135",
      "136",
    ],
    relatedConcepts: [
      "domains",
      "units",
      "gear",
      "spells",
      "runes-and-rune-pool",
      "battlefields",
      "legends-and-champions",
      "keywords-and-intrinsic-properties",
    ],
  },

  {
    id: "domains",
    name: "Domains",
    description:
      "The six Domains (Fury, Calm, Mind, Body, Chaos, Order), their symbols, colors, shorthands, and how they appear on cards.",
    ruleIds: ["133", "133.1", "133.2", "133.2.a", "133.2.b", "133.2.c", "133.2.d", "133.2.e", "133.2.f"],
    relatedConcepts: ["domain-identity", "runes-and-rune-pool", "keywords-and-intrinsic-properties"],
  },

  {
    id: "units",
    name: "Units",
    description:
      "Definition of units as card type and Game Objects, their board behavior, Damage and Might, tags, intrinsic properties, and Standard Move with Ganking modifiers.",
    ruleIds: [
      "137",
      "138",
      "138.1",
      "138.1.a",
      "138.1.b",
      "138.2",
      "139",
      "139.1",
      "139.2",
      "139.3",
      "140",
      "140.1",
      "140.2",
      "140.3",
      "140.4",
      "141",
      "141.1",
      "141.2",
      "141.3",
      "141.4",
      "142",
    ],
    relatedConcepts: [
      "gear",
      "spells",
      "tokens",
      "control",
      "combat-and-showdowns",
      "keywords-and-intrinsic-properties",
    ],
  },

  {
    id: "gear",
    name: "Gear",
    description:
      "Gear as card type and Game Objects, how they are played to Base, their Ready state, their interaction with Battlefields, and gear-activated abilities.",
    ruleIds: ["143", "143.1", "143.2", "144", "144.1", "144.2", "144.3", "145", "145.1", "145.2"],
    relatedConcepts: [
      "units",
      "spells",
      "tokens",
      "control",
      "keywords-and-intrinsic-properties",
    ],
  },

  {
    id: "spells",
    name: "Spells",
    description:
      "Spells as card type, when they can be played, how they resolve via the chain, how instructions are ordered and replaced, and intrinsic spell keywords Action and Reaction.",
    ruleIds: [
      "146",
      "147",
      "148",
      "149",
      "150",
      "151",
      "151.1",
      "151.2",
      "151.3",
      "152",
      "152.1",
      "152.2",
      "152.2.a",
      "152.2.b",
    ],
    relatedConcepts: [
      "chains-and-windows",
      "playing-cards-and-costs",
      "targeting-and-choices",
      "keywords-and-intrinsic-properties",
    ],
  },

  {
    id: "runes-and-rune-pool",
    name: "Runes & Rune Pool",
    description:
      "Runes as a separate card type and deck, their role as resource producers, basic runes of each Domain, and how Energy and Power live in the Rune Pool and empty at key times.",
    ruleIds: [
      "153",
      "154",
      "154.1",
      "154.2",
      "155",
      "156",
      "156.1",
      "156.2",
      "157",
      "157.1",
      "157.2",
      "158",
      "159",
      "160",
      "161",
    ],
    relatedConcepts: [
      "deck-construction",
      "domains",
      "playing-cards-and-costs",
      "keywords-and-intrinsic-properties",
    ],
  },

  {
    id: "battlefields",
    name: "Battlefields",
    description:
      "Battlefields as Game Objects and Locations: how many exist, how they are controlled, how they can be targeted, and their passive/triggered abilities.",
    ruleIds: ["162", "163", "163.1", "163.2", "163.3", "163.4", "163.5", "163.6", "163.7", "163.8", "163.9", "164", "165"],
    relatedConcepts: [
      "zones-and-play-area",
      "control",
      "units",
      "combat-and-showdowns",
      "scoring-and-victory",
    ],
  },

  {
    id: "legends-and-champions",
    name: "Legends & Champions",
    description:
      "Legends and Champion Legends as Game Objects, their special zones, immovability, abilities, and how they establish Domain Identity and interact with the Champion Zone.",
    ruleIds: ["166", "167", "167.1", "167.2", "167.3", "167.4", "167.5", "167.6", "167.7", "167.8", "168", "169", "103.1", "103.2.a"],
    relatedConcepts: [
      "deck-construction",
      "domain-identity",
      "zones-and-play-area",
      "runes-and-rune-pool",
    ],
  },

  {
    id: "tokens",
    name: "Tokens",
    description:
      "Tokens as non-card Game Objects created by spells/abilities: how they inherit types, tags, and behaviors from their type, what they lack (no cost, no domains), and how they cease to exist when they leave the board.",
    ruleIds: [
      "170",
      "171",
      "172",
      "173",
      "174",
      "175",
      "175.1",
      "176",
      "176.1",
      "176.2",
      "177",
      "177.1",
      "178",
      "178.1",
      "178.2",
    ],
    relatedConcepts: [
      "units",
      "gear",
      "spells",
      "game-objects-and-ownership",
      "control",
    ],
  },

  {
    id: "control",
    name: "Control",
    description:
      "The concept of control over Battlefields and other Game Objects: contested status, establishing and losing control, and how controller affects ability ownership and decisions.",
    ruleIds: ["179", "180", "181", "181.1", "181.2", "181.3", "181.4", "181.5", "181.6", "182", "183"],
    relatedConcepts: [
      "battlefields",
      "units",
      "gear",
      "tokens",
      "combat-and-showdowns",
      "scoring-and-victory",
    ],
  },

  {
    id: "turn-structure-and-phases",
    name: "Turn Structure & Phases",
    description:
      "The ordered phases and steps of a turn: Start of Turn, Awaken, Beginning (including Scoring), Channel, Draw, Action, Combat/Showdowns, and End of Turn, as well as turn cycling.",
    ruleIds: [
      "301",
      "302",
      "303",
      "304",
      "305",
      "306",
      "314",
      "315",
      "315.1",
      "315.2",
      "315.3",
      "315.4",
      "316",
      "316.3",
      "316.4",
      "316.5",
      "316.6",
      "317",
    ],
    relatedConcepts: [
      "turn-states-priority-focus",
      "chains-and-windows",
      "cleanups",
      "combat-and-showdowns",
      "scoring-and-victory",
    ],
  },

  {
    id: "turn-states-priority-focus",
    name: "Turn States, Priority & Focus",
    description:
      "The four combined turn states (Neutral/Showdown × Open/Closed), how Priority and Focus are gained and passed, and what types of actions are allowed in each state.",
    ruleIds: [
      "307",
      "308",
      "308.1",
      "309",
      "309.1",
      "309.2",
      "310",
      "310.1",
      "310.2",
      "310.3",
      "310.4",
      "311",
      "312",
      "312.1",
      "312.2",
      "312.3",
      "313",
    ],
    relatedConcepts: [
      "chains-and-windows",
      "spells",
      "activated-abilities",
      "triggered-abilities",
    ],
  },

  {
    id: "chains-and-windows",
    name: "Chains & Windows of Opportunity",
    description:
      "The Chain as a temporary zone, Pending vs. Finalized Chain Items, how chains are created and resolved, and Showdowns as special windows where spells are slung back and forth.",
    ruleIds: [
      "325",
      "326",
      "327",
      "328",
      "329",
      "330",
      "331",
      "332",
      "333",
      "334",
      "335",
      "336",
      "337",
      "338",
      "339",
      "340",
      "341",
      "342",
      "343",
      "344",
      "345",
    ],
    relatedConcepts: [
      "turn-states-priority-focus",
      "spells",
      "activated-abilities",
      "triggered-abilities",
      "reflexive-triggers",
    ],
  },

  {
    id: "playing-cards-and-costs",
    name: "Playing Cards & Paying Costs",
    description:
      "The full process of playing a card: moving it to the chain, making choices, determining total cost (including additional costs, increases, and discounts), paying costs (Energy, Power, and non-standard), checking legality, and finalizing resolution.",
    ruleIds: [
      "346",
      "347",
      "348",
      "349",
      "350",
      "351",
      "352",
      "353",
      "354",
      "355",
      "356",
    ],
    relatedConcepts: [
      "runes-and-rune-pool",
      "targeting-and-choices",
      "spells",
      "units",
      "gear",
    ],
  },

  {
    id: "targeting-and-choices",
    name: "Targeting & Choices",
    description:
      "How choices are made when playing cards and abilities: what counts as a target, validity requirements, zones that can be targeted, group targeting, “any number” choices, splitting damage, mandatory choices, and mistargeting behavior on resolution.",
    ruleIds: [
      "352.4",
      "352.5",
      "352.6",
      "352.7",
      "352.8",
      "352.9",
      "352.10",
      "352.11",
      "352.12",
      "352.13",
      "352.14",
      "352.15",
      "352.16",
      "356.3.e",
    ],
    relatedConcepts: [
      "non-board-zones-and-privacy",
      "playing-cards-and-costs",
      "spells",
      "activated-abilities",
      "triggered-abilities",
    ],
  },

  {
    id: "abilities-overview",
    name: "Abilities Overview",
    description:
      "The umbrella definition of abilities (Passive, Replacement, Activated, Triggered, Delayed) and the fact that a card or object can have multiple abilities of multiple types.",
    ruleIds: ["357", "358", "359"],
    relatedConcepts: [
      "passive-and-replacement-effects",
      "activated-abilities",
      "triggered-abilities",
      "reflexive-triggers",
    ],
  },

  {
    id: "passive-and-replacement-effects",
    name: "Passive Abilities & Replacement Effects",
    description:
      "Ongoing rules text that changes the rules or applies conditions, including Replacement Effects using 'instead', how they alter other game effects, and how multiple replacement effects are ordered.",
    ruleIds: ["360", "361", "362", "363", "364", "365", "366", "367", "368"],
    relatedConcepts: [
      "abilities-overview",
      "playing-cards-and-costs",
      "runes-and-rune-pool",
      "keywords-and-intrinsic-properties",
    ],
  },

  {
    id: "activated-abilities",
    name: "Activated Abilities",
    description:
      "Costed, repeatable effects written with 'cost : effect', how they use the chain, when they can be activated (Open State, your turn by default), and how they mirror the card-play process.",
    ruleIds: ["369", "370", "371", "372", "373", "374"],
    relatedConcepts: [
      "abilities-overview",
      "chains-and-windows",
      "turn-states-priority-focus",
      "playing-cards-and-costs",
    ],
  },

  {
    id: "triggered-abilities",
    name: "Triggered Abilities & Subtypes",
    description:
      "Effects that happen when a condition is met (When/At/The Nth time), how conditions and effects are structured, zone-based trigger evaluation, and the standard trigger subcategories: Play, Conquer, Hold, Attack, and Defend triggers.",
    ruleIds: [
      "375",
      "376",
      "376.1",
      "376.2",
      "376.3",
      "376.4",
      "377",
      "378",
    ],
    relatedConcepts: [
      "abilities-overview",
      "chains-and-windows",
      "combat-and-showdowns",
      "scoring-and-victory",
    ],
  },

  {
    id: "reflexive-triggers",
    name: "Reflexive Triggers",
    description:
      "Special triggered abilities that create additional chain items when their condition is met, typically introduced with 'Do this' or 'Do one of the following', including the case where they fire multiple times.",
    ruleIds: ["379", "380", "381"],
    relatedConcepts: [
      "triggered-abilities",
      "chains-and-windows",
      "targeting-and-choices",
    ],
  },

  {
    id: "cleanups",
    name: "Cleanups & Special Cleanups",
    description:
      "Automatic rule passes that check and normalize the game state: victory checks, killing damaged units, resolving contested Battlefields, staging Showdowns/Combats, finalizing pending chain items, and how Special Cleanups add extra steps.",
    ruleIds: ["318", "319", "320", "321", "322", "323"],
    relatedConcepts: [
      "turn-structure-and-phases",
      "combat-and-showdowns",
      "control",
      "scoring-and-victory",
    ],
  },

  {
    id: "combat-and-showdowns",
    name: "Combat & Showdowns",
    description:
      "How Combat is created from contested Battlefields, its steps, how it always includes a Showdown, and how combat interacts with attacker/defender designations, cleanups, and control.",
    ruleIds: [
      "316.4",
      "316.5",
      "322.3",
      "322.4",
      "322.5",
      "322.6",
      "322.7",
      "337",
      "338",
      "339",
      "340",
      "341",
      "342",
      "343",
      "344",
      "345",
      "433",
      "437",
      "440",
    ],
    relatedConcepts: [
      "turn-structure-and-phases",
      "battlefields",
      "units",
      "control",
      "scoring-and-victory",
    ],
  },

  {
    id: "scoring-and-victory",
    name: "Scoring, Holding & Victory",
    description:
      "How players gain points from Holding and Conquering Battlefields, how victory is checked during Cleanups, and the link between control, scoring steps, and the Victory Score.",
    ruleIds: ["315.2.b", "315.2.b.1", "322.1", "441", "442"],
    relatedConcepts: [
      "battlefields",
      "control",
      "combat-and-showdowns",
      "modes-of-play",
    ],
  },

  {
    id: "modes-of-play",
    name: "Modes of Play",
    description:
      "How different Modes of Play affect number and use of Battlefields, turn order, team behavior, and special adjustments to the first turn or scoring rules.",
    ruleIds: ["103.4.a", "113", "113.1", "115.1", "115.1.a", "115.1.b", "115.2", "169.1", "315.2.b.2", "316.2.b.1", "454"],
    relatedConcepts: [
      "game-overview",
      "battlefields",
      "turn-structure-and-phases",
      "scoring-and-victory",
    ],
  },

  {
    id: "keywords-and-intrinsic-properties",
    name: "Keywords & Intrinsic Properties",
    description:
      "The keyword system: short labels that stand in for longer rules text, rules for reminder text and symbols ([E], [M], [A], [C]), and special intrinsic keywords like Action, Reaction, Accelerate, Deflect, Ganking, and Temporary.",
    ruleIds: [
      "134.2.c",
      "134.2.d",
      "134.2.e",
      "152",
      "152.2",
      "716",
      "721",
      "725",
      "726",
      "732",
    ],
    relatedConcepts: [
      "spells",
      "units",
      "gear",
      "runes-and-rune-pool",
      "passive-and-replacement-effects",
      "activated-abilities",
      "triggered-abilities",
    ],
  },
];
