import riftboundFeed from "@/data/combos/riftbound.json";
import onePieceFeed from "@/data/combos/one-piece.json";
import type { GameSlug } from "@/lib/games";
import prisma from "@/lib/db";
import { normalizeCardIdentityName } from "@/lib/cards/identity";

import { getComboCatalogLookup, resolveCatalogCard } from "./catalog";
import type {
  ComboSyncAdapter,
  ComboSyncCardRecord,
  ComboSyncRecord,
  ComboSyncRunSummary,
} from "./types";

type CommanderSpellbookCard = {
  id?: number;
  name?: string;
};

type CommanderSpellbookFeature = {
  name?: string;
};

type CommanderSpellbookVariant = {
  id: string;
  description?: string | null;
  easyPrerequisites?: string | null;
  notablePrerequisites?: string | null;
  popularity?: number | null;
  uses?: Array<{
    quantity?: number | null;
    mustBeCommander?: boolean | null;
    card?: CommanderSpellbookCard | null;
  }>;
  requires?: Array<{
    quantity?: number | null;
    card?: CommanderSpellbookCard | null;
    template?: { name?: string | null } | null;
  }>;
  produces?: Array<{
    feature?: CommanderSpellbookFeature | null;
    quantity?: number | null;
  }>;
  legalities?: Record<string, boolean | null | undefined> | null;
};

type CommanderSpellbookVariantsResponse = {
  next: string | null;
  results: CommanderSpellbookVariant[];
};

const GAME_TO_PRISMA = {
  riftbound: "RIFTBOUND",
  "one-piece": "ONE_PIECE",
  "magic-the-gathering": "MAGIC_THE_GATHERING",
} as const;

function slugifyComboName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function mapLocalFeedRecord(
  game: GameSlug,
  source: string,
  record: (typeof riftboundFeed)[number],
): ComboSyncRecord {
  return {
    game,
    source,
    kind: "combo",
    name: record.name,
    summary: record.summary ?? null,
    resultText: record.resultText ?? null,
    steps: record.steps ?? [],
    prerequisites: record.prerequisites ?? [],
    tags: record.tags ?? [],
    formatTags: record.formatTags ?? [],
    isComplete: record.isComplete ?? true,
    popularity: record.popularity ?? null,
    pieces: (record.pieces ?? []).map((piece) => ({
      role: piece.role ?? "piece",
      quantity: piece.quantity ?? 1,
      cardName: piece.cardName,
    })),
  };
}

function formatLegalities(legalities: CommanderSpellbookVariant["legalities"]) {
  if (!legalities) {
    return [] satisfies string[];
  }

  return Object.entries(legalities)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([format]) => format.replace(/([A-Z])/g, " $1"))
    .map((format) => format.charAt(0).toUpperCase() + format.slice(1))
    .slice(0, 8);
}

function splitDescriptionSteps(description: string | null | undefined) {
  return (description ?? "")
    .split(/\n+/)
    .map((step) => step.trim())
    .filter(Boolean);
}

function buildCommanderSpellbookName(variant: CommanderSpellbookVariant) {
  const cardNames = (variant.uses ?? [])
    .map((use) => use.card?.name?.trim())
    .filter((value): value is string => Boolean(value));
  if (cardNames.length === 0) {
    return `Commander Spellbook ${variant.id}`;
  }

  const label = cardNames.slice(0, 4).join(" + ");
  return cardNames.length > 4 ? `${label} + more` : label;
}

function buildCommanderSpellbookSummary(variant: CommanderSpellbookVariant) {
  const features = (variant.produces ?? [])
    .map((entry) => entry.feature?.name?.trim())
    .filter((value): value is string => Boolean(value));

  if (features.length > 0) {
    return features.slice(0, 3).join(" · ");
  }

  const firstStep = splitDescriptionSteps(variant.description)[0];
  return firstStep ?? null;
}

