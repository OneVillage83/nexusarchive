import type { Prisma } from "@prisma/client";
import { Game } from "@prisma/client";

import prisma from "@/lib/db";
import {
  decorateCardsWithFinance,
  deriveFinanceTeaser,
} from "@/lib/finance/query";
import type { GameSlug } from "@/lib/games";
import { isGameSlug } from "@/lib/games";
import { getRedis } from "@/lib/storage/redis";
import {
  getCardBaseName,
  getCardVersionLabel,
  isLikelyBaseVersion,
  normalizeCardIdentityName,
} from "./identity";

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
  sort: CardSortKey;
  versionMode: CardVersionMode;
};

export type CardQueryFilters = {
  domains: string[];
  rarities: string[];
  sets: string[];
};

export const CARD_SORT_KEYS = [
  "name-asc",
  "name-desc",
  "cost-asc",
  "cost-desc",
  "power-desc",
  "might-desc",
  "set-asc",
] as const;

export const CARD_VERSION_MODES = ["premium", "base"] as const;

export type CardSortKey = (typeof CARD_SORT_KEYS)[number];
export type CardVersionMode = (typeof CARD_VERSION_MODES)[number];

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
const ALL_CARD_CACHE_TTL_MS = 1000 * 60 * 5;

const allCardsCache = new Map<
  GameSlug,
  { cards: CardCatalogSummary[]; expiresAt: number }
>();

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

export function parseCardSort(value: string | null): CardSortKey {
  return CARD_SORT_KEYS.includes((value ?? "") as CardSortKey)
    ? ((value ?? "name-asc") as CardSortKey)
    : "name-asc";
}

export function parseCardVersionMode(value: string | null): CardVersionMode {
  return CARD_VERSION_MODES.includes((value ?? "") as CardVersionMode)
    ? ((value ?? "premium") as CardVersionMode)
    : "premium";
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

async function getRedisSummariesInBatches(game: GameSlug, ids: string[]) {
  const cards: CardCatalogSummary[] = [];

  for (let index = 0; index < ids.length; index += 500) {
    const batch = ids.slice(index, index + 500);
    cards.push(...(await getRedisSummaries(game, batch)));
  }

  return cards;
}

async function getAllRedisIds(game: GameSlug) {
  const redis = getRedis();
  if (!redis) {
    return [];
  }

  return (
    ((await redis.lrange(cardCatalogAllIdsKey(game), 0, -1)) as string[] | null) ??
    []
  );
}

async function getAllRedisCards(game: GameSlug) {
  const cached = allCardsCache.get(game);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.cards;
  }

  const ids = await getAllRedisIds(game);
  const cards = await getRedisSummariesInBatches(game, ids);
  allCardsCache.set(game, {
    cards,
    expiresAt: Date.now() + ALL_CARD_CACHE_TTL_MS,
  });
  return cards;
}

