import {
  DeckRulesMode as PrismaDeckRulesMode,
  DeckVisibility as PrismaDeckVisibility,
  Game as PrismaGame,
} from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

import { isClerkConfigured } from "@/lib/auth-config";
import prisma from "@/lib/db";
import type { GameSlug } from "@/lib/games";

import {
  computeDeckStats,
  getDefaultDeckFormat,
  getDefaultRulesMode,
  getDeckSections,
  normalizeDeckFormat,
  normalizeRulesMode,
  slugifyDeckName,
  type DeckBuilderEntry,
  type DeckRulesModeValue,
  type DeckVisibilityValue,
} from "./config";

const GAME_TO_PRISMA: Record<GameSlug, PrismaGame> = {
  riftbound: PrismaGame.RIFTBOUND,
  "one-piece": PrismaGame.ONE_PIECE,
  "magic-the-gathering": PrismaGame.MAGIC_THE_GATHERING,
};

export type DeckListScope = "community" | "mine";

export type DeckSummary = {
  id: number;
  game: GameSlug;
  slug: string;
  name: string;
  description: string | null;
  formatKey: string;
  rulesMode: DeckRulesModeValue;
  visibility: DeckVisibilityValue;
  authorLabel: string;
  owner: boolean;
  createdAt: string;
  updatedAt: string;
  coverImageUrl: string | null;
  totalCards: number;
  uniqueCards: number;
  sectionPreview: Array<{
    key: string;
    label: string;
    count: number;
  }>;
};

export type DeckDetail = DeckSummary & {
  entries: DeckBuilderEntry[];
  stats: ReturnType<typeof computeDeckStats>;
  canEdit: boolean;
};

export type DeckWriteInput = {
  game: GameSlug;
  name: string;
  description?: string | null;
  visibility?: DeckVisibilityValue;
  formatKey?: string | null;
  rulesMode?: DeckRulesModeValue | null;
  entries: DeckBuilderEntry[];
};

function isMissingDeckTableError(error: unknown) {
  return (
    error instanceof Error &&
    /P2021|P2022|does not exist|Unknown field|Unknown arg/i.test(error.message)
  );
}

function toVisibility(value?: DeckVisibilityValue | null) {
  return value === "PRIVATE"
    ? PrismaDeckVisibility.PRIVATE
    : PrismaDeckVisibility.PUBLIC;
}

function toRulesMode(value: DeckRulesModeValue) {
  switch (value) {
    case "COMPETITIVE":
      return PrismaDeckRulesMode.COMPETITIVE;
    case "HOUSE":
      return PrismaDeckRulesMode.HOUSE;
    case "STANDARD":
    default:
      return PrismaDeckRulesMode.STANDARD;
  }
}

function fromRulesMode(value: PrismaDeckRulesMode): DeckRulesModeValue {
  switch (value) {
    case PrismaDeckRulesMode.COMPETITIVE:
      return "COMPETITIVE";
    case PrismaDeckRulesMode.HOUSE:
      return "HOUSE";
    case PrismaDeckRulesMode.STANDARD:
    default:
      return "STANDARD";
  }
}

function fromVisibility(value: PrismaDeckVisibility): DeckVisibilityValue {
  return value === PrismaDeckVisibility.PRIVATE ? "PRIVATE" : "PUBLIC";
}

