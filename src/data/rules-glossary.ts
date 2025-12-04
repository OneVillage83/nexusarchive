export const rulesGlossary = [
  // ------------------------------------------------------------
  // 000 — GOLDEN / SILVER RULES
  // ------------------------------------------------------------
  {
    id: "golden-rule",
    term: "Golden Rule",
    definition:
      "When card text contradicts the rules, the card text takes precedence and is treated as correct for that situation.",
    aliases: [
      "golden rules",
      "card text overrides rules",
      "card text supersedes rules",
      "card beats rules",
      "card vs rules",
      "card text vs rules",
      "rules vs card text"
    ],
    relatedRules: ["000", "001", "002"]
  },
  {
    id: "silver-rule",
    term: "Silver Rule",
    definition:
      "Card text uses its own terminology but should be interpreted according to the comprehensive rules, not as if the card were itself a rules document.",
    aliases: [
      "silver rules",
      "card wording interpretation",
      "interpret card wording",
      "card terminology rules",
      "card language vs rules",
      "card text interpretation"
    ],
    relatedRules: ["050", "051"]
  },
  {
    id: "cant-beats-can",
    term: "Can't Beats Can",
    definition:
      "When two effects conflict, an effect that forbids an action takes precedence over an effect that allows it.",
    aliases: [
      "cant beats can",
      "can’t vs can",
      "cannot vs can",
      "forbid vs allow",
      "prohibition beats permission",
      "forbidding effect wins"
    ],
    relatedRules: ["054", "054.1"]
  },
  {
    id: "do-as-much-as-you-can",
    term: "Do As Much As You Can",
    definition:
      "When resolving card instructions, you carry out as many instructions as are possible and ignore the parts that cannot happen.",
    aliases: [
      "do as much as possible",
      "resolve as much as you can",
      "partial resolution",
      "impossible instructions",
      "ignore impossible instructions"
    ],
    relatedRules: ["055", "055.1"]
  },

  // ------------------------------------------------------------
  // 100–140 — GAME OBJECTS / DECKS / DOMAINS / RULES TEXT
  // ------------------------------------------------------------
  {
    id: "game-object",
    term: "Game Object",
    definition:
      "Any entity that exists in the game state, such as cards, tokens, buffs, and other created objects that can be referenced by rules.",
    aliases: [
      "game objects",
      "object",
      "objects",
      "permanent or spell",
      "thing in the game",
      "entity in play"
    ],
    relatedRules: ["100", "130", "170"]
  },
  {
    id: "card",
    term: "Card",
    definition:
      "A main-deck game object printed on a physical card. In rules text, 'card' usually refers to main-deck cards and not runes, legends, or battlefields unless specified.",
    aliases: [
      "cards",
      "main deck card",
      "main-deck card",
      "physical card",
      "card in deck"
    ],
    relatedRules: ["052", "130", "134"]
  },
  {
    id: "main-deck",
    term: "Main Deck",
    definition:
      "The deck of at least the minimum required number of cards that a player uses during the game. It contains units, spells, and gear that match the deck’s Domain Identity.",
    aliases: [
      "maindeck",
      "main decks",
      "deck",
      "decks",
      "library",
      "card deck"
    ],
    relatedRules: ["101", "102", "103", "103.2"]
  },
  {
    id: "rune-deck",
    term: "Rune Deck",
    definition:
      "A separate deck made of rune cards that define a player's resource progression. Runes from this deck are channeled to build the Rune Pool.",
    aliases: [
      "rune decks",
      "rune pile",
      "rune stack",
      "resource deck",
      "rune card deck"
    ],
    relatedRules: ["103", "200", "201", "202"]
  },
  {
    id: "battlefield-card",
    term: "Battlefield",
    definition:
      "A special card that represents a location where units can be placed and combat occurs. Battlefields usually start the game in play or are chosen during setup.",
    aliases: [
      "battlefields",
      "field",
      "fields",
      "lane",
      "lanes",
      "board lane",
      "board slot",
      "battlefield card",
      "battlefield zone"
    ],
    relatedRules: ["103", "132.6.a", "171"]
  },
  {
    id: "legend-card",
    term: "Legend",
    definition:
      "A special card type that represents an iconic character or entity associated with a Champion. It starts in the Legend Zone and usually does not leave that zone during play.",
    aliases: [
      "legends",
      "legendary card",
      "legendary",
      "legend type"
    ],
    relatedRules: ["103", "132.6.b"]
  },
  {
    id: "champion-legend",
    term: "Champion Legend",
    definition:
      "A specific Legend card chosen before the game that defines your Domain Identity and links to the Champion Units that can serve as your Chosen Champion.",
    aliases: [
      "champion legends",
      "legend champion",
      "legendary champion",
      "leader legend",
      "hero legend"
    ],
    relatedRules: ["103", "103.1", "103.1.a", "103.1.b"]
  },
  {
    id: "chosen-champion",
    term: "Chosen Champion",
    definition:
      "A specific Champion Unit that starts in the Champion Zone and represents your main hero. All copies of that same name count as your Chosen Champion for rules that care.",
    aliases: [
      "chosen champions",
      "champion",
      "main champion",
      "starting champion",
      "hero unit"
    ],
    relatedRules: ["103.2.a", "103.2.a.1", "103.2.a.2", "103.2.a.3"]
  },
  {
    id: "domain",
    term: "Domain",
    definition:
      "One of the six elemental or thematic alignments in Riftbound. Domains define card identity and are indicated by symbols and associated colors on cards.",
    aliases: [
      "domains",
      "color",
      "colors",
      "color identity piece",
      "element",
      "elements"
    ],
    relatedRules: ["133", "133.1", "133.2"]
  },
  {
    id: "domain-identity",
    term: "Domain Identity",
    definition:
      "The set of Domains defined by your Champion Legend. All cards in your Main Deck must match that identity: single-domain cards must share a domain, and multi-domain cards must fit inside the identity.",
    aliases: [
      "domain identities",
      "color identity",
      "color identities",
      "deck colors",
      "deck color identity",
      "allowed colors",
      "deck domain rules"
    ],
    relatedRules: ["103.1.b", "103.1.b.1", "103.1.b.2", "103.1.b.3", "103.1.b.4"]
  },
  {
    id: "supertype",
    term: "Supertype",
    definition:
      "A category that appears before a card’s type and can apply to multiple types. Examples include Champion, Signature, and Token, each with its own deckbuilding or rules impact.",
    aliases: [
      "supertypes",
      "card supertype",
      "champion supertype",
      "signature supertype",
      "token supertype"
    ],
    relatedRules: ["132.7"]
  },
  {
    id: "tag",
    term: "Tag",
    definition:
      "A label that appears after a card’s type, used to group cards for rules and effects. Champion Tags link Champion Legends, Champion Units, and Signature cards.",
    aliases: [
      "tags",
      "card tag",
      "card tags",
      "champion tag",
      "champion tags",
      "tribe",
      "tribal tag"
    ],
    relatedRules: ["132.8"]
  },
  {
    id: "rules-text",
    term: "Rules Text",
    definition:
      "The text box section of a card that describes abilities, instructions, keywords, and symbols that affect gameplay. It can sometimes be empty.",
    aliases: [
      "card text",
      "rules box",
      "text box",
      "effect text",
      "ability text"
    ],
    relatedRules: ["134", "134.1", "134.3"]
  },
  {
    id: "ability",
    term: "Ability",
    definition:
      "A discrete piece of rules text that describes what a card may or must do. Abilities can be activated, triggered, or passive, and can appear on any card type.",
    aliases: [
      "abilities",
      "card ability",
      "card abilities",
      "effect ability",
      "spell ability"
    ],
    relatedRules: ["134.2.a", "357", "360", "361", "362", "363"]
  },
  {
    id: "instruction",
    term: "Instruction",
    definition:
      "A line or clause within the rules text of a spell or ability that describes an action to perform as the spell or ability resolves.",
    aliases: [
      "instructions",
      "effect instruction",
      "rules instruction",
      "resolve instruction",
      "effect line"
    ],
    relatedRules: ["134.2.b", "370"]
  },
  {
    id: "keyword",
    term: "Keyword",
    definition:
      "A short word or phrase that stands in for a longer ability or rules text. Some keywords have reminder text but their meaning is fully defined in the comprehensive rules.",
    aliases: [
      "keywords",
      "keyword ability",
      "keyword abilities",
      "mechanic keyword"
    ],
    relatedRules: ["134.2.c", "716", "717", "720"]
  },
  {
    id: "reminder-text",
    term: "Reminder Text",
    definition:
      "Italicized, parenthetical text on a card that summarizes rules or keyword behavior. It is not rules text and does not affect how the game functions.",
    aliases: [
      "reminder texts",
      "reminder",
      "reminder box",
      "helper text",
      "italic text"
    ],
    relatedRules: ["134.2.d"]
  },
  {
    id: "symbol",
    term: "Symbol",
    definition:
      "A visual icon used in rules text to represent game concepts like exhausting, Might, and Power of a given Domain. Each symbol has a written shorthand in the rules.",
    aliases: [
      "symbols",
      "icon",
      "icons",
      "rules symbol",
      "mana symbol",
      "domain symbol"
    ],
    relatedRules: ["134.2.e", "133.2"]
  },
  {
    id: "might",
    term: "Might",
    definition:
      "A numeric trait that represents a unit’s combat strength. It determines how much damage the unit deals in combat and is used in checks like whether a unit is Mighty.",
    aliases: [
      "power stat",
      "attack",
      "attack value",
      "might stat",
      "M stat"
    ],
    relatedRules: ["134.2.e.3", "450.3", "706", "708"]
  },
  {
    id: "power",
    term: "Power",
    definition:
      "The resource spent from the Rune Pool to pay card costs. It is associated with Domains and represented by domain symbols or a generic symbol for any Domain.",
    aliases: [
      "power points",
      "mana",
      "resource",
      "resources",
      "rune power",
      "domain power"
    ],
    relatedRules: ["133.2", "134.2.e.4", "134.2.e.5", "134.2.e.6"]
  },
  {
    id: "rune-pool",
    term: "Rune Pool",
    definition:
      "The collection of Power a player currently has available to spend, generated by channeling runes and other effects.",
    aliases: [
      "mana pool",
      "resource pool",
      "pool",
      "rune resources",
      "available power"
    ],
    relatedRules: ["200", "201", "202"]
  },

  // ------------------------------------------------------------
  // 150–180 — ZONES / BOARD / OWNER / CONTROLLER
  // ------------------------------------------------------------
  {
    id: "zone",
    term: "Zone",
    definition:
      "A region of the game where game objects can exist, such as the Board, Hand, Main Deck, Rune Deck, Trash, and specialty zones like the Legend or Champion Zone.",
    aliases: [
      "zones",
      "game zone",
      "game zones",
      "area",
      "areas of play",
      "location"
    ],
    relatedRules: ["150", "151", "152", "153"]
  },
  {
    id: "board",
    term: "Board",
    definition:
      "The shared play area that contains battlefields and the units and permanents on them. Objects on the Board are considered in play.",
    aliases: [
      "the board",
      "battlefield area",
      "board state",
      "field of play",
      "in play"
    ],
    relatedRules: ["170", "171", "172"]
  },
  {
    id: "non-board-zone",
    term: "Non-Board Zone",
    definition:
      "Any zone that is not the Board, such as a player’s Hand, Main Deck, Rune Deck, Trash, or Legend-related zones. Many effects are defined differently in non-board zones.",
    aliases: [
      "off-board zone",
      "off board zone",
      "nonboard zone",
      "hidden zone",
      "public zone"
    ],
    relatedRules: ["150", "152", "711"]
  },
  {
    id: "hand-zone",
    term: "Hand",
    definition:
      "A private zone containing cards a player currently holds and may usually play from. Cards in hand are known only to that player unless revealed.",
    aliases: [
      "hand",
      "hands",
      "cards in hand",
      "in hand",
      "my hand",
      "your hand"
    ],
    relatedRules: ["150", "151"]
  },
  {
    id: "trash-zone",
    term: "Trash",
    definition:
      "The discard or graveyard zone where cards go after being played or destroyed, unless an effect moves them elsewhere.",
    aliases: [
      "graveyard",
      "yard",
      "gy",
      "discard",
      "discard pile",
      "bin",
      "trash pile"
    ],
    relatedRules: ["150", "171", "705"]
  },
  {
    id: "legend-zone",
    term: "Legend Zone",
    definition:
      "The zone where Legend cards, such as the Champion Legend, reside. They usually start the game here and often cannot leave it.",
    aliases: [
      "legend zones",
      "legend area",
      "legendary zone",
      "legend row"
    ],
    relatedRules: ["132.6.b", "103.1.a"]
  },
  {
    id: "champion-zone",
    term: "Champion Zone",
    definition:
      "The zone where the Chosen Champion Unit starts the game and may return to, distinct from the Board and other zones.",
    aliases: [
      "champion zones",
      "champion area",
      "champion row",
      "hero zone"
    ],
    relatedRules: ["103.2.a.1", "705.1"]
  },
  {
    id: "owner",
    term: "Owner",
    definition:
      "The player who started the game with a particular card in their deck or who created a token. Ownership does not change even if control does.",
    aliases: [
      "owners",
      "card owner",
      "card owners",
      "original owner",
      "who owns the card"
    ],
    relatedRules: ["160", "161"]
  },
  {
    id: "controller",
    term: "Controller",
    definition:
      "The player currently controlling a game object. Control can change due to effects and is distinct from ownership.",
    aliases: [
      "controllers",
      "card controller",
      "who controls",
      "control of card",
      "who has control"
    ],
    relatedRules: ["160", "162"]
  },

  // ------------------------------------------------------------
  // 200–230 — RUNES / CHANNELING / COSTS
  // ------------------------------------------------------------
  {
    id: "rune",
    term: "Rune",
    definition:
      "A type of card used to build a player’s resources over time. Runes are channeled to add Power to the Rune Pool.",
    aliases: [
      "runes",
      "rune card",
      "rune cards",
      "resource rune",
      "ramp rune"
    ],
    relatedRules: ["200", "201", "202"]
  },
  {
    id: "channel",
    term: "Channel",
    definition:
      "The process of revealing and moving runes in order to add Power to your Rune Pool. This generally happens in a specific phase of the turn.",
    aliases: [
      "channeling",
      "channel runes",
      "gain runes",
      "add runes",
      "rune ramp"
    ],
    relatedRules: ["210", "211", "458.7"]
  },
  {
    id: "cost",
    term: "Cost",
    definition:
      "The requirement that must be paid to play a card or activate an ability. Costs often involve spending Power, exhausting permanents, or paying additional specified resources.",
    aliases: [
      "costs",
      "card cost",
      "mana cost",
      "resource cost",
      "play cost",
      "activation cost"
    ],
    relatedRules: ["220", "221", "222", "721.1"]
  },
  {
    id: "additional-cost",
    term: "Additional Cost",
    definition:
      "A cost that must be paid in addition to the main cost of playing a card or activating an ability, such as extra Power, Might changes, or other conditions.",
    aliases: [
      "additional costs",
      "extra cost",
      "extra costs",
      "bonus cost",
      "optional cost"
    ],
    relatedRules: ["220", "221", "721.1"]
  },

  // ------------------------------------------------------------
  // 350–370 — PLAYING CARDS / ABILITIES / TIMING
  // ------------------------------------------------------------
  {
    id: "play-a-card",
    term: "Play a Card",
    definition:
      "To move a card from its current zone (usually hand) onto the Board or to the Chain as appropriate, paying its costs and following the rules for its type.",
    aliases: [
      "playing a card",
      "play cards",
      "cast a card",
      "use card",
      "playing stuff"
    ],
    relatedRules: ["350", "351", "352"]
  },
  {
    id: "cast-spell",
    term: "Cast a Spell",
    definition:
      "To play a spell card by paying its costs and putting it onto the Chain, where it will eventually resolve or be countered.",
    aliases: [
      "casting a spell",
      "cast spells",
      "play a spell",
      "play spells",
      "spell cast",
      "spell casting"
    ],
    relatedRules: ["350", "351", "390"]
  },
  {
    id: "summon-unit",
    term: "Play a Unit",
    definition:
      "To play a unit card by paying its costs and placing it onto the Board at a valid location, typically on a battlefield you control.",
    aliases: [
      "summon unit",
      "summon",
      "playing units",
      "deploy unit",
      "play creature",
      "summon creature"
    ],
    relatedRules: ["350", "351", "172", "433"]
  },
  {
    id: "exhaust",
    term: "Exhaust",
    definition:
      "To mark a permanent as used for the turn, typically by turning it sideways or otherwise indicating that it has been used and cannot be exhausted again until it is readied.",
    aliases: [
      "exhausted",
      "tapped",
      "tap",
      "turn sideways",
      "use up for turn"
    ],
    relatedRules: ["134.2.e.2", "433"]
  },
  {
    id: "ready",
    term: "Ready",
    definition:
      "The untapped or unused state of a permanent. A ready permanent can usually be exhausted to pay costs or attack.",
    aliases: [
      "readied",
      "untapped",
      "active state",
      "upright",
      "can act",
      "can attack"
    ],
    relatedRules: ["134.2.e.2", "433", "721.1"]
  },
  {
    id: "activated-ability",
    term: "Activated Ability",
    definition:
      "An ability a player may choose to use by paying its activation cost and following timing rules. It typically uses a cost–effect format.",
    aliases: [
      "activated abilities",
      "activate ability",
      "activated effect",
      "activated skill",
      "pay cost ability"
    ],
    relatedRules: ["360", "380", "390"]
  },
  {
    id: "triggered-ability",
    term: "Triggered Ability",
    definition:
      "An ability that automatically goes onto the Chain when its trigger condition happens. It usually starts with words like 'When', 'Whenever', or 'At'.",
    aliases: [
      "triggered abilities",
      "on trigger",
      "on death ability",
      "when this",
      "whenever this",
      "at the start trigger"
    ],
    relatedRules: ["361", "732.1", "733.1"]
  },
  {
    id: "passive-ability",
    term: "Passive Ability",
    definition:
      "An always-on ability that modifies the game as long as the object with the ability remains in the relevant zone. It does not use the Chain.",
    aliases: [
      "passive abilities",
      "static ability",
      "static effect",
      "always on ability",
      "continuous ability"
    ],
    relatedRules: ["362", "510", "730.1", "731.1"]
  },
  {
    id: "timing",
    term: "Timing",
    definition:
      "The rules that determine when cards and abilities can be played or activated, including distinctions between open and closed states, phases, and priority windows.",
    aliases: [
      "timing rules",
      "play timing",
      "when can I play",
      "timing windows",
      "speed of spells"
    ],
    relatedRules: ["400", "401", "402", "729"]
  },

  // ------------------------------------------------------------
  // 380–392 — PRIORITY / CHAIN
  // ------------------------------------------------------------
  {
    id: "priority",
    term: "Priority",
    definition:
      "The permission to act at a particular time. The player with priority may play spells or abilities, or pass to let the next player act or let the Chain resolve.",
    aliases: [
      "who has priority",
      "priority window",
      "priority pass",
      "my turn to act",
      "respond timing",
      "response window"
    ],
    relatedRules: ["380", "381", "382"]
  },
  {
    id: "chain",
    term: "Chain",
    definition:
      "The game structure where spells and abilities are placed as they are played. The Chain resolves from top to bottom after all players pass priority in sequence.",
    aliases: [
      "the chain",
      "stack",
      "stack of spells",
      "resolve stack",
      "queue of spells",
      "spell stack"
    ],
    relatedRules: ["390", "391", "392"]
  },

  // ------------------------------------------------------------
  // 410–445 — TURN / PHASES / COMBAT / SCORING
  // ------------------------------------------------------------
  {
    id: "turn",
    term: "Turn",
    definition:
      "A complete sequence of phases carried out by a single player, including beginning, resource, main, combat, and ending sections depending on the mode.",
    aliases: [
      "turns",
      "my turn",
      "your turn",
      "game turn",
      "turn cycle",
      "round"
    ],
    relatedRules: ["410", "411", "412"]
  },
  {
    id: "phase",
    term: "Phase",
    definition:
      "A subdivision of a turn with specific rules and allowed actions, such as the Beginning Phase, Channel Phase, Combat Phase, and others.",
    aliases: [
      "phases",
      "turn phase",
      "phase of turn",
      "step",
      "steps of the turn"
    ],
    relatedRules: ["420", "421", "422", "423"]
  },
  {
    id: "beginning-phase",
    term: "Beginning Phase",
    definition:
      "The early part of a turn where certain triggers occur and some game state updates happen before players proceed to later phases.",
    aliases: [
      "beginning phases",
      "start of turn",
      "upkeep",
      "start step",
      "upkeep step"
    ],
    relatedRules: ["420", "732.1.b", "732.1.c"]
  },
  {
    id: "combat",
    term: "Combat",
    definition:
      "The part of the game where units attack and defend on battlefields, damage is assigned and dealt, and units may die based on damage and abilities.",
    aliases: [
      "fight",
      "battle",
      "combat step",
      "combat phase",
      "attacking and blocking",
      "combat rules"
    ],
    relatedRules: ["430", "431", "432", "433"]
  },
  {
    id: "attack",
    term: "Attack",
    definition:
      "To send a unit as an attacker against a battlefield or opposing units during the Combat Phase following the rules for declaring attackers.",
    aliases: [
      "attacks",
      "attacking",
      "declare attack",
      "swing",
      "swinging",
      "go face"
    ],
    relatedRules: ["433", "706"]
  },
  {
    id: "defend",
    term: "Defend",
    definition:
      "To assign a unit as a defender against an attack, often affecting how damage is assigned and sometimes unlocking abilities like Shield.",
    aliases: [
      "defends",
      "defending",
      "block",
      "blocks",
      "blocking",
      "declare blocker"
    ],
    relatedRules: ["433", "730.1.c"]
  },
  {
    id: "lethal-damage",
    term: "Lethal Damage",
    definition:
      "An amount of damage equal to or greater than a unit’s remaining Might, usually enough to cause it to die after state-based actions are checked.",
    aliases: [
      "lethal",
      "lethal hits",
      "enough damage to kill",
      "fatal damage",
      "kill damage"
    ],
    relatedRules: ["433", "731.1.b", "731.1.c"]
  },
  {
    id: "gank",
    term: "Gank",
    definition:
      "A specific form of combat interaction, typically allowing attacks across battlefields or unusual targeting paths, governed by its own rules and often appearing as a keyword on cards.",
    aliases: [
      "ganking",
      "ganks",
      "cross-lane attack",
      "cross battlefield attack",
      "ambush attack"
    ],
    relatedRules: ["435", "450.2", "706"]
  },
  {
    id: "score",
    term: "Score",
    definition:
      "To gain points through resolving battlefield scoring conditions such as Hold or Conquer, moving a player closer to the Victory Score.",
    aliases: [
      "scoring",
      "scores",
      "gain point",
      "gain points",
      "score a point"
    ],
    relatedRules: ["440", "441", "442", "443", "444"]
  },
  {
    id: "hold",
    term: "Hold",
    definition:
      "A method of scoring based on controlling a battlefield at the appropriate time, typically by having units remain there.",
    aliases: [
      "held",
      "holding",
      "hold score",
      "hold a battlefield",
      "hold condition"
    ],
    relatedRules: ["441", "444.1.b.1"]
  },
  {
    id: "conquer",
    term: "Conquer",
    definition:
      "A method of scoring based on successfully attacking and winning at a battlefield, often involving combat victory rather than simply remaining there.",
    aliases: [
      "conquered",
      "conquering",
      "conquer score",
      "win the battlefield",
      "capture battlefield"
    ],
    relatedRules: ["441", "444.1.b.2"]
  },
  {
    id: "victory-score",
    term: "Victory Score",
    definition:
      "The number of points a player or team must achieve to win the game in a given Mode of Play.",
    aliases: [
      "victory points",
      "vp total",
      "point goal",
      "points to win",
      "win score"
    ],
    relatedRules: ["445", "456.3", "458.3", "459.3"]
  },
  {
    id: "mode-of-play",
    term: "Mode of Play",
    definition:
      "A defined way to play Riftbound, specifying player counts, formations, battlefield counts, victory conditions, and any special setup or rules.",
    aliases: [
      "modes of play",
      "game mode",
      "format",
      "1v1 mode",
      "match mode",
      "duel mode"
    ],
    relatedRules: ["454", "455", "456", "457", "458", "459"]
  },

  // ------------------------------------------------------------
  // 500–520 — REPLACEMENT / CONTINUOUS / COPY
  // ------------------------------------------------------------
  {
    id: "replacement-effect",
    term: "Replacement Effect",
    definition:
      "An effect that modifies how an event would happen, often using words like 'instead' or 'as', so that the modified event happens in place of the original.",
    aliases: [
      "replacement effects",
      "instead effect",
      "replace event",
      "event replacement",
      "as though effect"
    ],
    relatedRules: ["500", "501"]
  },
  {
    id: "continuous-effect",
    term: "Continuous Effect",
    definition:
      "An effect that constantly changes the game state for as long as its source or condition remains active, such as granting stats or abilities.",
    aliases: [
      "continuous effects",
      "static effect",
      "ongoing effect",
      "always-on effect",
      "persistent effect"
    ],
    relatedRules: ["510", "448", "449", "450"]
  },
  {
    id: "copy-effect",
    term: "Copy Effect",
    definition:
      "An effect that makes one game object become or duplicate the characteristics of another, usually following specific layer application rules.",
    aliases: [
      "copy effects",
      "copy",
      "copying",
      "clone",
      "duplicate effect",
      "copy a unit",
      "copy a spell"
    ],
    relatedRules: ["450.1.b", "520"]
  },

  // ------------------------------------------------------------
  // 600–615 — STATE-BASED ACTIONS / DEATH
  // ------------------------------------------------------------
  {
    id: "state-based-action",
    term: "State-Based Action",
    definition:
      "An automatically performed game check that happens whenever a player would receive priority, handling housekeeping like units dying from damage or impossible states ending.",
    aliases: [
      "state based actions",
      "sba",
      "state checks",
      "automatic checks",
      "rules checks"
    ],
    relatedRules: ["600", "601"]
  },
  {
    id: "dies",
    term: "Dies",
    definition:
      "A shorthand for a unit leaving the Board to go to the appropriate zone (usually the Trash) due to having lethal damage or other conditions, usually enforced by state-based actions.",
    aliases: [
      "die",
      "dying",
      "dies triggers",
      "on death",
      "death",
      "unit death",
      "destroyed"
    ],
    relatedRules: ["610", "611"]
  },

  // ------------------------------------------------------------
  // 701–715 — BUFFS / MIGHTY / BONUS DAMAGE
  // ------------------------------------------------------------
  {
    id: "buff",
    term: "Buff",
    definition:
      "A game object placed on a unit to represent a temporary enhancement. A buff usually grants +1 Might and can be added or spent as instructed.",
    aliases: [
      "buffs",
      "buff counter",
      "buff counters",
      "token buff",
      "temporary buff",
      "stacking buff"
    ],
    relatedRules: ["701", "702", "703", "704", "705"]
  },
  {
    id: "mighty",
    term: "Mighty",
    definition:
      "A description for units whose Might is at or above a certain threshold (commonly 5 or more), often referenced by other effects and abilities.",
    aliases: [
      "is mighty",
      "becomes mighty",
      "mighty unit",
      "mighty units",
      "big unit"
    ],
    relatedRules: ["706", "707", "708", "709"]
  },
  {
    id: "bonus-damage",
    term: "Bonus Damage",
    definition:
      "An intrinsic modification to a damage-dealing action that increases the total amount of damage distributed by that action, usually added once per instance.",
    aliases: [
      "extra damage",
      "plus damage",
      "damage buff",
      "bonus dmg",
      "increased damage"
    ],
    relatedRules: ["712", "713", "714", "715"]
  },

  // ------------------------------------------------------------
  // 720–733 — KEYWORDS (MECHANIC-LEVEL)
  // ------------------------------------------------------------
  {
    id: "accelerate",
    term: "Accelerate",
    definition:
      "An optional additional cost on units that allows them to enter ready instead of exhausted when played, by paying extra Power and possibly other resources.",
    aliases: [
      "accelerated",
      "accelerate cost",
      "enter ready",
      "pay extra to be ready",
      "has accelerate"
    ],
    relatedRules: ["721", "721.1", "721.2", "721.3"]
  },
  {
    id: "reaction",
    term: "Reaction",
    definition:
      "A timing keyword that grants the permissions of Action and also allows a spell, unit, or ability to be played during Closed States on any player’s turn.",
    aliases: [
      "reactions",
      "reactive",
      "flash speed",
      "instant speed",
      "play at instant speed",
      "play on opponent's turn",
      "play during closed state"
    ],
    relatedRules: ["729", "729.1", "729.2", "729.3", "729.4"]
  },
  {
    id: "shield-keyword",
    term: "Shield",
    definition:
      "A keyword found on units, written as 'Shield X', which gives the unit extra Might while it is a defender in combat. Multiple sources of Shield stack by adding their values.",
    aliases: [
      "shield",
      "shields",
      "shield x",
      "shield value",
      "defense buff",
      "extra might while defending"
    ],
    relatedRules: ["730", "730.1", "730.2", "730.3"]
  },
  {
    id: "tank",
    term: "Tank",
    definition:
      "A keyword on units that alters damage assignment in combat so that units with Tank must receive lethal damage before damage can be assigned to non-Tank units with the same controller.",
    aliases: [
      "tanks",
      "taunt",
      "bodyguard",
      "must block",
      "must hit me first",
      "damage focus"
    ],
    relatedRules: ["731", "731.1", "731.2", "731.3"]
  },
  {
    id: "temporary",
    term: "Temporary",
    definition:
      "A keyword on permanents that makes them self-destruct at the start of their controller’s Beginning Phase before scoring, effectively limiting their lifespan to a short duration.",
    aliases: [
      "temporaries",
      "temporary permanent",
      "one turn permanent",
      "dies next turn",
      "short lived permanent"
    ],
    relatedRules: ["732", "732.1", "732.2", "732.3"]
  },
  {
    id: "vision",
    term: "Vision",
    definition:
      "A keyword on permanents that triggers when the permanent is played, allowing its controller to look at the top card of their Main Deck and optionally recycle it.",
    aliases: [
      "visions",
      "scry",
      "peek top card",
      "topdeck peek",
      "reveal top card",
      "look and recycle"
    ],
    relatedRules: ["733", "733.1", "733.2"]
  }
];
