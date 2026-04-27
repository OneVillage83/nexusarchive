import type { CardCatalogSummary } from "@/lib/cards/catalog";
import type { GameSlug } from "@/lib/games";

export type DeckVisibilityValue = "PUBLIC" | "PRIVATE";
export type DeckRulesModeValue = "COMPETITIVE" | "STANDARD" | "HOUSE";

export type DeckBuilderEntry = {
  familyKey: string;
  displayCardId?: string | null;
  cardName: string;
  imageUrl?: string | null;
  typeLine?: string | null;
  text?: string | null;
  domainValues: string[];
  cost?: number | null;
  power?: number | null;
  might?: number | null;
  hp?: number | null;
  setCode?: string | null;
  setName?: string | null;
  rarity?: string | null;
  versionLabel?: string | null;
  sectionKey: string;
  quantity: number;
  sortOrder: number;
};

export type DeckSectionConfig = {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
};

export type DeckFormatConfig = {
  key: string;
  label: string;
  description: string;
  rulesModes: DeckRulesModeValue[];
};

export type DeckGameConfig = {
  game: GameSlug;
  defaultFormatKey: string;
  defaultRulesMode: DeckRulesModeValue;
  formats: DeckFormatConfig[];
};

export type DeckStatMetric = {
  label: string;
  value: string;
  note?: string;
};

export type DeckStatBar = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type DeckLegalityIssue = {
  severity: "error" | "warning" | "info";
  message: string;
};

export type DeckStatsSummary = {
  totalCards: number;
  uniqueCards: number;
  headline: DeckStatMetric[];
  sectionBars: DeckStatBar[];
  curveBars: DeckStatBar[];
  domainBars: DeckStatBar[];
  issues: DeckLegalityIssue[];
};

type MinimalCardShape = Pick<
  CardCatalogSummary,
  | "game"
  | "id"
  | "name"
  | "type"
  | "text"
  | "domains"
  | "energyCost"
  | "power"
  | "might"
  | "hp"
  | "setCode"
  | "setName"
  | "rarity"
  | "imageUrl"
  | "versionLabel"
  | "familyKey"
>;

function percentage(count: number, total: number) {
  return total <= 0 ? 0 : Math.round((count / total) * 100);
}

function slugToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isBasicLandName(name: string) {
  return ["plains", "island", "swamp", "mountain", "forest", "wastes"].includes(
    name.trim().toLowerCase(),
  );
}

export function slugifyDeckName(name: string) {
  const base = slugToken(name);
  return base || "new-deck";
}

export const DECK_GAME_CONFIG: Record<GameSlug, DeckGameConfig> = {
  riftbound: {
    game: "riftbound",
    defaultFormatKey: "competitive",
    defaultRulesMode: "STANDARD",
    formats: [
      {
        key: "competitive",
        label: "Competitive",
        description: "Ranked-ready Riftbound construction.",
        rulesModes: ["STANDARD", "HOUSE"],
      },
    ],
  },
  "one-piece": {
    game: "one-piece",
    defaultFormatKey: "competitive",
    defaultRulesMode: "STANDARD",
    formats: [
      {
        key: "competitive",
        label: "Competitive",
        description: "Standard tournament-style One Piece construction.",
        rulesModes: ["STANDARD", "HOUSE"],
      },
    ],
  },
  "magic-the-gathering": {
    game: "magic-the-gathering",
    defaultFormatKey: "commander",
    defaultRulesMode: "COMPETITIVE",
    formats: [
      {
        key: "commander",
        label: "Commander",
        description: "Competitive Commander shell with a dedicated commander slot.",
        rulesModes: ["COMPETITIVE", "HOUSE"],
      },
      {
        key: "standard",
        label: "Standard",
        description: "60-card Standard shell.",
        rulesModes: ["COMPETITIVE", "HOUSE"],
      },
      {
        key: "pioneer",
        label: "Pioneer",
        description: "60-card Pioneer shell.",
        rulesModes: ["COMPETITIVE", "HOUSE"],
      },
      {
        key: "modern",
        label: "Modern",
        description: "60-card Modern shell.",
        rulesModes: ["COMPETITIVE", "HOUSE"],
      },
      {
        key: "legacy",
        label: "Legacy",
        description: "60-card Legacy shell.",
        rulesModes: ["COMPETITIVE", "HOUSE"],
      },
      {
        key: "vintage",
        label: "Vintage",
        description: "60-card Vintage shell.",
        rulesModes: ["COMPETITIVE", "HOUSE"],
      },
      {
        key: "pauper",
        label: "Pauper",
        description: "60-card Pauper shell.",
        rulesModes: ["COMPETITIVE", "HOUSE"],
      },
    ],
  },
};

