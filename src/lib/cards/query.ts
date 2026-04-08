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

async function queryRedisCards({
  game,
  q,
  page,
  pageSize,
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
  const start = (page - 1) * pageSize;

  if (!normalizedQuery) {
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

  const tokens = tokenizeForIndex([normalizedQuery]);
  if (tokens.length === 0) {
    return {
      cards: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      meta,
    };
  }

  const groups = await Promise.all(
    tokens.map(
      async (token) =>
        (((await redis.smembers(
          cardCatalogTokenKey(game, token),
        )) as string[] | null) ?? []),
    ),
  );
  const candidateIds = intersectIds(groups);
  const candidateCards = await getRedisSummaries(game, candidateIds);

  const filteredCards = candidateCards
    .filter((card) => {
      if (!card.searchText) {
        return false;
      }

      return (
        card.searchText.includes(normalizedQuery) ||
        tokens.every((token) => card.searchText.includes(token))
      );
    })
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
}: QueryCardsInput): Promise<CardCatalogQueryResult> {
  const where: Prisma.CardWhereInput = q
    ? {
        game: GAME_TO_PRISMA[game],
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
      }
    : { game: GAME_TO_PRISMA[game] };

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