function mapCommanderSpellbookPieces(variant: CommanderSpellbookVariant) {
  const pieces: ComboSyncCardRecord[] = [];

  for (const use of variant.uses ?? []) {
    if (!use.card?.name?.trim()) {
      continue;
    }

    pieces.push({
      role: use.mustBeCommander ? "commander" : "piece",
      quantity: Math.max(1, use.quantity ?? 1),
      cardName: use.card.name.trim(),
    });
  }

  for (const requirement of variant.requires ?? []) {
    if (requirement.card?.name?.trim()) {
      pieces.push({
        role: "required",
        quantity: Math.max(1, requirement.quantity ?? 1),
        cardName: requirement.card.name.trim(),
      });
    }
  }

  return pieces;
}

function mapCommanderSpellbookPrerequisites(variant: CommanderSpellbookVariant) {
  const prerequisites = [
    ...((variant.requires ?? [])
      .map((entry) => entry.template?.name?.trim())
      .filter((value): value is string => Boolean(value))),
  ];

  if (variant.easyPrerequisites?.trim()) {
    prerequisites.push(variant.easyPrerequisites.trim());
  }

  if (variant.notablePrerequisites?.trim()) {
    prerequisites.push(variant.notablePrerequisites.trim());
  }

  return [...new Set(prerequisites)];
}

function mapCommanderSpellbookRecord(variant: CommanderSpellbookVariant): ComboSyncRecord {
  const steps = splitDescriptionSteps(variant.description);
  const tags = (variant.produces ?? [])
    .map((entry) => entry.feature?.name?.trim())
    .filter((value): value is string => Boolean(value));

  return {
    game: "magic-the-gathering",
    source: "commander-spellbook",
    externalId: variant.id,
    kind: "combo",
    name: buildCommanderSpellbookName(variant),
    slug: `spellbook-${slugifyComboName(buildCommanderSpellbookName(variant))}-${variant.id.toLowerCase()}`,
    summary: buildCommanderSpellbookSummary(variant),
    resultText: tags.join(" · ") || null,
    steps,
    prerequisites: mapCommanderSpellbookPrerequisites(variant),
    tags,
    formatTags: formatLegalities(variant.legalities),
    isComplete: true,
    popularity: variant.popularity ?? null,
    pieces: mapCommanderSpellbookPieces(variant),
  };
}