const RIFTBOUND_SECTIONS: DeckSectionConfig[] = [
  {
    key: "legends",
    label: "Legends",
    shortLabel: "Legends",
    description: "The named, flashy, generally important cardboard.",
  },
  {
    key: "units",
    label: "Units",
    shortLabel: "Units",
    description: "Bodies that do the actual punching.",
  },
  {
    key: "spells",
    label: "Spells",
    shortLabel: "Spells",
    description: "Instants, tricks, and cardboard violence.",
  },
  {
    key: "gear",
    label: "Gear",
    shortLabel: "Gear",
    description: "Equipment, tools, and suspicious upgrades.",
  },
  {
    key: "battlefields",
    label: "Battlefields",
    shortLabel: "Fields",
    description: "Landscape pieces and wide cardboard real estate.",
  },
  {
    key: "runes",
    label: "Runes",
    shortLabel: "Runes",
    description: "Rune deck and supporting rune pieces.",
  },
  {
    key: "extras",
    label: "Tokens & Extras",
    shortLabel: "Extras",
    description: "Tokens, side furniture, and weird rule baggage.",
  },
];

const ONE_PIECE_SECTIONS: DeckSectionConfig[] = [
  {
    key: "leader",
    label: "Leader",
    shortLabel: "Leader",
    description: "Your captain. Singular. Dramatic.",
  },
  {
    key: "characters",
    label: "Characters",
    shortLabel: "Chars",
    description: "Crew members and other people starting trouble.",
  },
  {
    key: "events",
    label: "Events",
    shortLabel: "Events",
    description: "Combat tricks and plot twists.",
  },
  {
    key: "stages",
    label: "Stages",
    shortLabel: "Stages",
    description: "Persistent locations and support pieces.",
  },
  {
    key: "extras",
    label: "Tokens & Extras",
    shortLabel: "Extras",
    description: "DON!! helpers, reminder cards, and oddballs.",
  },
];

const MTG_SECTIONS_COMMANDER: DeckSectionConfig[] = [
  {
    key: "commander",
    label: "Commander",
    shortLabel: "Cmdr",
    description: "The card everybody will absolutely have opinions about.",
  },
  {
    key: "creatures",
    label: "Creatures",
    shortLabel: "Creatures",
    description: "Attackers, blockers, and combo liability units.",
  },
  {
    key: "artifacts",
    label: "Artifacts",
    shortLabel: "Artifacts",
    description: "Rocks, swords, and suspicious machinery.",
  },
  {
    key: "enchantments",
    label: "Enchantments",
    shortLabel: "Enchants",
    description: "Persistent cardboard commitments.",
  },
  {
    key: "instants",
    label: "Instants",
    shortLabel: "Instants",
    description: "Stack interaction and surprise nonsense.",
  },
  {
    key: "sorceries",
    label: "Sorceries",
    shortLabel: "Sorceries",
    description: "Big main-phase statements.",
  },
  {
    key: "planeswalkers",
    label: "Planeswalkers",
    shortLabel: "Walkers",
    description: "Loyalty boxes and escalating table hate.",
  },
  {
    key: "battles",
    label: "Battles",
    shortLabel: "Battles",
    description: "Sieges, skirmishes, and newer cardboard species.",
  },
  {
    key: "lands",
    label: "Lands",
    shortLabel: "Lands",
    description: "The mana infrastructure keeping the deck honest.",
  },
  {
    key: "extras",
    label: "Tokens & Extras",
    shortLabel: "Extras",
    description: "Tokens and all the side-prop nonsense.",
  },
];

