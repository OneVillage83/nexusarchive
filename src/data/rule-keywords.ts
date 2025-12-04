export const ruleKeywords = [
  // ------------------------------------------------------------
  // 000 — GOLDEN / SILVER RULES
  // ------------------------------------------------------------
  {
    id: "golden-rule",
    terms: [
      "golden rule",
      "card text overrides rules",
      "card text supersedes rules",
      "if card contradicts rules",
      "card beats rule",
      "which wins card or rules"
    ],
    ruleIds: ["000", "001", "002"]
  },
  {
    id: "silver-rule",
    terms: [
      "silver rule",
      "interpret card wording",
      "card terminology rules",
      "cards refer to themselves",
      "can't beats can",
      "cant beats can",
      "impossible instructions",
      "do as much as you can"
    ],
    ruleIds: ["050", "051", "052", "053", "054", "055"]
  },

  // ------------------------------------------------------------
  // 100 — DECK CONSTRUCTION & GAME SETUP
  // ------------------------------------------------------------
  {
    id: "deck-construction",
    terms: [
      "deck building",
      "how to build a deck",
      "deck rules",
      "deck size",
      "deck limit",
      "what can I put in my deck",
      "main deck rules"
    ],
    ruleIds: ["101", "102", "103", "103.1", "103.1.b", "103.2"]
  },
  {
    id: "domain-identity",
    terms: [
      "domain identity",
      "color identity",
      "deck color restrictions",
      "domain restrictions",
      "which domains can my deck use"
    ],
    ruleIds: [
      "103.1.b",
      "103.1.b.1",
      "103.1.b.2",
      "103.1.b.3",
      "103.1.b.4",
      "133"
    ]
  },
  {
    id: "card-types",
    terms: [
      "card types",
      "what are the card types",
      "unit spell gear legend battlefield",
      "types of cards"
    ],
    ruleIds: ["130", "131", "132"]
  },
  {
    id: "supertypes",
    terms: ["supertypes", "champion", "signature", "token supertype"],
    ruleIds: ["132.7"]
  },
  {
    id: "tags",
    terms: ["tags", "card tags", "champion tags", "what does a tag mean"],
    ruleIds: ["132.8"]
  },

  // ------------------------------------------------------------
  // 150 — ZONES / CONTROLLER / OWNER
  // ------------------------------------------------------------
  {
    id: "zones",
    terms: [
      "zones",
      "game zones",
      "what zones exist",
      "board zone",
      "hand zone",
      "trash zone",
      "legend zone",
      "non board zone"
    ],
    ruleIds: ["150", "151", "152", "153"]
  },
  {
    id: "control-vs-own",
    terms: [
      "control vs own",
      "controller",
      "owner",
      "who controls a card",
      "ownership rules"
    ],
    ruleIds: ["160", "161", "162"]
  },
  {
    id: "board",
    terms: ["board", "what is the board", "battlefield layout", "board positions"],
    ruleIds: ["170", "171", "172"]
  },

  // ------------------------------------------------------------
  // 200 — RUNES / CHANNELING / POWER / COSTS
  // ------------------------------------------------------------
  {
    id: "runes",
    terms: [
      "runes",
      "rune deck",
      "what are runes",
      "rune pool",
      "gain runes",
      "domain runes"
    ],
    ruleIds: ["200", "201", "202", "203"]
  },
  {
    id: "channel",
    terms: ["channel", "channeling", "how to channel", "channel phase"],
    ruleIds: ["210", "211"]
  },
  {
    id: "power-cost",
    terms: ["power cost", "pay power", "domain power", "power symbol"],
    ruleIds: ["134.2.e", "133.2"]
  },
  {
    id: "paying-costs",
    terms: [
      "costs",
      "additional costs",
      "extra cost",
      "paying costs",
      "cost reduction",
      "cannot pay cost"
    ],
    ruleIds: ["220", "221", "222"]
  },

  // ------------------------------------------------------------
  // 300 — ABILITIES / TIMING / PLAYING CARDS / CHAIN / PRIORITY
  // ------------------------------------------------------------
  {
    id: "playing-cards",
    terms: [
      "how to play a card",
      "play a card",
      "cast spell",
      "play unit",
      "play timing"
    ],
    ruleIds: ["350", "351", "352"]
  },
  {
    id: "abilities",
    terms: [
      "abilities",
      "activated ability",
      "triggered ability",
      "passive ability",
      "what is an ability"
    ],
    ruleIds: ["357", "360", "361", "362", "363"]
  },
  {
    id: "instructions",
    terms: [
      "instruction text",
      "what is an instruction",
      "spell instructions",
      "ability instructions"
    ],
    ruleIds: ["370"]
  },
  {
    id: "priority",
    terms: [
      "priority",
      "who gets priority",
      "priority rules",
      "maintaining priority",
      "lose priority"
    ],
    ruleIds: ["380", "381", "382"]
  },
  {
    id: "chain",
    terms: [
      "chain",
      "the chain",
      "stack",
      "responding",
      "respond to spell",
      "resolve chain"
    ],
    ruleIds: ["390", "391", "392"]
  },
  {
    id: "timing",
    terms: [
      "timing rules",
      "open state",
      "closed state",
      "when can i play spells",
      "timings"
    ],
    ruleIds: ["400", "401", "402"]
  },

  // ------------------------------------------------------------
  // 400 — TURN STRUCTURE / PHASES / COMBAT / SCORING
  // ------------------------------------------------------------
  {
    id: "turn-structure",
    terms: [
      "turn structure",
      "turn order",
      "what happens each turn",
      "turn phases"
    ],
    ruleIds: ["410", "411", "412"]
  },
  {
    id: "phases",
    terms: [
      "game phases",
      "beginning phase",
      "main phase",
      "combat phase",
      "end phase"
    ],
    ruleIds: ["420", "421", "422", "423"]
  },
  {
    id: "combat",
    terms: [
      "combat",
      "how does combat work",
      "attacking",
      "defending",
      "combat rules",
      "combat resolution"
    ],
    ruleIds: ["430", "431", "432", "433"]
  },
  {
    id: "ganking",
    terms: ["gank", "ganking", "attack from lane", "ganking rules"],
    ruleIds: ["435"]
  },
  {
    id: "scoring",
    terms: [
      "score",
      "scoring",
      "hold",
      "conquer",
      "final point",
      "victory score"
    ],
    ruleIds: ["440", "441", "442", "443", "444", "445"]
  },

  // ------------------------------------------------------------
  // 500 — CONTINUOUS / REPLACEMENT / COPY EFFECTS
  // ------------------------------------------------------------
  {
    id: "replacement-effects",
    terms: ["replacement effect", "instead", "modify event", "as though"],
    ruleIds: ["500", "501"]
  },
  {
    id: "continuous-effects",
    terms: [
      "continuous effect",
      "static effect",
      "always on ability",
      "persistent effect"
    ],
    ruleIds: ["510"]
  },
  {
    id: "copying",
    terms: ["copy", "copying", "copy spell", "copy unit", "copy effect"],
    ruleIds: ["520"]
  },

  // ------------------------------------------------------------
  // 600 — STATE-BASED ACTIONS / DEATH / BUFFS / MIGHTY
  // ------------------------------------------------------------
  {
    id: "state-based-actions",
    terms: ["state based actions", "sba", "automatic checks", "game checks"],
    ruleIds: ["600", "601"]
  },
  {
    id: "death",
    terms: ["death", "dies", "kill", "destroy", "when a unit dies"],
    ruleIds: ["610", "611"]
  },
  {
    id: "buffs",
    terms: ["buffs", "buff counter", "add buff", "spend buff"],
    ruleIds: ["701", "702", "703", "704", "705"]
  },
  {
    id: "mighty",
    terms: ["mighty", "is mighty", "becomes mighty"],
    ruleIds: ["706", "707", "708", "709"]
  },
  {
    id: "bonus-damage",
    terms: ["bonus damage", "extra damage", "additional damage"],
    ruleIds: ["712", "713", "714", "715"]
  },

  // ------------------------------------------------------------
  // 720 — KEYWORD GLOSSARY (STILL SEARCHABLE CONCEPTS)
  // ------------------------------------------------------------
  {
    id: "accelerate",
    terms: ["accelerate", "enter ready", "accelerate cost"],
    ruleIds: ["721"]
  },
  {
    id: "reaction",
    terms: [
      "reaction",
      "instant speed",
      "flash",
      "play during closed state"
    ],
    ruleIds: ["729"]
  },
  {
    id: "shield",
    terms: ["shield", "shield x", "+x might defending"],
    ruleIds: ["730"]
  },
  {
    id: "tank",
    terms: ["tank", "must assign lethal first", "taunt style effect"],
    ruleIds: ["731"]
  },
  {
    id: "temporary",
    terms: ["temporary", "dies at beginning phase"],
    ruleIds: ["732"]
  },
  {
    id: "vision",
    terms: ["vision", "look at top card", "recycle"],
    ruleIds: ["733"]
  }
];
