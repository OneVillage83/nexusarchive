import { Game as PrismaGame } from "@prisma/client";

import prisma from "@/lib/db";
import type { GameSlug } from "@/lib/games";
import { getRedis } from "@/lib/storage/redis";
import {
  buildCardSearchText,
  cardCatalogAllIdsKey,
  cardCatalogSummaryKey,
  normalizeSearchText,
  type CardCatalogSource,
  type CardCatalogSummary,
} from "@/lib/cards/catalog";
import {
  getCardIdentityCandidates,
  isLikelyBaseVersion,
  normalizeCardIdentityName,
} from "@/lib/cards/identity";

type CatalogLookup = {
  cards: CardCatalogSummary[];
  byFamilyKey: Map<string, CardCatalogSummary>;
  byName: Map<string, CardCatalogSummary>;
};

const GAME_TO_PRISMA: Record<GameSlug, PrismaGame> = {
  riftbound: PrismaGame.RIFTBOUND,
  "one-piece": PrismaGame.ONE_PIECE,
  "magic-the-gathering": PrismaGame.MAGIC_THE_GATHERING,
};

const PRISMA_FALLBACK_SOURCE: Record<GameSlug, CardCatalogSource> = {
  riftbound: "riftcodex-cards",
  "one-piece": "optcgapi-all-set-cards",
  "magic-the-gathering": "scryfall-default-cards",
};

const LOOKUP_CACHE_TTL_MS = 1000 * 60 * 5;
const lookupCache = new Map<
  GameSlug,
  { lookup: CatalogLookup; expiresAt: number }
>();

function isMissingCardTableError(error: unknown) {
  return (
    error instanceof Error &&
    /P2021|P2022|does not exist|Unknown field|Unknown arg/i.test(error.message)
  );
}

function pickPreferredCard(
  current: CardCatalogSummary | undefined,
  candidate: CardCatalogSummary,
) {
  if (!current) {
    return candidate;
  }

  const currentBase = isLikelyBaseVersion(current);
  const candidateBase = isLikelyBaseVersion(candidate);

  if (currentBase !== candidateBase) {
    return candidateBase ? candidate : current;
  }

  if (Boolean(candidate.imageUrl) !== Boolean(current.imageUrl)) {
    return candidate.imageUrl ? candidate : current;
  }

  const currentSet = current.setName ?? current.setCode ?? "";
  const candidateSet = candidate.setName ?? candidate.setCode ?? "";
  return candidateSet.localeCompare(currentSet, undefined, {
    sensitivity: "base",
  }) < 0
    ? candidate
    : current;
}

function buildFamilyKey(card: CardCatalogSummary) {
  return (
    card.familyKey ??
    getCardIdentityCandidates(card).sort()[0] ??
    normalizeCardIdentityName(card.name)
  );
}

function mapPrismaCardToSummary(
  game: GameSlug,
  card: {
    id: number;
    name: string;
    type: string;
    domains: string[];
    rarity: string;
    energyCost: number | null;
    power: number | null;
    might: number | null;
    hp: number | null;
    text: string | null;
    flavor: string | null;
    setCode: string | null;
    setName: string | null;
    collectorNo: string | null;
    imageUrl: string | null;
  },
) {
  const summary = {
    id: String(card.id),
    game,
    name: card.name,
    type: card.type,
    domains: card.domains,
    tags: [],
    energyCost: card.energyCost,
    power: card.power,
    might: card.might,
    hp: card.hp,
    rarity: card.rarity,
    text: card.text,
    flavor: card.flavor,
    setCode: card.setCode,
    setName: card.setName,
    collectorNo: card.collectorNo,
    imageUrl: card.imageUrl,
    artist: null,
    marketPrice: null,
    source: PRISMA_FALLBACK_SOURCE[game],
    externalUrl: null,
  } satisfies Omit<CardCatalogSummary, "searchText">;

  return {
    ...summary,
    searchText: buildCardSearchText(summary),
  } satisfies CardCatalogSummary;
}