const MTG_SECTIONS_60_CARD: DeckSectionConfig[] = MTG_SECTIONS_COMMANDER.filter(
  (section) => section.key !== "commander",
);

export function getDeckSections(game: GameSlug, formatKey: string) {
  if (game === "riftbound") {
    return RIFTBOUND_SECTIONS;
  }

  if (game === "one-piece") {
    return ONE_PIECE_SECTIONS;
  }

  return formatKey === "commander"
    ? MTG_SECTIONS_COMMANDER
    : MTG_SECTIONS_60_CARD;
}

export function getDeckFormatOptions(game: GameSlug) {
  return DECK_GAME_CONFIG[game].formats;
}

export function getDefaultDeckFormat(game: GameSlug) {
  return DECK_GAME_CONFIG[game].defaultFormatKey;
}

export function getDefaultRulesMode(game: GameSlug) {
  return DECK_GAME_CONFIG[game].defaultRulesMode;
}

export function getRulesModeLabel(
  game: GameSlug,
  rulesMode: DeckRulesModeValue,
) {
  if (rulesMode === "HOUSE") {
    return "House Rules";
  }

  if (game === "magic-the-gathering") {
    return rulesMode === "COMPETITIVE" ? "Competitive" : "Standard Rules";
  }

  return rulesMode === "STANDARD" ? "Standard Rules" : "Competitive";
}

export function normalizeDeckFormat(game: GameSlug, formatKey?: string | null) {
  const options = getDeckFormatOptions(game);
  return (
    options.find((option) => option.key === formatKey)?.key ??
    DECK_GAME_CONFIG[game].defaultFormatKey
  );
}

export function normalizeRulesMode(
  game: GameSlug,
  formatKey: string,
  rulesMode?: string | null,
) {
  const format = getDeckFormatOptions(game).find((option) => option.key === formatKey);
  const allowed = format?.rulesModes ?? [getDefaultRulesMode(game)];
  return allowed.includes((rulesMode ?? "") as DeckRulesModeValue)
    ? ((rulesMode ?? allowed[0]) as DeckRulesModeValue)
    : allowed[0]!;
}

export function buildDeckEntryFromCard(
  card: MinimalCardShape,
  sectionKey: string,
  sortOrder: number,
): DeckBuilderEntry {
  return {
    familyKey: card.familyKey ?? slugToken(card.name || card.id),
    displayCardId: card.id,
    cardName: card.name,
    imageUrl: card.imageUrl,
    typeLine: card.type,
    text: card.text,
    domainValues: [...card.domains],
    cost: card.energyCost,
    power: card.power,
    might: card.might,
    hp: card.hp,
    setCode: card.setCode,
    setName: card.setName,
    rarity: card.rarity,
    versionLabel: card.versionLabel ?? null,
    sectionKey,
    quantity: 1,
    sortOrder,
  };
}

export function inferDeckSection(
  game: GameSlug,
  formatKey: string,
  card: Pick<
    MinimalCardShape,
    "type" | "name" | "domains" | "familyKey"
  >,
  existingEntries: DeckBuilderEntry[],
) {
  const typeLine = (card.type ?? "").toLowerCase();

  if (game === "riftbound") {
    if (typeLine.includes("token")) {
      return "extras";
    }
    if (typeLine.includes("battlefield")) {
      return "battlefields";
    }
    if (typeLine.includes("rune")) {
      return "runes";
    }
    if (typeLine.includes("gear")) {
      return "gear";
    }
    if (typeLine.includes("spell")) {
      return "spells";
    }
    if (typeLine.includes("legend")) {
      return "legends";
    }
    if (typeLine.includes("unit")) {
      return "units";
    }
    return "extras";
  }

  if (game === "one-piece") {
    if (typeLine.includes("leader")) {
      return "leader";
    }
    if (typeLine.includes("stage")) {
      return "stages";
    }
    if (typeLine.includes("event")) {
      return "events";
    }
    if (typeLine.includes("character")) {
      return "characters";
    }
    return "extras";
  }

  if (
    formatKey === "commander" &&
    !existingEntries.some((entry) => entry.sectionKey === "commander") &&
    (typeLine.includes("legendary creature") ||
      typeLine.includes("legendary planeswalker"))
  ) {
    return "commander";
  }

  if (typeLine.includes("land")) {
    return "lands";
  }
  if (typeLine.includes("planeswalker")) {
    return "planeswalkers";
  }
  if (typeLine.includes("battle")) {
    return "battles";
  }
  if (typeLine.includes("instant")) {
    return "instants";
  }
  if (typeLine.includes("sorcery")) {
    return "sorceries";
  }
  if (typeLine.includes("enchantment")) {
    return "enchantments";
  }
  if (typeLine.includes("artifact")) {
    return "artifacts";
  }
  if (typeLine.includes("creature")) {
    return "creatures";
  }

  return "extras";
}