async function fetchCommanderSpellbookRecords() {
  const records: ComboSyncRecord[] = [];
  let nextUrl: string | null = "https://backend.commanderspellbook.com/variants?limit=200";

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Commander Spellbook sync failed with HTTP ${response.status}.`,
      );
    }

    const payload = (await response.json()) as CommanderSpellbookVariantsResponse;
    records.push(...(payload.results ?? []).map(mapCommanderSpellbookRecord));
    nextUrl = payload.next;
  }

  return records;
}

function buildLocalFeedAdapter(
  game: GameSlug,
  source: string,
  feed: typeof riftboundFeed,
): ComboSyncAdapter {
  return {
    source,
    loadRecords: async () => feed.map((record) => mapLocalFeedRecord(game, source, record)),
  };
}

function buildCommanderSpellbookAdapter(): ComboSyncAdapter {
  return {
    source: "commander-spellbook",
    loadRecords: fetchCommanderSpellbookRecords,
  };
}

export function buildDefaultComboSyncAdapters() {
  return [
    buildLocalFeedAdapter("riftbound", "riftbound-local-feed", riftboundFeed),
    buildLocalFeedAdapter("one-piece", "one-piece-local-feed", onePieceFeed),
    buildCommanderSpellbookAdapter(),
  ] satisfies ComboSyncAdapter[];
}

async function enrichPieces(game: GameSlug, pieces: ComboSyncCardRecord[]) {
  const lookup = await getComboCatalogLookup(game);
  return pieces.map((piece, index) => {
    const catalogCard = resolveCatalogCard(lookup, {
      familyKey: piece.familyKey ?? null,
      cardName: piece.cardName,
    });

    return {
      sortOrder: index,
      quantity: Math.max(1, piece.quantity),
      role: piece.role,
      familyKey:
        piece.familyKey ??
        catalogCard?.familyKey ??
        normalizeCardIdentityName(piece.cardName),
      cardName: catalogCard?.name ?? piece.cardName,
      cardId:
        catalogCard?.id && /^\d+$/.test(catalogCard.id)
          ? Number.parseInt(catalogCard.id, 10)
          : null,
    };
  });
}

async function syncRecord(record: ComboSyncRecord) {
  const slug =
    record.slug?.trim() ||
    `${slugifyComboName(record.name)}${record.externalId ? `-${record.externalId}` : ""}`;
  const pieces = await enrichPieces(record.game, record.pieces);

  await prisma.combo.upsert({
    where: {
      game_slug: {
        game: GAME_TO_PRISMA[record.game],
        slug,
      },
    },
    create: {
      game: GAME_TO_PRISMA[record.game],
      slug,
      source: record.source,
      externalId: record.externalId ?? null,
      kind: record.kind,
      name: record.name,
      summary: record.summary ?? null,
      resultText: record.resultText ?? null,
      steps: record.steps ?? [],
      prerequisites: record.prerequisites ?? [],
      tags: record.tags ?? [],
      formatTags: record.formatTags ?? [],
      isComplete: record.isComplete ?? true,
      popularity: record.popularity ?? null,
      comboEntries: {
        create: pieces,
      },
    },
    update: {
      source: record.source,
      externalId: record.externalId ?? null,
      kind: record.kind,
      name: record.name,
      summary: record.summary ?? null,
      resultText: record.resultText ?? null,
      steps: record.steps ?? [],
      prerequisites: record.prerequisites ?? [],
      tags: record.tags ?? [],
      formatTags: record.formatTags ?? [],
      isComplete: record.isComplete ?? true,
      popularity: record.popularity ?? null,
      comboEntries: {
        deleteMany: {},
        create: pieces,
      },
    },
  });
}

async function retireMissingCombos(
  source: string,
  records: ComboSyncRecord[],
) {
  const retainedIds = new Set(
    records
      .map((record) => record.externalId?.trim())
      .filter((value): value is string => Boolean(value)),
  );

  if (retainedIds.size === 0) {
    return 0;
  }

  const staleCombos = await prisma.combo.findMany({
    where: {
      source,
      externalId: { not: null },
    },
    select: {
      id: true,
      externalId: true,
    },
  });

  const staleIds = staleCombos
    .filter((combo) => combo.externalId && !retainedIds.has(combo.externalId))
    .map((combo) => combo.id);

  if (staleIds.length === 0) {
    return 0;
  }

  await prisma.combo.deleteMany({
    where: {
      id: { in: staleIds },
    },
  });

  return staleIds.length;
}

export async function runComboSync() {
  const startedAt = new Date();
  const adapters = buildDefaultComboSyncAdapters();
  const adapterSummaries: ComboSyncRunSummary["adapters"] = [];

  for (const adapter of adapters) {
    const summary = {
      source: adapter.source,
      recordsLoaded: 0,
      recordsSynced: 0,
      retired: 0,
      errors: [] as string[],
    };

    try {
      const records = await adapter.loadRecords();
      summary.recordsLoaded = records.length;

      for (const record of records) {
        try {
          await syncRecord(record);
          summary.recordsSynced += 1;
        } catch (error) {
          summary.errors.push(
            error instanceof Error ? error.message : "Unknown sync failure.",
          );
        }
      }

      summary.retired = await retireMissingCombos(adapter.source, records);
    } catch (error) {
      summary.errors.push(
        error instanceof Error ? error.message : "Unknown adapter failure.",
      );
    }

    adapterSummaries.push(summary);
  }

  return {
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    adapters: adapterSummaries,
  } satisfies ComboSyncRunSummary;
}