async function getRedisCards(game: GameSlug) {
  const redis = getRedis();
  if (!redis) {
    return [] satisfies CardCatalogSummary[];
  }

  const ids =
    ((await redis.lrange(cardCatalogAllIdsKey(game), 0, -1)) as string[] | null) ??
    [];

  if (ids.length === 0) {
    return [] satisfies CardCatalogSummary[];
  }

  const cards: CardCatalogSummary[] = [];
  for (let index = 0; index < ids.length; index += 500) {
    const batch = ids.slice(index, index + 500);
    const pipeline = redis.pipeline();
    for (const id of batch) {
      pipeline.get(cardCatalogSummaryKey(game, id));
    }
    const values = await pipeline.exec();
    cards.push(
      ...values.filter(Boolean).map((value) => value as CardCatalogSummary),
    );
  }

  return cards;
}

async function getPrismaCards(game: GameSlug) {
  try {
    const cards = await prisma.card.findMany({
      where: { game: GAME_TO_PRISMA[game] },
    });
    return cards.map((card) => mapPrismaCardToSummary(game, card));
  } catch (error) {
    if (isMissingCardTableError(error)) {
      return [] satisfies CardCatalogSummary[];
    }
    throw error;
  }
}

function buildLookup(cards: CardCatalogSummary[]) {
  const byFamilyKey = new Map<string, CardCatalogSummary>();
  const byName = new Map<string, CardCatalogSummary>();

  for (const card of cards) {
    const familyKey = buildFamilyKey(card);
    const preferredForFamily = pickPreferredCard(
      byFamilyKey.get(familyKey),
      card,
    );
    byFamilyKey.set(familyKey, preferredForFamily);

    const normalizedName = normalizeCardIdentityName(card.name);
    const preferredByName = pickPreferredCard(byName.get(normalizedName), card);
    byName.set(normalizedName, preferredByName);
  }

  return {
    cards,
    byFamilyKey,
    byName,
  } satisfies CatalogLookup;
}

export async function getComboCatalogLookup(game: GameSlug) {
  const cached = lookupCache.get(game);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.lookup;
  }

  const redisCards = await getRedisCards(game);
  const lookup = buildLookup(redisCards.length > 0 ? redisCards : await getPrismaCards(game));
  lookupCache.set(game, {
    lookup,
    expiresAt: Date.now() + LOOKUP_CACHE_TTL_MS,
  });
  return lookup;
}

export function resolveCatalogCard(
  lookup: CatalogLookup,
  candidate: { familyKey?: string | null; cardName?: string | null },
) {
  if (candidate.familyKey) {
    const byFamilyKey = lookup.byFamilyKey.get(candidate.familyKey);
    if (byFamilyKey) {
      return byFamilyKey;
    }
  }

  if (candidate.cardName) {
    return lookup.byName.get(normalizeCardIdentityName(candidate.cardName)) ?? null;
  }

  return null;
}

export function toComboPieceCardData(
  card: CardCatalogSummary | null,
  fallback: { familyKey?: string | null; cardName: string; quantity: number },
) {
  return {
    familyKey:
      fallback.familyKey ??
      (card ? buildFamilyKey(card) : normalizeCardIdentityName(fallback.cardName)),
    cardName: card?.name ?? fallback.cardName,
    quantity: fallback.quantity,
    cardId: card?.id ?? null,
    imageUrl: card?.imageUrl ?? null,
    typeLine: card?.type ?? null,
    text: card?.text ?? null,
    domains: card?.domains ?? [],
    energyCost: card?.energyCost ?? null,
    power: card?.power ?? null,
    might: card?.might ?? null,
    hp: card?.hp ?? null,
  };
}

export async function tryResolveCardFamily(
  game: GameSlug,
  cardName: string,
) {
  const lookup = await getComboCatalogLookup(game);
  const card = resolveCatalogCard(lookup, { cardName });
  return {
    familyKey: card ? buildFamilyKey(card) : normalizeCardIdentityName(cardName),
    cardName: card?.name ?? cardName,
  };
}

export function buildNormalizedComboSearchText(values: Array<string | null | undefined>) {
  return normalizeSearchText(values.filter(Boolean).join(" "));
}
