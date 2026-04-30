# NexusArchive - Synergy & Combo Finder Checklist and Build Log

Feature name: **Synergy & Combo Finder**

This document is the working checklist, implementation log, and decision record
for building the NexusArchive Synergy & Combo Finder. Keep it updated as work
lands so the project history stays visible.

## Tracker Legend

- `[ ]` Not started
- `[x]` Complete
- `Status:` Use `Not started`, `In progress`, `Blocked`, `Review`, or `Done`
- `Log:` Add dated notes in the work log at the bottom of this file

## Product Goal

NexusArchive should become a card intelligence system, not only a card text,
image, price, and decklist viewer.

The Synergy & Combo Finder should explain:

- [ ] What a card does mechanically
- [ ] What role a card plays in a deck
- [ ] What other cards directly synergize with it
- [x] What 3-card, 4-card, or 5-card packages it belongs to
- [ ] What combo chains it enables
- [ ] What deck archetypes it supports
- [ ] What a deck is trying to do
- [ ] What a deck is missing
- [ ] Which cards are isolated or unsupported
- [ ] Which cards improve consistency, protection, payoffs, or win conditions

Supported and future target games:

- [ ] Riftbound
- [ ] One Piece Card Game
- [ ] Magic: The Gathering
- [ ] Future TCGs added to NexusArchive

## Critical Design Rule

Do **not** call an LLM every time a user searches.

Normal user-facing searches must be database-driven:

```txt
Card data enters database
   |
Card profile is generated once
   |
Synergy edges are generated
   |
Synergy packages are generated
   |
Combo graph is generated
   |
User searches stored intelligence
```

LLMs may be used later for:

- [ ] Low-confidence parsing
- [ ] Better explanations
- [ ] Admin review
- [ ] Deck summary polish
- [ ] Weird card wording

LLMs must not be required for:

- [ ] Normal card page requests
- [ ] Normal synergy searches
- [ ] Every deck analysis by default
- [ ] Every user click

## Architecture Mental Model

```txt
Card Profiles
   |
Synergy Edges
   |
Synergy Packages
   |
Combo Chains
   |
Deck Analysis
```

Important distinctions:

- `CardSynergy` = direct 2-card relationship
- `SynergyPackage` = 3-5 card mechanical cluster
- `ComboChain` = ordered sequence of effects
- `DeckAnalysis` = full-deck intelligence

Example:

```txt
Card A creates tokens.
Card B sacrifices units.
Card C draws when a unit dies.

A -> B = token enables sacrifice
B -> C = sacrifice triggers death payoff
A + B + C = sacrifice draw engine
```

The two-card relationship is the atomic relationship layer. It is the
foundation for discovering packages, chains, and deck-level clusters.

## UI Terminology

Use these terms throughout the app:

- [ ] **Direct Synergy** - 2-card relationship
- [ ] **Synergy Package** - 3-5 card mechanical cluster
- [ ] **Combo Chain** - ordered sequence of effects
- [ ] **Engine** - repeatable value pattern
- [ ] **Loop** - possibly repeatable cycle
- [ ] **Win Condition** - package or chain that directly threatens victory

## MVP Scope

Build first:

- [ ] `CardProfile`
- [x] `CardSynergy`
- [x] `SynergyPackage`
- [ ] Card synergy API
- [ ] Card page panel
- [ ] Admin rebuild endpoints

Build after the MVP foundation:

- [ ] `ComboChain` graph discovery
- [ ] Deck analyzer
- [ ] Synergy browse page
- [ ] Optional LLM enhancement

Do not overbuild initially:

- [ ] Do not start with a perfect rules engine
- [ ] Do not build a full game simulator
- [ ] Do not claim guaranteed infinite detection unless proven
- [ ] Do not add live pricing to this feature
- [ ] Do not build seller inventory in the first pass
- [ ] Do not make LLM calls on every click
- [ ] Do not build an automatic deck optimizer first

## Target Repository Structure

The repo uses `src/`, so adapt the requested structure under `src/lib`,
`src/app`, and `src/components`.

```txt
src/lib/synergy
  constants/
    mechanic-tags.ts
    card-roles.ts
    synergy-types.ts
    package-types.ts
    resource-types.ts
    game-config.ts

  normalize/
    normalize-card-text.ts
    normalize-card-name.ts

  parser/
    parse-card-profile.ts
    rule-patterns.ts
    classify-card-roles.ts
    extract-triggers.ts
    extract-resources.ts
    extract-payoffs.ts
    confidence.ts

  scoring/
    score-synergy-edge.ts
    score-synergy-package.ts
    score-combo-chain.ts
    score-deck-synergy.ts

  engine/
    build-card-profile.ts
    find-synergy-edges.ts
    discover-synergy-packages.ts
    discover-combo-chains.ts
    analyze-deck.ts
    detect-archetypes.ts
    explain-synergy-edge.ts
    explain-synergy-package.ts
    explain-combo-chain.ts
    explain-deck.ts

  graph/
    graph-types.ts
    build-card-graph.ts
    traverse-combo-graph.ts
    detect-loop-patterns.ts
    dedupe-combos.ts

  admin/
    rebuild-card-profiles.ts
    rebuild-synergy-edges.ts
    rebuild-synergy-packages.ts
    rebuild-combo-graph.ts

  types/
    card-profile.ts
    synergy-edge.ts
    synergy-package.ts
    combo-chain.ts
    deck-analysis.ts

src/app/api/synergy/card/[cardId]/route.ts
src/app/api/synergy/search/route.ts
src/app/api/synergy/packages/route.ts
src/app/api/synergy/deck/route.ts

src/app/api/admin/synergy/rebuild-profiles/route.ts
src/app/api/admin/synergy/rebuild-edges/route.ts
src/app/api/admin/synergy/rebuild-packages/route.ts
src/app/api/admin/synergy/rebuild-graph/route.ts

src/components/synergy/
  SynergyPanel.tsx
  SynergyEdgeCard.tsx
  SynergyPackageCard.tsx
  ComboChainCard.tsx
  DeckAnalysisPanel.tsx
  SynergyScoreBadge.tsx
  CardRoleBadges.tsx
  MechanicTagBadges.tsx
  SynergyFilters.tsx

src/app/synergy/page.tsx
src/app/synergy/deck-analyzer/page.tsx
src/app/synergy/card/[cardId]/page.tsx
```