function coerceEntry(entry: DeckBuilderEntry, index: number): DeckBuilderEntry | null {
  const familyKey = entry.familyKey?.trim();
  const cardName = entry.cardName?.trim();
  const sectionKey = entry.sectionKey?.trim();
  const quantity = Math.max(1, Math.min(99, Math.trunc(entry.quantity ?? 1)));

  if (!familyKey || !cardName || !sectionKey) {
    return null;
  }

  return {
    familyKey,
    displayCardId: entry.displayCardId?.trim() || null,
    cardName,
    imageUrl: entry.imageUrl?.trim() || null,
    typeLine: entry.typeLine?.trim() || null,
    text: entry.text?.trim() || null,
    domainValues: entry.domainValues.filter(Boolean),
    cost: Number.isFinite(entry.cost) ? Math.trunc(entry.cost ?? 0) : null,
    power: Number.isFinite(entry.power) ? Math.trunc(entry.power ?? 0) : null,
    might: Number.isFinite(entry.might) ? Math.trunc(entry.might ?? 0) : null,
    hp: Number.isFinite(entry.hp) ? Math.trunc(entry.hp ?? 0) : null,
    setCode: entry.setCode?.trim() || null,
    setName: entry.setName?.trim() || null,
    rarity: entry.rarity?.trim() || null,
    versionLabel: entry.versionLabel?.trim() || null,
    sectionKey,
    quantity,
    sortOrder: index,
  };
}

function normalizeWriteInput(input: DeckWriteInput) {
  const name = input.name.trim();
  const formatKey = normalizeDeckFormat(
    input.game,
    input.formatKey ?? getDefaultDeckFormat(input.game),
  );
  const rulesMode = normalizeRulesMode(
    input.game,
    formatKey,
    input.rulesMode ?? getDefaultRulesMode(input.game),
  );

  if (!name) {
    throw new Error("Deck name is required.");
  }

  const sections = new Set(getDeckSections(input.game, formatKey).map((section) => section.key));
  const entries = input.entries
    .map((entry, index) => coerceEntry(entry, index))
    .filter((entry): entry is DeckBuilderEntry => Boolean(entry))
    .map((entry) => ({
      ...entry,
      sectionKey: sections.has(entry.sectionKey) ? entry.sectionKey : "extras",
    }));

  if (entries.length === 0) {
    throw new Error("Deck needs at least one card before it can be saved.");
  }

  return {
    name,
    description: input.description?.trim() || null,
    visibility:
      input.visibility === "PRIVATE"
        ? ("PRIVATE" as DeckVisibilityValue)
        : ("PUBLIC" as DeckVisibilityValue),
    formatKey,
    rulesMode,
    entries,
  };
}