function countBySection(entries: DeckBuilderEntry[]) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    counts.set(entry.sectionKey, (counts.get(entry.sectionKey) ?? 0) + entry.quantity);
  }

  return counts;
}

function countByDomains(entries: DeckBuilderEntry[]) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const domain of entry.domainValues) {
      counts.set(domain, (counts.get(domain) ?? 0) + entry.quantity);
    }
  }

  return counts;
}

function buildCurveBars(entries: DeckBuilderEntry[]) {
  const buckets = new Map<string, number>();

  for (const label of ["0", "1", "2", "3", "4", "5", "6", "7+"]) {
    buckets.set(label, 0);
  }

  for (const entry of entries) {
    const cost = entry.cost ?? 0;
    const bucket =
      cost >= 7 ? "7+" : cost <= 0 ? "0" : String(cost);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + entry.quantity);
  }

  const total = [...buckets.values()].reduce((sum, count) => sum + count, 0);

  return [...buckets.entries()].map(([key, count]) => ({
    key,
    label: key,
    count,
    percent: percentage(count, total),
  }));
}

function buildBarDataFromMap(
  counts: Map<string, number>,
  total: number,
  preferredOrder: string[] = [],
) {
  const seen = new Set<string>();
  const items: DeckStatBar[] = [];

  for (const key of preferredOrder) {
    const count = counts.get(key) ?? 0;
    if (count <= 0) {
      continue;
    }
    items.push({
      key,
      label: key,
      count,
      percent: percentage(count, total),
    });
    seen.add(key);
  }

  for (const [key, count] of [...counts.entries()].sort((left, right) => right[1] - left[1])) {
    if (seen.has(key) || count <= 0) {
      continue;
    }

    items.push({
      key,
      label: key,
      count,
      percent: percentage(count, total),
    });
  }

  return items;
}

function demoteIssuesForHouseRules(issues: DeckLegalityIssue[]) {
  return issues.map((issue) =>
    issue.severity === "error"
      ? {
          ...issue,
          severity: "warning" as const,
        }
      : issue,
  );
}

