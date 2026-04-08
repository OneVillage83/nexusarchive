import type { Prisma } from "@prisma/client";
import { Game } from "@prisma/client";

import prisma from "@/lib/db";
import type { GameSlug } from "@/lib/games";
import { isGameSlug } from "@/lib/games";
import { getRedis } from "@/lib/storage/redis";

import {
  type CardCatalogSource,
  type CardCatalogMeta,
  type CardCatalogQueryResult,
  type CardCatalogSummary,
  cardCatalogAllIdsKey,
  cardCatalogMetaKey,
  cardCatalogSummaryKey,
  cardCatalogTokenKey,
  normalizeSearchText,
  tokenizeForIndex,
} from "./catalog";

type QueryCardsInput = {
  game: GameSlug;
  q: string;
  page: number;
  pageSize: number;
  filters: CardQueryFilters;
};

export type CardQueryFilters = {
  domains: string[];
  rarities: string[];
  sets: string[];
};

type NormalizedCardQueryFilters = {
  domains: Set<string>;
  rarities: Set<string>;
  sets: Set<string>;
};

const GAME_TO_PRISMA: Record<GameSlug, Game> = {
  riftbound: Game.RIFTBOUND,
  "one-piece": Game.ONE_PIECE,
  "magic-the-gathering": Game.MAGIC_THE_GATHERING,
};

const PRISMA_FALLBACK_SOURCE: Record<GameSlug, CardCatalogSource> = {
  riftbound: "riftcodex-cards",
  "one-piece": "optcgapi-all-set-cards",
  "magic-the-gathering": "scryfall-default-cards",
};

export const DEFAULT_CARD_PAGE_SIZE = 50;
export const MAX_CARD_PAGE_SIZE = 100;

export function parseCardPage(value: string | null) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parseCardPageSize(value: string | null) {
  const parsed = Number.parseInt(
    value ?? String(DEFAULT_CARD_PAGE_SIZE),
    10,
  );

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_CARD_PAGE_SIZE;
  }

  return Math.min(parsed, MAX_CARD_PAGE_SIZE);
}

export function parseCardFilterParam(value: string | null) {
  if (!value) {
    return [];
  }

  return [...new Set(
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  )];
}

async function getRedisSummaries(game: GameSlug, ids: string[]) {
  const redis = getRedis();
  if (!redis || ids.length === 0) {
    return [];
  }

  const pipeline = redis.pipeline();

  for (const id of ids) {
    pipeline.get(cardCatalogSummaryKey(game, id));
  }

  const results = await pipeline.exec();
  return results.filter(Boolean) as CardCatalogSummary[];
}

function intersectIds(groups: string[][]) {
  if (groups.length === 0 || groups.some((group) => group.length === 0)) {
    return [];
  }

  const [head, ...rest] = groups.sort(
    (left, right) => left.length - right.length,
  );

  if (!head) {
    return [];
  }

  const others = rest.map((group) => new Set(group));

  return head.filter((id) => others.every((group) => group.has(id)));
}

function unionIds(groups: string[][]) {
  return [...new Set(groups.flat())];
}

function normalizeSelectedValues(values: string[]) {
  return new Set(
    values
      .map((value) => normalizeSearchText(value))
      .filter(Boolean),
  );
}

function normalizeFilters(filters: CardQueryFilters): NormalizedCardQueryFilters {
  return {
    domains: normalizeSelectedValues(filters.domains),
    rarities: normalizeSelectedValues(filters.rarities),
    sets: normalizeSelectedValues(filters.sets),
  };
}

async function getIdsForTokens(
  game: GameSlug,
  tokens: string[],
) {
  const redis = getRedis();
  if (!redis || tokens.length === 0) {
    return [];
  }

  const groups = await Promise.all(
    tokens.map(
      async (token) =>
        (((await redis.smembers(
          cardCatalogTokenKey(game, token),
        )) as string[] | null) ?? []),
    ),
  );

  return intersectIds(groups);
}

async function getIdsForFilterValues(
  game: GameSlug,
  values: string[],
) {
  if (values.length === 0) {
    return [];
  }

  const perValueIds = await Promise.all(
    values.map(async (value) => {
      const tokens = tokenizeForIndex([value]);
      if (tokens.length === 0) {
        return [];
      }

      return getIdsForTokens(game, tokens);
    }),
  );

  return unionIds(perValueIds);
}

function matchesQuery(
  card: CardCatalogSummary,
  normalizedQuery: string,
  queryTokens: string[],
) {
  if (!normalizedQuery) {
    return true;
  }

  if (!card.searchText) {
    return false;
  }

  return (
    card.searchText.includes(normalizedQuery) ||
    queryTokens.every((token) => card.searchText.includes(token))
  );
}