## Prisma Model Targets

Inspect `prisma/schema.prisma` before editing. Adapt relation fields and naming
to the existing `Card` model.

```prisma
model CardProfile {
  id              String   @id @default(cuid())
  cardId          String   @unique

  game            String
  name            String

  tags            Json
  roles           Json
  triggers        Json
  produces        Json
  consumes        Json
  payoffs         Json
  constraints     Json
  risks           Json

  parserVersion   String
  confidence      Float    @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([game])
  @@index([confidence])
}

model CardSynergy {
  id                 String   @id @default(cuid())

  game               String
  primaryCardId      String
  secondaryCardId    String

  cardIds            Json

  synergyType        String
  score              Float

  tags               Json
  roles              Json

  explanation        String
  requiredConditions Json
  weaknesses         Json

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([game])
  @@index([primaryCardId])
  @@index([secondaryCardId])
  @@index([score])
  @@unique([primaryCardId, secondaryCardId, synergyType])
}

model SynergyPackage {
  id                 String   @id @default(cuid())

  game               String
  cardIds            Json
  packageSize        Int

  packageType        String
  score              Float

  tags               Json
  roles              Json
  requiredEdges      Json

  explanation        String
  playPattern        String
  requiredConditions Json
  weaknesses         Json

  isCombo            Boolean  @default(false)
  isEngine           Boolean  @default(false)
  isWinCondition     Boolean  @default(false)

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([game])
  @@index([packageSize])
  @@index([packageType])
  @@index([score])
}

model ComboChain {
  id                  String   @id @default(cuid())

  game                String
  cardIds             Json
  chainLength         Int

  comboType           String
  score               Float

  tags                Json
  roles               Json
  graphEdges          Json

  explanation         String
  sequence            Json
  requiredConditions  Json
  weaknesses          Json

  isDeterministic     Boolean  @default(false)
  isLoop              Boolean  @default(false)
  isPotentialInfinite Boolean  @default(false)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([game])
  @@index([score])
  @@index([comboType])
  @@index([chainLength])
}

model DeckAnalysis {
  id                String   @id @default(cuid())

  game              String
  deckName          String?
  deckHash          String   @unique

  inputCards        Json
  resolvedCards     Json

  archetypes        Json
  roleCoverage      Json
  tags              Json
  synergyEdges      Json
  synergyPackages   Json
  comboChains       Json
  missingRoles      Json
  unsupportedCards  Json
  suggestions       Json
  risks             Json

  score             Float
  explanation       String

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([game])
  @@index([deckHash])
  @@index([score])
}
```

## Core Type Targets

```ts
export type GameId = "riftbound" | "one_piece" | "mtg" | string;

export type MechanicTag =
  | "draw"
  | "discard"
  | "search"
  | "tutor"
  | "ramp"
  | "cost_reduction"
  | "resource_generation"
  | "resource_conversion"
  | "token_creation"
  | "wide_board"
  | "sacrifice"
  | "death_trigger"
  | "attack_trigger"
  | "play_trigger"
  | "cast_trigger"
  | "enter_trigger"
  | "graveyard"
  | "recursion"
  | "removal"
  | "damage"
  | "burn"
  | "buff"
  | "debuff"
  | "protection"
  | "evasion"
  | "copy"
  | "untap"
  | "extra_attack"
  | "extra_turn"
  | "tribal"
  | "leader_synergy"
  | "hand_size_payoff"
  | "graveyard_payoff"
  | "token_payoff"
  | "spell_payoff"
  | "unit_payoff"
  | "equipment_payoff"
  | "life_gain"
  | "life_loss"
  | "life_payoff"
  | "control"
  | "tempo"
  | "aggro"
  | "combo"
  | "unknown";

export type CardRole =
  | "enabler"
  | "payoff"
  | "engine_piece"
  | "combo_piece"
  | "finisher"
  | "protection"
  | "removal"
  | "draw"
  | "ramp"
  | "search"
  | "sacrifice_outlet"
  | "resource_generator"
  | "resource_sink"
  | "archetype_core"
  | "support_piece"
  | "sideboard_tech"
  | "unknown";

export type TriggerProfile = {
  event: string;
  condition?: string;
  frequency?: "once" | "repeatable" | "static" | "unknown";
};

export type ResourceProfile = {
  resource: string;
  amount?: number | "variable" | "unknown";
  condition?: string;
};

export type PayoffProfile = {
  condition: string;
  reward: string;
  tags: MechanicTag[];
};

export type ConstraintProfile = {
  type?: string[];
  color?: string[];
  trait?: string[];
  timing?: string[];
  archetype?: string[];
  gameSpecific?: Record<string, unknown>;
};

export type CardIntelligenceProfile = {
  cardId: string;
  game: GameId;
  name: string;
  tags: MechanicTag[];
  roles: CardRole[];
  triggers: TriggerProfile[];
  produces: ResourceProfile[];
  consumes: ResourceProfile[];
  payoffs: PayoffProfile[];
  constraints: ConstraintProfile[];
  risks: string[];
  parserVersion: string;
  confidence: number;
};
```

## Phase 1 - Card Intelligence Profiles

Status: Done

Goal: Every card gets a structured profile.

A profile should answer:

- [x] What mechanics does this card have?
- [x] What does it produce?
- [x] What does it consume?
- [x] What does it trigger?
- [x] What does it reward?
- [x] What deck role does it play?
- [ ] What kind of cards does it want around it?
- [ ] What kind of cards does it support?