export function computeDeckStats(
  game: GameSlug,
  formatKey: string,
  rulesMode: DeckRulesModeValue,
  entries: DeckBuilderEntry[],
): DeckStatsSummary {
  const totalCards = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const uniqueCards = entries.length;
  const sections = getDeckSections(game, formatKey);
  const sectionCounts = countBySection(entries);
  const domainCounts = countByDomains(entries);
  const curveBars = buildCurveBars(entries);
  const sectionBars = sections.map((section) => {
    const count = sectionCounts.get(section.key) ?? 0;
    return {
      key: section.key,
      label: section.label,
      count,
      percent: percentage(count, totalCards),
    };
  });

  const domainOrder =
    game === "riftbound"
      ? ["Calm", "Chaos", "Body", "Mind", "Order", "Fury"]
      : game === "one-piece"
        ? ["Red", "Blue", "Green", "Purple", "Black", "Yellow"]
        : ["White", "Blue", "Black", "Red", "Green", "Colorless"];
  const domainBars = buildBarDataFromMap(domainCounts, totalCards, domainOrder);

  const headline: DeckStatMetric[] = [
    {
      label: "Cards",
      value: String(totalCards),
      note: `${uniqueCards} unique`,
    },
  ];
  const issues: DeckLegalityIssue[] = [];

  if (game === "riftbound") {
    const legendCount = sectionCounts.get("legends") ?? 0;
    const unitCount = sectionCounts.get("units") ?? 0;
    const spellCount = sectionCounts.get("spells") ?? 0;
    const battlefieldCount = sectionCounts.get("battlefields") ?? 0;

    headline.push(
      {
        label: "Legends",
        value: String(legendCount),
        note: "Named centerpieces",
      },
      {
        label: "Units / Spells",
        value: `${unitCount} / ${spellCount}`,
        note: "Bodies versus tricks",
      },
      {
        label: "Battlefields",
        value: String(battlefieldCount),
        note: "Horizontal real estate",
      },
    );

    if (totalCards < 40 || totalCards > 60) {
      issues.push({
        severity: "error",
        message: "Competitive Riftbound builds should usually land between 40 and 60 cards.",
      });
    }

    if (legendCount === 0) {
      issues.push({
        severity: "warning",
        message: "This list has no legend section yet, so it still looks more like a box of parts than a finished deck.",
      });
    }
  } else if (game === "one-piece") {
    const leaderCount = sectionCounts.get("leader") ?? 0;
    const characterCount = sectionCounts.get("characters") ?? 0;
    const eventCount = sectionCounts.get("events") ?? 0;
    const stageCount = sectionCounts.get("stages") ?? 0;
    const mainDeckCards = totalCards - leaderCount;

    headline.push(
      {
        label: "Leader",
        value: String(leaderCount),
        note: "Should be exactly one",
      },
      {
        label: "Main Deck",
        value: String(mainDeckCards),
        note: "Characters, events, and stages",
      },
      {
        label: "Split",
        value: `${characterCount}/${eventCount}/${stageCount}`,
        note: "Characters / Events / Stages",
      },
    );

    if (leaderCount !== 1) {
      issues.push({
        severity: "error",
        message: "Competitive One Piece decks need exactly one leader.",
      });
    }

    if (mainDeckCards !== 50) {
      issues.push({
        severity: "error",
        message: "Competitive One Piece decks should sit at 50 non-leader cards.",
      });
    }
  } else {
    const landCount = sectionCounts.get("lands") ?? 0;
    const commanderCount = sectionCounts.get("commander") ?? 0;
    const creatureCount = sectionCounts.get("creatures") ?? 0;
    const totalManaValue = entries.reduce(
      (sum, entry) => sum + (entry.cost ?? 0) * entry.quantity,
      0,
    );
    const nonLandCount = Math.max(1, totalCards - landCount);
    const averageManaValue = (totalManaValue / nonLandCount).toFixed(2);

    headline.push(
      {
        label: formatKey === "commander" ? "Commander" : "Format",
        value:
          formatKey === "commander"
            ? String(commanderCount)
            : getDeckFormatOptions(game).find((format) => format.key === formatKey)?.label ?? formatKey,
        note:
          formatKey === "commander"
            ? "Legend in the command zone"
            : "Tournament shell",
      },
      {
        label: "Lands",
        value: String(landCount),
        note: "Mana infrastructure",
      },
      {
        label: "Avg MV",
        value: averageManaValue,
        note: `${creatureCount} creatures`,
      },
    );

    if (formatKey === "commander") {
      if (commanderCount !== 1) {
        issues.push({
          severity: "error",
          message: "Commander wants exactly one commander in the command zone.",
        });
      }

      if (totalCards !== 100) {
        issues.push({
          severity: "error",
          message: "Commander lists should total 100 cards including the commander.",
        });
      }
    } else if (totalCards < 60) {
      issues.push({
        severity: "error",
        message: "This format wants at least 60 cards before it stops glaring at you.",
      });
    }

    const duplicateViolations = entries.filter(
      (entry) =>
        entry.quantity > 1 &&
        !isBasicLandName(entry.cardName) &&
        entry.sectionKey !== "lands",
    );
    if (formatKey === "commander" && duplicateViolations.length > 0) {
      issues.push({
        severity: "warning",
        message: "Commander duplicates are showing up. That is fine for house rules, less fine for actual pods.",
      });
    }
  }

  return {
    totalCards,
    uniqueCards,
    headline,
    sectionBars,
    curveBars,
    domainBars,
    issues:
      rulesMode === "HOUSE"
        ? demoteIssuesForHouseRules(issues)
        : issues,
  };
}