function matchesFilters(
  card: CardCatalogSummary,
  filters: NormalizedCardQueryFilters,
) {
  if (
    filters.domains.size > 0 &&
    !card.domains.some((domain) =>
      filters.domains.has(normalizeSearchText(domain)),
    )
  ) {
    return false;
  }

  if (
    filters.rarities.size > 0 &&
    !filters.rarities.has(normalizeSearchText(card.rarity ?? ""))
  ) {
    return false;
  }

  if (filters.sets.size > 0) {
    const normalizedSetValues = [card.setName, card.setCode]
      .filter((value): value is string => Boolean(value))
      .map((value) => normalizeSearchText(value));

    if (!normalizedSetValues.some((value) => filters.sets.has(value))) {
      return false;
    }
  }

  return true;
}

async function queryRedisCards({
  game,
  q,
  page,
  pageSize,
  filters,
}: QueryCardsInput): Promise<CardCatalogQueryResult | null> {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  const meta = await redis.get<CardCatalogMeta>(cardCatalogMetaKey(game));
  if (!meta) {
    return null;
  }

  const normalizedQuery = normalizeSearchText(q);
  const queryTokens = normalizedQuery
    ? tokenizeForIndex([normalizedQuery])
    : [];
  const start = (page - 1) * pageSize;
  const hasFilters =
    filters.domains.length > 0 ||
    filters.rarities.length > 0 ||
    filters.sets.length > 0;

  if (!normalizedQuery && !hasFilters) {
    const ids =
      ((await redis.lrange(
        cardCatalogAllIdsKey(game),
        start,
        start + pageSize - 1,
      )) as string[] | null) ?? [];
    const cards = await getRedisSummaries(game, ids);
    const total = meta.cardCount;

    return {
      cards,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      meta,
    };
  }

  if (normalizedQuery && queryTokens.length === 0) {
    return {
      cards: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      meta,
    };
  }

  const candidateGroups: string[][] = [];

  if (queryTokens.length > 0) {
    candidateGroups.push(await getIdsForTokens(game, queryTokens));
  }

  if (filters.domains.length > 0) {
    candidateGroups.push(await getIdsForFilterValues(game, filters.domains));
  }

  if (filters.rarities.length > 0) {
    candidateGroups.push(await getIdsForFilterValues(game, filters.rarities));
  }

  if (filters.sets.length > 0) {
    candidateGroups.push(await getIdsForFilterValues(game, filters.sets));
  }

  const candidateIds = intersectIds(candidateGroups);
  const candidateCards = await getRedisSummaries(game, candidateIds);
  const normalizedFilters = normalizeFilters(filters);

  const filteredCards = candidateCards
    .filter(
      (card) =>
        matchesQuery(card, normalizedQuery, queryTokens) &&
        matchesFilters(card, normalizedFilters),
    )
    .sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
    );

  const total = filteredCards.length;

  return {
    cards: filteredCards.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    meta,
  };
}

async function queryPrismaCards({
  game,
  q,
  page,
  pageSize,
  filters,
}: QueryCardsInput): Promise<CardCatalogQueryResult> {
  const whereClauses: Prisma.CardWhereInput[] = [
    { game: GAME_TO_PRISMA[game] },
  ];

  if (q) {
    whereClauses.push({
      OR: [
        { name: { contains: q } },
        { type: { contains: q } },
        { rarity: { contains: q } },
        { text: { contains: q } },
        { flavor: { contains: q } },
        { setCode: { contains: q } },
        { setName: { contains: q } },
        { collectorNo: { contains: q } },
        { domains: { has: q } },
      ],
    });
  }

  if (filters.domains.length > 0) {
    whereClauses.push({
      domains: { hasSome: filters.domains },
    });
  }

  if (filters.rarities.length > 0) {
    whereClauses.push({
      rarity: { in: filters.rarities },
    });
  }

  if (filters.sets.length > 0) {
    whereClauses.push({
      OR: filters.sets.flatMap((value) => [
        { setName: { equals: value } },
        { setCode: { equals: value } },
      ]),
    });
  }

  const where: Prisma.CardWhereInput =
    whereClauses.length === 1 ? whereClauses[0]! : { AND: whereClauses };

  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.card.count({ where }),
  ]);

  return {
    cards: cards.map((card) => ({
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
      searchText: normalizeSearchText(
        [
          String(card.id),
          card.name,
          card.type,
          card.domains.join(" "),
          card.rarity,
          card.text,
          card.flavor,
          card.setCode,
          card.setName,
          card.collectorNo,
          card.energyCost != null ? String(card.energyCost) : null,
          card.power != null ? String(card.power) : null,
          card.might != null ? String(card.might) : null,
          card.hp != null ? String(card.hp) : null,
        ]
          .filter(Boolean)
          .join(" "),
      ),
    })),
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    meta: {
      game,
      source: PRISMA_FALLBACK_SOURCE[game],
      sourceLabel: "Prisma fallback",
      sourceUrl: "",
      cardCount: total,
      importedAt: new Date(0).toISOString(),
      upstreamUpdatedAt: null,
      notes: ["Using the legacy Prisma fallback because Redis is empty."],
    },
  };
}

export async function queryCards(input: QueryCardsInput) {
  return (await queryRedisCards(input)) ?? queryPrismaCards(input);
}

export function getGameFromQuery(value: string | null) {
  if (!value || !isGameSlug(value)) {
    return "riftbound" as GameSlug;
  }

  return value;
}