function compareRepresentativePriority(
  left: CardCatalogSummary,
  right: CardCatalogSummary,
  versionMode: CardVersionMode,
) {
  const leftTeaser = deriveFinanceTeaser(left);
  const rightTeaser = deriveFinanceTeaser(right);
  const leftBase = isLikelyBaseVersion(left);
  const rightBase = isLikelyBaseVersion(right);
  const leftValue = leftTeaser.fairValue ?? leftTeaser.marketPrice ?? 0;
  const rightValue = rightTeaser.fairValue ?? rightTeaser.marketPrice ?? 0;

  if (versionMode === "base" && leftBase !== rightBase) {
    return leftBase ? -1 : 1;
  }

  if (versionMode === "premium" && leftBase !== rightBase) {
    return leftBase ? 1 : -1;
  }

  if (versionMode === "base") {
    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  } else if (leftValue !== rightValue) {
    return rightValue - leftValue;
  }

  const leftSet = (left.setName ?? left.setCode ?? "").trim();
  const rightSet = (right.setName ?? right.setCode ?? "").trim();
  const setComparison = leftSet.localeCompare(rightSet, undefined, {
    sensitivity: "base",
  });

  if (setComparison !== 0) {
    return versionMode === "base" ? setComparison : -setComparison;
  }

  return (left.collectorNo ?? "").localeCompare(right.collectorNo ?? "", undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function groupCardsForGallery(
  cards: CardCatalogSummary[],
  versionMode: CardVersionMode,
) {
  const groups = new Map<string, CardCatalogSummary[]>();

  for (const card of cards) {
    const identityKey = normalizeCardIdentityName(card.name);
    if (!identityKey) {
      continue;
    }

    const existing = groups.get(identityKey);
    if (existing) {
      existing.push(card);
    } else {
      groups.set(identityKey, [card]);
    }
  }

  return [...groups.entries()].map(([identityKey, variants]) => {
    const representative =
      [...variants].sort((left, right) =>
        compareRepresentativePriority(left, right, versionMode),
      )[0] ?? variants[0];
    const baseName = getCardBaseName(representative?.name ?? identityKey);
    const artCount = new Set(
      variants.map((variant) => variant.imageUrl).filter(Boolean),
    ).size;
    const representativeName =
      representative && representative.name !== baseName ? representative.name : null;

    return {
      ...(representative ?? variants[0]!),
      name: baseName,
      baseName,
      representativeName,
      versionLabel: representative ? getCardVersionLabel(representative) : null,
      versionCount: variants.length,
      artCount: Math.max(artCount, variants.length > 0 ? 1 : 0),
      isBaseVersion: representative ? isLikelyBaseVersion(representative) : true,
    } satisfies CardCatalogSummary;
  });
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

function compareText(
  left: string | null | undefined,
  right: string | null | undefined,
  direction: "asc" | "desc" = "asc",
) {
  const leftValue = (left ?? "").trim();
  const rightValue = (right ?? "").trim();

  if (!leftValue && !rightValue) {
    return 0;
  }

  if (!leftValue) {
    return 1;
  }

  if (!rightValue) {
    return -1;
  }

  const result = leftValue.localeCompare(rightValue, undefined, {
    sensitivity: "base",
  });

  return direction === "asc" ? result : -result;
}

function compareNullableNumber(
  left: number | null,
  right: number | null,
  direction: "asc" | "desc",
) {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  return direction === "asc" ? left - right : right - left;
}

function getSetLabel(card: CardCatalogSummary) {
  return card.setName ?? card.setCode ?? "";
}

function sortCards(cards: CardCatalogSummary[], sort: CardSortKey) {
  return [...cards].sort((left, right) => {
    switch (sort) {
      case "name-desc":
        return (
          compareText(left.name, right.name, "desc") ||
          compareText(left.setCode, right.setCode)
        );
      case "cost-asc":
        return (
          compareNullableNumber(left.energyCost, right.energyCost, "asc") ||
          compareText(left.name, right.name)
        );
      case "cost-desc":
        return (
          compareNullableNumber(left.energyCost, right.energyCost, "desc") ||
          compareText(left.name, right.name)
        );
      case "power-desc":
        return (
          compareNullableNumber(left.power, right.power, "desc") ||
          compareText(left.name, right.name)
        );
      case "might-desc":
        return (
          compareNullableNumber(left.might, right.might, "desc") ||
          compareText(left.name, right.name)
        );
      case "set-asc":
        return (
          compareText(getSetLabel(left), getSetLabel(right), "asc") ||
          compareText(left.name, right.name)
        );
      case "name-asc":
      default:
        return (
          compareText(left.name, right.name, "asc") ||
          compareText(left.setCode, right.setCode)
        );
    }
  });
}

async function queryRedisCards({
  game,
  q,
  page,
  pageSize,
  filters,
  sort,
  versionMode,
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

  const candidateCards =
    !normalizedQuery && !hasFilters
      ? await getAllRedisCards(game)
      : await (async () => {
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

          const candidateIds =
            candidateGroups.length > 0
              ? intersectIds(candidateGroups)
              : await getAllRedisIds(game);

          return getRedisSummariesInBatches(game, candidateIds);
        })();
  const normalizedFilters = normalizeFilters(filters);

  const filteredCards = candidateCards.filter(
    (card) =>
      matchesQuery(card, normalizedQuery, queryTokens) &&
      matchesFilters(card, normalizedFilters),
  );
  const groupedCards = groupCardsForGallery(filteredCards, versionMode);
  const sortedCards = sortCards(groupedCards, sort);

  const total = sortedCards.length;

  return {
    cards: decorateCardsWithFinance(sortedCards.slice(start, start + pageSize)),
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
  sort,
  versionMode,
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

  const cards = await prisma.card.findMany({ where });
  const total = cards.length;
  const groupedCards = groupCardsForGallery(
    cards.map((card) => ({
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
    versionMode,
  );
  const sortedCards = sortCards(groupedCards, sort);
  const pagedCards = sortedCards.slice(
    (page - 1) * pageSize,
    (page - 1) * pageSize + pageSize,
  );

  return {
    cards: decorateCardsWithFinance(pagedCards),
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