Implementation checklist:

- [x] Inspect the existing `Card` model and card text fields.
- [x] Add constants for mechanic tags, card roles, resource types, and game config.
- [x] Add card text and card name normalizers.
- [x] Add rule-based parser entrypoint.
- [x] Add role classifier.
- [x] Add trigger extractor.
- [x] Add resource producer/consumer extractor.
- [x] Add payoff extractor.
- [x] Add parser confidence scoring.
- [x] Mark low-confidence profiles with `low_parser_confidence`.
- [x] Add profile builder that maps database cards to `CardIntelligenceProfile`.
- [x] Store profiles in `CardProfile`.
- [x] Make blank or weird card text safe and non-crashing.

Parser rule examples:

```txt
"draw" -> draw
"discard" -> discard
"search your deck" -> search / tutor
"create a token" -> token_creation
"when this attacks" -> attack_trigger
"when this dies" -> death_trigger
"destroy" / "KO" / "banish" -> removal
"return from graveyard/trash" -> recursion
"costs less" -> cost_reduction
"untap" / "ready" -> untap
```

Phase 1 acceptance:

- [x] Every supported card can generate a `CardProfile`.
- [x] Profiles include tags, roles, triggers, produces, consumes, payoffs, risks, and confidence.
- [x] Blank or weird cards do not crash the parser.
- [x] Low-confidence profiles are marked.

## Phase 2 - Synergy Edge Detection

Status: Done

Goal: Detect direct two-card relationships as edges, not as the final product.

A synergy edge should answer:

- [x] Does Card A directly help Card B?
- [x] Does Card A produce something Card B wants?
- [x] Does Card A trigger something Card B rewards?
- [x] Does Card A protect, search, enable, or amplify Card B?

Edge examples:

- [x] Token Creator -> Token Payoff
- [x] Sacrifice Outlet -> Death Trigger Payoff
- [x] Discard Outlet -> Graveyard Payoff
- [x] Draw Engine -> Hand Size Payoff
- [x] Resource Generator -> Resource Sink
- [x] Cost Reduction -> Spell/Play Payoff
- [x] Search Card -> Combo Piece
- [x] Protection Card -> Engine Piece
- [x] Removal Card -> Control Package

Synergy edge type target:

```ts
export type SynergyEdgeType =
  | "soft_synergy"
  | "direct_synergy"
  | "engine_link"
  | "combo_setup"
  | "protection_link"
  | "consistency_link"
  | "payoff_link"
  | "archetype_link";

export type SynergyEdgeResult = {
  game: string;
  cardIds: string[];
  primaryCardId: string;
  secondaryCardId: string;
  synergyType: SynergyEdgeType;
  score: number;
  tags: string[];
  roles: string[];
  explanation: string;
  requiredConditions: string[];
  weaknesses: string[];
};
```

Rule mapping seed:

```ts
const EDGE_RULES = [
  {
    producerTag: "token_creation",
    consumerTag: "token_payoff",
    type: "direct_synergy",
    baseScore: 75,
    label: "Token creator supports token payoff",
  },
  {
    producerTag: "sacrifice",
    consumerTag: "death_trigger",
    type: "engine_link",
    baseScore: 82,
    label: "Sacrifice outlet enables death trigger payoff",
  },
  {
    producerTag: "discard",
    consumerTag: "graveyard_payoff",
    type: "direct_synergy",
    baseScore: 78,
    label: "Discard outlet fuels graveyard payoff",
  },
  {
    producerTag: "draw",
    consumerTag: "hand_size_payoff",
    type: "payoff_link",
    baseScore: 72,
    label: "Draw supports hand-size payoff",
  },
  {
    producerTag: "resource_generation",
    consumerRole: "resource_sink",
    type: "engine_link",
    baseScore: 76,
    label: "Resource generation feeds resource sink",
  },
  {
    producerRole: "search",
    consumerRole: "combo_piece",
    type: "consistency_link",
    baseScore: 68,
    label: "Search improves combo consistency",
  },
  {
    producerRole: "protection",
    consumerRole: "engine_piece",
    type: "protection_link",
    baseScore: 65,
    label: "Protection supports engine piece",
  },
];
```

Implementation checklist:

- [x] Add synergy type constants.
- [x] Add edge scoring.
- [x] Add edge explanation generation.
- [x] Implement direct edge finder using stored profiles.
- [x] Store qualified edges in `CardSynergy`.
- [x] Prevent duplicate edges using the unique key.
- [x] Include weaknesses and required conditions.

Phase 2 acceptance:

- [x] Direct synergy edges are generated between compatible cards.
- [x] Edges have scores, types, tags, roles, explanations, and weaknesses.
- [x] Edges are stored in `CardSynergy`.

## Phase 3 - Multi-Card Synergy Package Discovery

Status: Done

Goal: Group multiple synergy edges into useful card packages.

A synergy package is a cluster of cards that supports the same mechanical plan.
It is not necessarily an ordered combo.

Difference summary:

- `CardSynergy`: A works with B.
- `SynergyPackage`: A + B + C form a useful mechanical package.
- `ComboChain`: A -> B -> C is an ordered sequence of effects.

Package type constants:

```ts
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
```

Package result target:

```ts
export type SynergyPackageResult = {
  game: string;
  cardIds: string[];
  packageSize: number;
  packageType: string;
  score: number;
  tags: string[];
  roles: string[];
  requiredEdges: string[];
  explanation: string;
  playPattern: string;
  requiredConditions: string[];
  weaknesses: string[];
  isCombo: boolean;
  isEngine: boolean;
  isWinCondition: boolean;
};
```

Package discovery logic:

- [x] Use stored `CardSynergy` edges.
- [x] Build an undirected graph of cards connected by synergy edges.
- [x] Find connected card sets of size 3-5.
- [x] Collect internal edges for each candidate set.
- [x] Collect tags and roles.
- [x] Infer package type.
- [x] Score package.
- [x] Generate explanation.
- [x] Generate play pattern.
- [x] Store in `SynergyPackage`.