async function buildUniqueSlug(game: GameSlug, name: string, deckId?: number) {
  const base = slugifyDeckName(name);
  let slug = base;
  let attempt = 1;

  while (true) {
    const existing = await prisma.deck.findFirst({
      where: {
        slug,
        ...(deckId ? { NOT: { id: deckId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

function toDeckDetail(
  game: GameSlug,
  deck: {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    formatKey: string;
    rulesMode: PrismaDeckRulesMode;
    visibility: PrismaDeckVisibility;
    author: string | null;
    clerkUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
    cards: Array<{
      familyKey: string;
      displayCardId: string | null;
      cardName: string;
      imageUrl: string | null;
      typeLine: string | null;
      text: string | null;
      domainValues: string[];
      cost: number | null;
      power: number | null;
      might: number | null;
      hp: number | null;
      setCode: string | null;
      setName: string | null;
      rarity: string | null;
      versionLabel: string | null;
      sectionKey: string;
      quantity: number;
      sortOrder: number;
    }>;
  },
  viewerUserId: string | null,
): DeckDetail {
  const rulesMode = fromRulesMode(deck.rulesMode);
  const visibility = fromVisibility(deck.visibility);
  const entries: DeckBuilderEntry[] = deck.cards
    .sort((left, right) =>
      left.sectionKey === right.sectionKey
        ? left.sortOrder - right.sortOrder
        : left.sectionKey.localeCompare(right.sectionKey),
    )
    .map((card) => ({
      familyKey: card.familyKey,
      displayCardId: card.displayCardId,
      cardName: card.cardName,
      imageUrl: card.imageUrl,
      typeLine: card.typeLine,
      text: card.text,
      domainValues: card.domainValues,
      cost: card.cost,
      power: card.power,
      might: card.might,
      hp: card.hp,
      setCode: card.setCode,
      setName: card.setName,
      rarity: card.rarity,
      versionLabel: card.versionLabel,
      sectionKey: card.sectionKey,
      quantity: card.quantity,
      sortOrder: card.sortOrder,
    }));
  const stats = computeDeckStats(game, deck.formatKey, rulesMode, entries);
  const sections = getDeckSections(game, deck.formatKey);
  const totalCards = stats.totalCards;
  const sectionCounts = new Map<string, number>();

  for (const entry of entries) {
    sectionCounts.set(
      entry.sectionKey,
      (sectionCounts.get(entry.sectionKey) ?? 0) + entry.quantity,
    );
  }

  return {
    id: deck.id,
    game,
    slug: deck.slug,
    name: deck.name,
    description: deck.description,
    formatKey: deck.formatKey,
    rulesMode,
    visibility,
    authorLabel: deck.author || (deck.clerkUserId ? "Archive Brewer" : "Community Import"),
    owner: Boolean(viewerUserId && deck.clerkUserId === viewerUserId),
    canEdit: Boolean(viewerUserId && deck.clerkUserId === viewerUserId),
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString(),
    coverImageUrl: entries.find((entry) => Boolean(entry.imageUrl))?.imageUrl ?? null,
    totalCards,
    uniqueCards: stats.uniqueCards,
    sectionPreview: sections
      .map((section) => ({
        key: section.key,
        label: section.label,
        count: sectionCounts.get(section.key) ?? 0,
      }))
      .filter((section) => section.count > 0),
    entries,
    stats,
  };
}

export async function getOptionalDeckUserId() {
  if (!isClerkConfigured()) {
    return null;
  }

  const { userId } = await auth();
  return userId ?? null;
}

export async function listDecks(input: {
  game: GameSlug;
  scope: DeckListScope;
  viewerUserId: string | null;
  q?: string;
  formatKey?: string | null;
}) {
  try {
    if (input.scope === "mine" && !input.viewerUserId) {
      return [] satisfies DeckSummary[];
    }

    const decks = await prisma.deck.findMany({
      where: {
        game: GAME_TO_PRISMA[input.game],
        ...(input.scope === "community"
          ? { visibility: PrismaDeckVisibility.PUBLIC }
          : { clerkUserId: input.viewerUserId ?? "__nobody__" }),
        ...(input.q?.trim()
          ? {
              OR: [
                { name: { contains: input.q.trim() } },
                { description: { contains: input.q.trim() } },
              ],
            }
          : {}),
        ...(input.formatKey?.trim() ? { formatKey: input.formatKey.trim() } : {}),
      },
      include: {
        cards: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return decks.map((deck) => {
      const detail = toDeckDetail(input.game, deck, input.viewerUserId);
      return {
        id: detail.id,
        game: detail.game,
        slug: detail.slug,
        name: detail.name,
        description: detail.description,
        formatKey: detail.formatKey,
        rulesMode: detail.rulesMode,
        visibility: detail.visibility,
        authorLabel: detail.authorLabel,
        owner: detail.owner,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
        coverImageUrl: detail.coverImageUrl,
        totalCards: detail.totalCards,
        uniqueCards: detail.uniqueCards,
        sectionPreview: detail.sectionPreview,
      } satisfies DeckSummary;
    });
  } catch (error) {
    if (isMissingDeckTableError(error)) {
      return [] satisfies DeckSummary[];
    }

    throw error;
  }
}

export async function getDeckById(input: {
  game: GameSlug;
  deckId: number;
  viewerUserId: string | null;
}) {
  try {
    const deck = await prisma.deck.findFirst({
      where: {
        id: input.deckId,
        game: GAME_TO_PRISMA[input.game],
      },
      include: {
        cards: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!deck) {
      return null;
    }

    const isOwner = Boolean(
      input.viewerUserId && deck.clerkUserId === input.viewerUserId,
    );

    if (deck.visibility === PrismaDeckVisibility.PRIVATE && !isOwner) {
      return null;
    }

    return toDeckDetail(input.game, deck, input.viewerUserId);
  } catch (error) {
    if (isMissingDeckTableError(error)) {
      return null;
    }

    throw error;
  }
}

export async function createDeck(
  viewerUserId: string,
  input: DeckWriteInput,
) {
  const normalized = normalizeWriteInput(input);
  const slug = await buildUniqueSlug(input.game, normalized.name);

  const created = await prisma.deck.create({
    data: {
      game: GAME_TO_PRISMA[input.game],
      clerkUserId: viewerUserId,
      visibility: toVisibility(normalized.visibility),
      formatKey: normalized.formatKey,
      rulesMode: toRulesMode(normalized.rulesMode),
      slug,
      name: normalized.name,
      description: normalized.description,
      tags: [],
      cards: {
        create: normalized.entries.map((entry, index) => ({
          cardName: entry.cardName,
          familyKey: entry.familyKey,
          displayCardId: entry.displayCardId ?? null,
          imageUrl: entry.imageUrl ?? null,
          typeLine: entry.typeLine ?? null,
          text: entry.text ?? null,
          domainValues: entry.domainValues,
          cost: entry.cost ?? null,
          power: entry.power ?? null,
          might: entry.might ?? null,
          hp: entry.hp ?? null,
          setCode: entry.setCode ?? null,
          setName: entry.setName ?? null,
          rarity: entry.rarity ?? null,
          versionLabel: entry.versionLabel ?? null,
          sectionKey: entry.sectionKey,
          quantity: entry.quantity,
          sortOrder: index,
        })),
      },
    },
    include: {
      cards: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  return toDeckDetail(input.game, created, viewerUserId);
}

export async function updateDeck(
  viewerUserId: string,
  deckId: number,
  input: DeckWriteInput,
) {
  const existing = await prisma.deck.findFirst({
    where: {
      id: deckId,
      game: GAME_TO_PRISMA[input.game],
    },
    select: {
      id: true,
      clerkUserId: true,
    },
  });

  if (!existing) {
    throw new Error("Deck not found.");
  }

  if (existing.clerkUserId !== viewerUserId) {
    throw new Error("You do not have access to update this deck.");
  }

  const normalized = normalizeWriteInput(input);
  const slug = await buildUniqueSlug(input.game, normalized.name, deckId);

  const updated = await prisma.deck.update({
    where: {
      id: deckId,
    },
    data: {
      visibility: toVisibility(normalized.visibility),
      formatKey: normalized.formatKey,
      rulesMode: toRulesMode(normalized.rulesMode),
      slug,
      name: normalized.name,
      description: normalized.description,
      cards: {
        deleteMany: {},
        create: normalized.entries.map((entry, index) => ({
          cardName: entry.cardName,
          familyKey: entry.familyKey,
          displayCardId: entry.displayCardId ?? null,
          imageUrl: entry.imageUrl ?? null,
          typeLine: entry.typeLine ?? null,
          text: entry.text ?? null,
          domainValues: entry.domainValues,
          cost: entry.cost ?? null,
          power: entry.power ?? null,
          might: entry.might ?? null,
          hp: entry.hp ?? null,
          setCode: entry.setCode ?? null,
          setName: entry.setName ?? null,
          rarity: entry.rarity ?? null,
          versionLabel: entry.versionLabel ?? null,
          sectionKey: entry.sectionKey,
          quantity: entry.quantity,
          sortOrder: index,
        })),
      },
    },
    include: {
      cards: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  return toDeckDetail(input.game, updated, viewerUserId);
}

export async function deleteDeck(
  viewerUserId: string,
  game: GameSlug,
  deckId: number,
) {
  const existing = await prisma.deck.findFirst({
    where: {
      id: deckId,
      game: GAME_TO_PRISMA[game],
    },
    select: {
      id: true,
      clerkUserId: true,
    },
  });

  if (!existing) {
    throw new Error("Deck not found.");
  }

  if (existing.clerkUserId !== viewerUserId) {
    throw new Error("You do not have access to delete this deck.");
  }

  await prisma.deck.delete({
    where: {
      id: deckId,
    },
  });
}

export function parseDeckId(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