Package inference examples:

```txt
token_creation + token_payoff + wide_board = token_package
token_creation + sacrifice + death_trigger = sacrifice_package
discard + graveyard + recursion = graveyard_package
resource_generation + resource_sink + draw = resource_package
removal + draw + protection = control_package
combo_piece + search + protection = combo_setup_package
```

Example package output:

```json
{
  "packageType": "sacrifice_package",
  "packageSize": 3,
  "score": 87,
  "isEngine": true,
  "isCombo": false,
  "isWinCondition": false,
  "explanation": "This 3-card sacrifice package is built from connected synergy links. The cards support the same mechanical plan rather than functioning as isolated pieces.",
  "playPattern": "Create or supply expendable units, sacrifice them for value, then use death-trigger payoffs to convert that activity into cards, damage, resources, or board advantage.",
  "weaknesses": [
    "Needs multiple pieces online.",
    "Can be disrupted by removal or timing restrictions."
  ]
}
```

Phase 3 acceptance:

- [x] Multi-card packages are generated from synergy edges.
- [x] Packages include 3-5 cards.
- [x] Packages are typed: token, sacrifice, graveyard, resource, control, etc.
- [x] Packages include play patterns.
- [x] Packages are stored in `SynergyPackage`.

## Phase 4 - Card Page and API Integration

Status: Not started

Goal: Expose the Synergy & Combo Finder on card pages and through API routes.

Card API target:

```txt
GET /api/synergy/card/[cardId]
```

Response target:

```json
{
  "ok": true,
  "cardId": "...",
  "profile": {},
  "directSynergies": [],
  "packages": [],
  "comboChains": []
}
```

Search API target:

```txt
GET /api/synergy/search?game=riftbound&type=sacrifice_package&minScore=70
```

Search across:

- [ ] Direct synergies
- [ ] Packages
- [ ] Combo chains

Package API target:

```txt
GET /api/synergy/packages?game=riftbound&type=token_package&minScore=70
```

Deck API target:

```txt
POST /api/synergy/deck
```

Input target:

```json
{
  "game": "riftbound",
  "deckName": "Test Deck",
  "cards": [
    { "name": "Example Card A", "quantity": 4 },
    { "name": "Example Card B", "quantity": 3 }
  ]
}
```

Card page UI checklist:

- [ ] Add `SynergyPanel` to existing card pages.
- [ ] Do not redesign the entire card page.
- [ ] Show Card Roles.
- [ ] Show Mechanic Tags.
- [ ] Show Best Direct Synergies.
- [ ] Show Multi-Card Packages.
- [ ] Show Combo Chains.
- [ ] Show Possible Deck Archetypes.
- [ ] Add clean empty states.

Example card page display:

```txt
Synergy & Combo Finder

Roles:
Enabler, Engine Piece, Token Creator

Tags:
token_creation, attack_trigger, wide_board

Best Direct Synergies:
- Card B - Strong - 86
  This card creates tokens while Card B rewards token-based board states.

Multi-Card Packages:
- Sacrifice Package - Strong - 87
  Cards: A + B + C
  Play Pattern: Create expendable units, sacrifice them, and turn death triggers into value.

Combo Chains:
- A -> B -> C - Engine - 82
  This sequence may create repeatable card advantage.
```

Phase 4 acceptance:

- [ ] Card API returns profile, direct synergies, packages, and combos.
- [ ] Card page shows the Synergy & Combo Finder panel.
- [ ] Empty states look clean.

## Phase 5 - Admin Rebuild and Review Tools

Status: Not started

Goal: Allow the system to rebuild all stored intelligence.

Admin rebuild order:

- [ ] Rebuild card profiles.
- [ ] Rebuild synergy edges.
- [ ] Rebuild synergy packages.
- [ ] Rebuild combo graph.

Admin routes:

```txt
POST /api/admin/synergy/rebuild-profiles
POST /api/admin/synergy/rebuild-edges
POST /api/admin/synergy/rebuild-packages
POST /api/admin/synergy/rebuild-graph
```

Request body target:

```json
{
  "game": "riftbound",
  "limit": 100,
  "dryRun": true,
  "minScore": 60
}
```

Admin protection checklist:

- [ ] Inspect existing admin/auth system.
- [ ] Use existing admin auth if available.
- [ ] If no admin auth exists, require `SYNERGY_ADMIN_TOKEN`.
- [ ] Require `Authorization: Bearer <token>` for token-protected routes.

Dry-run behavior:

- [ ] Run parser/engine.
- [ ] Return sample results.
- [ ] Do not write to the database.

Optional admin review UI later:

- [ ] Show low-confidence profiles.
- [ ] Show unknown tags.
- [ ] Show unknown roles.
- [ ] Show potential infinite loops.
- [ ] Show packages needing review.
- [ ] Show cards with no synergies.

Phase 5 acceptance:

- [ ] Admin rebuild endpoints work.
- [ ] Dry-run mode works.
- [ ] Rebuild can target one game.
- [ ] Rebuild order works: profiles -> edges -> packages -> graph.

## Phase 6 - Graph Combo Discovery

Status: Not started

Goal: Discover ordered combo chains and possible loops.

A package says:

```txt
These cards belong together.
```

A combo chain says:

```txt
These cards produce a sequence of effects.
```

Graph nodes:

- [ ] Card
- [ ] Resource
- [ ] Trigger
- [ ] Payoff
- [ ] Role
- [ ] Tag

Graph edge types:

- [ ] `produces`
- [ ] `consumes`
- [ ] `triggers`
- [ ] `rewards`
- [ ] `enables`
- [ ] `protects`
- [ ] `searches`
- [ ] `converts_to`
- [ ] `requires`
- [ ] `has_role`
- [ ] `has_tag`

Example graph:

```txt
Card A --produces--> token
token --consumed_by--> Card B
Card B --triggers--> death_event
death_event --rewards--> Card C
Card C --produces--> cards_in_hand

Card A -> Card B -> Card C = sacrifice draw engine
```

Combo chain candidate target:

```ts
export type ComboChainCandidate = {
  game: string;
  cardIds: string[];
  chainLength: number;
  comboType: string;
  score: number;
  tags: string[];
  roles: string[];
  graphEdges: unknown[];
  explanation: string;
  sequence: {
    step: number;
    cardId?: string;
    action: string;
    result: string;
  }[];
  requiredConditions: string[];
  weaknesses: string[];
  isDeterministic: boolean;
  isLoop: boolean;
  isPotentialInfinite: boolean;
};
```

Combo chain types:

- [ ] `token_engine`
- [ ] `sacrifice_engine`
- [ ] `graveyard_engine`
- [ ] `resource_engine`
- [ ] `draw_engine`
- [ ] `damage_engine`
- [ ] `protected_combo`
- [ ] `consistency_combo`
- [ ] `potential_loop`
- [ ] `potential_infinite`
- [ ] `win_condition`

Infinite / loop safety rule:

- [ ] Do not confidently label anything as infinite unless the sequence returns to its original state.
- [ ] Confirm the loop generates net positive value before labeling it infinite.
- [ ] Confirm once-per-turn restrictions do not stop it.
- [ ] Confirm timing restrictions do not stop it.
- [ ] Confirm zone movement rules do not stop it.
- [ ] Confirm game-specific rules allow it.
- [ ] Until proven, label as `Potential loop`, `Potential infinite`, and `Needs rules verification`.

Combo discovery process:

- [ ] Load card profiles.
- [ ] Build graph nodes.
- [ ] Add profile edges.
- [ ] Add derived edges.
- [ ] Traverse paths up to depth 5 or 6.
- [ ] Extract card paths.
- [ ] Score candidate chains.
- [ ] Deduplicate chains.
- [ ] Flag loops and potential infinites carefully.
- [ ] Store in `ComboChain`.

Phase 6 acceptance:

- [ ] Graph combo discovery works.
- [ ] Combo chains are stored.
- [ ] Potential loops are flagged carefully.
- [ ] Potential infinites are not labeled as guaranteed unless proven.

## Phase 7 - Deck Analysis

Status: Not started

Goal: Allow a user to paste or upload a decklist and receive an intelligent
breakdown.

The analyzer should answer:

- [ ] What is this deck trying to do?
- [ ] What archetype does it resemble?
- [ ] What are the strongest packages?
- [ ] What combo chains exist in the deck?
- [ ] What roles are missing?
- [ ] Which cards are unsupported?
- [ ] What would improve consistency?
- [ ] What would improve survivability?
- [ ] What would improve finishing power?

Basic pasted decklist format:

```txt
4 Card Name
3 Another Card
2 Third Card
```

Decklist parser target:

```ts
function parseDecklist(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.+)$/);

      if (!match) {
        return {
          quantity: 1,
          name: line,
        };
      }

      return {
        quantity: Number(match[1]),
        name: match[2].trim(),
      };
    });
}
```

Deck analysis result target:

```ts
export type DeckAnalysisResult = {
  game: string;
  deckName?: string;
  deckHash: string;
  cardCount: number;
  resolvedCards: {
    cardId: string;
    name: string;
    quantity: number;
  }[];
  archetypes: {
    name: string;
    score: number;
    tags: string[];
    explanation: string;
  }[];
  roleCoverage: {
    role: string;
    count: number;
    weightedCount: number;
    status: "missing" | "low" | "healthy" | "high";
  }[];
  directSynergies: unknown[];
  synergyPackages: unknown[];
  comboChains: unknown[];
  missingRoles: string[];
  unsupportedCards: string[];
  suggestions: {
    type: "add" | "remove" | "increase" | "decrease" | "review";
    priority: "low" | "medium" | "high";
    cardId?: string;
    role?: string;
    reason: string;
  }[];
  risks: string[];
  score: number;
  explanation: string;
};
```

Deck analyzer logic:

- [ ] Parse decklist.
- [ ] Resolve card names to database cards.
- [ ] Load card profiles.
- [ ] Load direct synergies where all cards are in deck.
- [ ] Load synergy packages where all cards are in deck.
- [ ] Load combo chains where all cards are in deck.
- [ ] Detect archetypes.
- [ ] Calculate role coverage.
- [ ] Find unsupported cards.
- [ ] Generate suggestions.
- [ ] Calculate score.
- [ ] Save `DeckAnalysis`.
- [ ] Return result.

Role coverage targets:

- [ ] `enabler`
- [ ] `payoff`
- [ ] `engine_piece`
- [ ] `combo_piece`
- [ ] `finisher`
- [ ] `protection`
- [ ] `removal`
- [ ] `draw`
- [ ] `ramp`
- [ ] `search`
- [ ] `resource_generator`
- [ ] `resource_sink`

Initial role coverage thresholds:

- [ ] `0 cards` = missing
- [ ] `1-2 cards` = low
- [ ] `3-11 cards` = healthy
- [ ] `12+ cards` = high
- [ ] Adjust thresholds later per game and deck size.

Deck scoring seed:

- [ ] Start from base score `50`.
- [ ] Add points for healthy role coverage.
- [ ] Add points for strong synergy packages.
- [ ] Add points for complete combo chains.
- [ ] Add points for clear archetype identity.
- [ ] Add points for redundant enablers/payoffs.
- [ ] Subtract for missing draw.
- [ ] Subtract for missing removal.
- [ ] Subtract for missing finisher.
- [ ] Subtract for unsupported cards.
- [ ] Subtract for isolated combo pieces.
- [ ] Subtract for low parser confidence.

Example deck analysis output:

```txt
Deck Synergy Score: 78/100

Detected Archetype:
Sacrifice Engine

Strengths:
- Strong token creation density
- Multiple death-trigger payoffs
- Good engine redundancy

Best Packages:
- Sacrifice Package - 87
- Token Package - 79

Combo Chains:
- Token Creator -> Sacrifice Outlet -> Death Payoff
  Potential repeatable value engine

Weaknesses:
- Low protection
- Low search/tutor density
- 4 cards appear unsupported

Suggested Improvements:
- Add more protection for the main engine
- Add more card draw or search
- Review isolated cards that do not support the sacrifice plan
```

Phase 7 acceptance:

- [ ] User can paste a decklist.
- [ ] Cards resolve by name.
- [ ] Deck analysis returns archetypes, role coverage, packages, combos, missing roles, unsupported cards, suggestions, risks, and score.

## Phase 8 - Optional LLM Enhancement

Status: Not started

Goal: Improve parsing and explanations without making the system dependent on
AI calls.

Environment variables:

```env
SYNERGY_LLM_ENABLED=false
SYNERGY_LLM_MODEL=gpt-4o-mini
```

Use LLM for:

- [ ] Low-confidence card profiles
- [ ] Weird card wording
- [ ] Admin profile review
- [ ] Better package explanations
- [ ] Deck summary polish
- [ ] Potential combo verification assistance

Do not use LLM for:

- [ ] Every card page request
- [ ] Every synergy search
- [ ] Every deck analysis by default
- [ ] Every user click

LLM parser contract:

```json
{
  "tags": [],
  "roles": [],
  "triggers": [],
  "produces": [],
  "consumes": [],
  "payoffs": [],
  "risks": [],
  "confidence": 0.0
}
```

LLM safety checklist:

- [ ] Validate JSON before saving.
- [ ] Never trust unvalidated LLM output.
- [ ] Keep `SYNERGY_LLM_ENABLED=false` as a supported mode.

Phase 8 acceptance:

- [ ] LLM enhancement is optional.
- [ ] System works with `SYNERGY_LLM_ENABLED=false`.
- [ ] No LLM call is required for normal card page synergy search.

## Phase 9 - Seller / Inventory Intelligence, Later

Status: Deferred

Do not build this yet, but keep the design compatible with future inventory
intelligence.

Future store inventory use cases:

- [ ] Find playable decks from store inventory.
- [ ] Find missing singles needed to complete decks.
- [ ] Find popular synergy packages in stock.
- [ ] Sell combo packages as bundles.
- [ ] Identify cards that are undervalued because they belong to emerging packages.

Potential future features:

- [ ] Store Inventory Synergy Finder
- [ ] Decks Buildable From This Store
- [ ] Missing 5 Cards to Complete Deck
- [ ] Combo Package Bundles
- [ ] Local Meta Inventory Suggestions

## API Checklist

Public APIs:

- [ ] `GET /api/synergy/card/[cardId]`
- [ ] `GET /api/synergy/search`
- [ ] `GET /api/synergy/packages`
- [ ] `POST /api/synergy/deck`

Admin APIs:

- [ ] `POST /api/admin/synergy/rebuild-profiles`
- [ ] `POST /api/admin/synergy/rebuild-edges`
- [ ] `POST /api/admin/synergy/rebuild-packages`
- [ ] `POST /api/admin/synergy/rebuild-graph`

## UI Checklist

Card detail page:

- [ ] Add `SynergyPanel`.
- [ ] Show Card Roles.
- [ ] Show Mechanic Tags.
- [ ] Show Best Direct Synergies.
- [ ] Show Multi-Card Packages.
- [ ] Show Combo Chains.
- [ ] Show Possible Archetypes.

Synergy landing page:

- [ ] Create `src/app/synergy/page.tsx`.
- [ ] Browse top direct synergies.
- [ ] Browse top multi-card packages.
- [ ] Browse top combo chains.
- [ ] Show potential loops.
- [ ] Show engines.
- [ ] Show win conditions.

Synergy landing filters:

- [ ] Game
- [ ] Package Type
- [ ] Synergy Type
- [ ] Minimum Score
- [ ] Tags
- [ ] Roles
- [ ] Combo Only
- [ ] Engine Only
- [ ] Potential Infinite

Deck analyzer page:

- [ ] Create `src/app/synergy/deck-analyzer/page.tsx`.
- [ ] Paste decklist.
- [ ] Select game.
- [ ] Analyze deck.
- [ ] Show score.
- [ ] Show archetype.
- [ ] Show role coverage.
- [ ] Show packages.
- [ ] Show combo chains.
- [ ] Show missing roles.
- [ ] Show unsupported cards.
- [ ] Show suggestions.

Component checklist:

- [ ] `SynergyPanel`
- [ ] `SynergyEdgeCard`
- [ ] `SynergyPackageCard`
- [ ] `ComboChainCard`
- [ ] `DeckAnalysisPanel`
- [ ] `SynergyScoreBadge`
- [ ] `CardRoleBadges`
- [ ] `MechanicTagBadges`
- [ ] `SynergyFilters`

## Build Order for Codex

Step 1 - Inspect repository:

- [ ] Run `ls`.
- [ ] Run `cat package.json`.
- [ ] Run `cat prisma/schema.prisma`.
- [ ] Find existing `Card` model.
- [ ] Find card field names.
- [ ] Find Prisma client path.
- [ ] Find existing card page route.
- [ ] Find existing design conventions.
- [ ] Find existing admin/auth system.

Step 2 - Add Prisma models:

- [x] Add `CardProfile`.
- [x] Add `CardSynergy`.
- [x] Add `SynergyPackage`.
- [ ] Add `ComboChain`.
- [ ] Add `DeckAnalysis`.
- [x] Run `npx prisma format`.
- [x] Run `npx prisma migrate dev --name add_card_profiles`.
- [x] Run `npx prisma generate`.
- [ ] If production migration rules differ, prepare migration without unsafe changes.

Step 3 - Add types and constants:

- [x] `card-profile.ts`
- [x] `synergy-edge.ts`
- [x] `synergy-package.ts`
- [ ] `combo-chain.ts`
- [ ] `deck-analysis.ts`
- [x] `mechanic-tags.ts`
- [x] `card-roles.ts`
- [x] `synergy-types.ts`
- [x] `package-types.ts`
- [x] `resource-types.ts`

Step 4 - Add parser:

- [x] `normalize-card-text.ts`
- [x] `rule-patterns.ts`
- [x] `parse-card-profile.ts`
- [x] `classify-card-roles.ts`
- [x] `extract-triggers.ts`
- [x] `extract-resources.ts`
- [x] `extract-payoffs.ts`
- [x] `confidence.ts`

Step 5 - Add profile rebuild:

- [x] `src/lib/synergy/admin/rebuild-card-profiles.ts`
- [ ] `src/app/api/admin/synergy/rebuild-profiles/route.ts`
- [x] Test dry run.

Step 6 - Add synergy edge engine:

- [x] `find-synergy-edges.ts`
- [x] `score-synergy-edge.ts`
- [x] `explain-synergy-edge.ts`
- [x] `rebuild-synergy-edges.ts`
- [ ] `src/app/api/admin/synergy/rebuild-edges/route.ts`
- [x] Test dry run.

Step 7 - Add synergy package engine:

- [x] `discover-synergy-packages.ts`
- [x] `score-synergy-package.ts`
- [x] `explain-synergy-package.ts`
- [x] `rebuild-synergy-packages.ts`
- [ ] `src/app/api/admin/synergy/rebuild-packages/route.ts`
- [x] Test dry run.

Step 8 - Add card synergy API:

- [ ] `src/app/api/synergy/card/[cardId]/route.ts`
- [ ] Return profile.
- [ ] Return direct synergies.
- [ ] Return packages.
- [ ] Return combo chains.

Step 9 - Add card page UI:

- [ ] `SynergyPanel`
- [ ] `SynergyEdgeCard`
- [ ] `SynergyPackageCard`
- [ ] `ComboChainCard`
- [ ] `SynergyScoreBadge`
- [ ] `CardRoleBadges`
- [ ] `MechanicTagBadges`
- [ ] Add `SynergyPanel` to the existing card detail page.

Step 10 - Add graph combo discovery:

- [ ] `graph-types.ts`
- [ ] `build-card-graph.ts`
- [ ] `traverse-combo-graph.ts`
- [ ] `detect-loop-patterns.ts`
- [ ] `dedupe-combos.ts`
- [ ] `discover-combo-chains.ts`
- [ ] `score-combo-chain.ts`
- [ ] `explain-combo-chain.ts`
- [ ] `rebuild-combo-graph.ts`
- [ ] `src/app/api/admin/synergy/rebuild-graph/route.ts`
- [ ] Test with small limits first.

Step 11 - Add deck analyzer API:

- [ ] `analyze-deck.ts`
- [ ] `detect-archetypes.ts`
- [ ] `score-deck-synergy.ts`
- [ ] `explain-deck.ts`
- [ ] `src/app/api/synergy/deck/route.ts`
- [ ] Test API with sample deck.

Step 12 - Add deck analyzer UI:

- [ ] `src/app/synergy/deck-analyzer/page.tsx`
- [ ] `DeckAnalysisPanel`

Step 13 - Add synergy browse page:

- [ ] `src/app/synergy/page.tsx`
- [ ] Show top direct synergies.
- [ ] Show top multi-card packages.
- [ ] Show top combo chains.
- [ ] Show potential loops.
- [ ] Show engines.
- [ ] Show win conditions.

Step 14 - Run build checks:

- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Fix all TypeScript, Prisma, and route errors.

## Test Commands

Profile rebuild dry run:

```bash
curl -X POST http://localhost:3000/api/admin/synergy/rebuild-profiles \
  -H "Content-Type: application/json" \
  -d '{"game":"riftbound","limit":25,"dryRun":true}'
```

Synergy edge rebuild dry run:

```bash
curl -X POST http://localhost:3000/api/admin/synergy/rebuild-edges \
  -H "Content-Type: application/json" \
  -d '{"game":"riftbound","limit":100,"dryRun":true,"minScore":50}'
```

Synergy package rebuild dry run:

```bash
curl -X POST http://localhost:3000/api/admin/synergy/rebuild-packages \
  -H "Content-Type: application/json" \
  -d '{"game":"riftbound","dryRun":true,"minScore":65,"maxPackageSize":5}'
```

Combo graph rebuild dry run:

```bash
curl -X POST http://localhost:3000/api/admin/synergy/rebuild-graph \
  -H "Content-Type: application/json" \
  -d '{"game":"riftbound","limit":100,"dryRun":true,"maxDepth":5,"minScore":65}'
```

Deck analyzer API test:

```bash
curl -X POST http://localhost:3000/api/synergy/deck \
  -H "Content-Type: application/json" \
  -d '{
    "game":"riftbound",
    "deckName":"Test Deck",
    "cards":[
      {"name":"Example Card A","quantity":4},
      {"name":"Example Card B","quantity":4},
      {"name":"Example Card C","quantity":3}
    ]
  }'
```

Final checks:

```bash
npm run lint
npm run build
```

## Full Acceptance Checklist

Phase 1:

- [x] Every supported card can generate a `CardProfile`.
- [x] Profiles include tags, roles, triggers, produces, consumes, payoffs, risks, confidence.
- [x] Blank/weird cards do not crash the parser.
- [x] Low-confidence profiles are marked.

Phase 2:

- [x] Direct synergy edges are generated between compatible cards.
- [x] Edges have scores, types, tags, roles, explanations, weaknesses.
- [x] Edges are stored in `CardSynergy`.

Phase 3:

- [x] Multi-card packages are generated from synergy edges.
- [x] Packages include 3-5 cards.
- [x] Packages are typed: token, sacrifice, graveyard, resource, control, etc.
- [x] Packages include play patterns.
- [x] Packages are stored in `SynergyPackage`.

Phase 4:

- [ ] Card API returns profile, direct synergies, packages, and combos.
- [ ] Card page shows Synergy & Combo Finder panel.
- [ ] Empty states look clean.

Phase 5:

- [ ] Admin rebuild endpoints work.
- [ ] Dry-run mode works.
- [ ] Rebuild can target one game.
- [ ] Rebuild order works: profiles -> edges -> packages -> graph.

Phase 6:

- [ ] Graph combo discovery works.
- [ ] Combo chains are stored.
- [ ] Potential loops are flagged carefully.
- [ ] Potential infinites are not labeled as guaranteed unless proven.

Phase 7:

- [ ] User can paste a decklist.
- [ ] Cards resolve by name.
- [ ] Deck analysis returns archetypes, role coverage, packages, combos, missing roles, unsupported cards, suggestions, risks, and score.

Phase 8:

- [ ] LLM enhancement is optional.
- [ ] System works with `SYNERGY_LLM_ENABLED=false`.
- [ ] No LLM call is required for normal card page synergy search.

## Final Product Behavior Target

Card page target:

```txt
Synergy & Combo Finder

Roles:
Enabler, Engine Piece

Tags:
token_creation, attack_trigger, wide_board

Best Direct Synergies:
Card B - Strong - 86
This card creates tokens while Card B rewards token-based board states.

Multi-Card Packages:
Sacrifice Package - Strong - 87
Cards: A + B + C
Play Pattern: Create expendable units, sacrifice them, and convert death triggers into value.

Combo Chains:
A -> B -> C - Engine - 82
This sequence may create repeatable card advantage.
```

Deck analyzer target:

```txt
Deck Synergy Score: 78/100

Detected Archetype:
Sacrifice Engine

Strongest Packages:
- Sacrifice Package - 87
- Token Package - 79

Combo Chains:
- Token Creator -> Sacrifice Outlet -> Death Payoff

Weaknesses:
- Low protection
- Low search density
- 4 unsupported cards

Suggestions:
- Add more protection for the main engine
- Add more draw/search
- Review isolated cards
```

## Decision Log

| Date | Decision | Reason | Owner |
| --- | --- | --- | --- |
| 2026-04-29 | Preserve feature name as **Synergy & Combo Finder**. | Product naming is already set. | Codex |
| 2026-04-29 | Use database-driven search as the default architecture. | Avoid LLM calls on normal user search and card page requests. | Codex |
| 2026-04-29 | Treat two-card synergies as graph edges, not the final product. | Edges are the foundation for packages, combos, and deck analysis. | Codex |
| 2026-04-29 | Start with MVP profiles, edges, packages, card API/UI, and admin rebuilds. | This creates useful intelligence without overbuilding a full simulator. | Codex |
| 2026-04-29 | Put this tracker in `docs/synergy-combo-finder-checklist.md`. | Existing repo documentation lives in `docs/`. | Codex |
| 2026-04-30 | Store Redis catalog card profiles in `CatalogCardProfile` keyed by `game + catalogCardId`. | Gallery-sized card pools live in Redis catalog records, so Phase 1 needs persisted catalog intelligence beyond Prisma `Card` rows. | Codex |
| 2026-04-30 | Generate Phase 2 direct synergies from canonical catalog profiles first, with Prisma profiles as fallback. | Gallery card pools are catalog-backed, and edges should dedupe reprints/alternate arts by identity before later package discovery. | Codex |
| 2026-04-30 | Generate Phase 3 packages from stored `CardSynergy` edges, not raw card text. | Packages should be built from the atomic relationship layer so later combo and deck analysis can reuse the same graph foundation. | Codex |

## Work Log

| Date | Phase | Status | Notes |
| --- | --- | --- | --- |
| 2026-04-29 | Planning | Done | Created implementation tracker from the full build package. |
| 2026-04-29 | Phase 1 | Done | Added CardProfile storage, deterministic profile parser, internal dry-run rebuild service, tests, and successful lint/build checks. |
| 2026-04-29 | Gallery/catalog alignment | Done | Added card gallery cache warmup during catalog sync, `/api/cards` Redis timing logs, client fetch timeout messaging, and catalog-backed synergy profile dry-run support. |
| 2026-04-30 | Phase 1 | Done | Added `CatalogCardProfile` storage and enabled catalog profile rebuild writes for Redis-backed gallery cards. |
| 2026-04-30 | Phase 2 | Done | Added `CardSynergy`, deterministic direct edge rules/scoring/explanations, internal rebuild logic, and tests for catalog/prisma profile sources. |
| 2026-04-30 | Phase 3 | Done | Added `SynergyPackage`, deterministic 3-5 card package discovery, inference/scoring/explanations, internal rebuild logic, and tests. |

## Blockers and Questions Log

| Date | Area | Question / Blocker | Resolution |
| --- | --- | --- | --- |
| 2026-04-29 | Admin auth | Need to inspect whether NexusArchive already has admin auth before choosing `SYNERGY_ADMIN_TOKEN`. | Pending repo implementation work. |
| 2026-04-29 | Card model | Need to inspect existing Prisma `Card` model and card text fields before adding relations or rebuild queries. | Resolved in Phase 1: `Card.id` is `Int`, `Card.game` uses Prisma `Game`, and rules text comes from `Card.text`. |
| 2026-04-29 | Game-specific rules | Combo loop and infinite detection requires game-specific rules before any guaranteed infinite labels. | Use potential labels until proven. |
| 2026-04-29 | Catalog profile storage | Gallery-sized card pools live in Redis catalog records, while Phase 1 `CardProfile` rows cover Prisma `Card` rows only. | Resolved on 2026-04-30: added `CatalogCardProfile` keyed by `game + catalogCardId` and enabled catalog profile rebuild writes. |
