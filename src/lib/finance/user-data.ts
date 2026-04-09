import { Game as PrismaGame } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

import { isClerkConfigured } from "@/lib/auth-config";
import prisma from "@/lib/db";
import type { GameSlug } from "@/lib/games";

import {
  formatFinanceCurrency,
  getFinanceProductDetail,
  type FinanceProductDetail,
} from "./query";

const GAME_TO_PRISMA: Record<GameSlug, PrismaGame> = {
  riftbound: PrismaGame.RIFTBOUND,
  "one-piece": PrismaGame.ONE_PIECE,
  "magic-the-gathering": PrismaGame.MAGIC_THE_GATHERING,
};

export type FinanceWatchlistSummary = {
  id: string;
  name: string;
  itemCount: number;
  updatedAt: string;
  items: Array<{
    id: string;
    financeProductId: string;
    name: string;
    note: string | null;
    fairValueLabel: string;
  }>;
};

export type FinancePortfolioSummary = {
  positions: Array<{
    id: string;
    financeProductId: string;
    name: string;
    quantity: number;
    averageCost: number | null;
    averageCostLabel: string;
    fairValueLabel: string;
    totalValueLabel: string;
    unrealizedLabel: string;
  }>;
  totalValueLabel: string;
};

export type FinanceAlertPreferenceSummary = {
  emailEnabled: boolean;
  moversEnabled: boolean;
  reversalsEnabled: boolean;
  watchlistEnabled: boolean;
};

function buildFinanceKey(game: GameSlug, financeProductId: string) {
  return `${game}:${financeProductId}`;
}

function parseFinanceKey(game: GameSlug, financeKey: string, fallback: string | null) {
  const prefix = `${game}:`;
  if (financeKey.startsWith(prefix)) {
    return financeKey.slice(prefix.length);
  }

  return fallback ?? financeKey;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isMissingFinanceTableError(error: unknown) {
  return (
    error instanceof Error &&
    /P2021|P2022|does not exist|Unknown field|Unknown arg/i.test(error.message)
  );
}

export async function getOptionalFinanceUserId() {
  if (!isClerkConfigured()) {
    return null;
  }

  const { userId } = await auth();
  return userId ?? null;
}

export async function ensureFinanceProductRecord(
  game: GameSlug,
  financeProductId: string,
) {
  const financeKey = buildFinanceKey(game, financeProductId);
  const existing = await prisma.financeProduct.findUnique({
    where: {
      financeKey,
    },
  });

  if (existing) {
    return existing;
  }

  const detail = await getFinanceProductDetail(game, financeProductId);
  if (!detail) {
    throw new Error("Finance product not found.");
  }

  return prisma.financeProduct.create({
    data: {
      game: GAME_TO_PRISMA[game],
      financeKey,
      slug: slugify(detail.name),
      canonicalName: detail.name,
      cardCatalogId: financeProductId,
      setName: detail.setName,
      setCode: detail.setCode,
      collectorNo: detail.collectorNo,
      rarity: detail.rarity,
      imageUrl: detail.imageUrl,
      metadata: {
        subtitle: detail.subtitle,
        sourceLabel: detail.sourceLabel,
      },
    },
  });
}

export async function listFinanceWatchlists(
  game: GameSlug,
  clerkUserId: string,
): Promise<FinanceWatchlistSummary[]> {
  try {
    const watchlists = await prisma.financeWatchlist.findMany({
      where: {
        game: GAME_TO_PRISMA[game],
        clerkUserId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return Promise.all(
      watchlists.map(async (watchlist) => {
        const items = await Promise.all(
          watchlist.items.map(async (item) => {
            const financeProductId = parseFinanceKey(
              game,
              item.product.financeKey,
              item.product.cardCatalogId,
            );
            const detail = await getFinanceProductDetail(game, financeProductId);

            return {
              id: item.id,
              financeProductId,
              name: detail?.name ?? item.product.canonicalName,
              note: item.note,
              fairValueLabel: formatFinanceCurrency(detail?.fairValue ?? null),
            };
          }),
        );

        return {
          id: watchlist.id,
          name: watchlist.name,
          itemCount: watchlist.items.length,
          updatedAt: watchlist.updatedAt.toISOString(),
          items,
        };
      }),
    );
  } catch (error) {
    if (isMissingFinanceTableError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getFinanceWatchlistById(
  game: GameSlug,
  clerkUserId: string,
  watchlistId: string,
) {
  const watchlists = await listFinanceWatchlists(game, clerkUserId);
  return watchlists.find((watchlist) => watchlist.id === watchlistId) ?? null;
}

export async function listFinancePortfolio(
  game: GameSlug,
  clerkUserId: string,
): Promise<FinancePortfolioSummary> {
  try {
    const positions = await prisma.financePortfolioPosition.findMany({
      where: {
        game: GAME_TO_PRISMA[game],
        clerkUserId,
      },
      include: {
        product: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    let totalValue = 0;
    const hydratedPositions = await Promise.all(
      positions.map(async (position) => {
        const financeProductId = parseFinanceKey(
          game,
          position.product.financeKey,
          position.product.cardCatalogId,
        );
        const detail: FinanceProductDetail | null = await getFinanceProductDetail(
          game,
          financeProductId,
        );
        const fairValue = detail?.fairValue ?? detail?.marketPrice ?? 0;
        const totalPositionValue = fairValue * position.quantity;
        totalValue += totalPositionValue;
        const unrealized =
          position.averageCost != null
            ? totalPositionValue - position.averageCost * position.quantity
            : null;

        return {
          id: position.id,
          financeProductId,
          name: detail?.name ?? position.product.canonicalName,
          quantity: position.quantity,
          averageCost: position.averageCost,
          averageCostLabel: formatFinanceCurrency(position.averageCost),
          fairValueLabel: formatFinanceCurrency(fairValue),
          totalValueLabel: formatFinanceCurrency(totalPositionValue),
          unrealizedLabel: formatFinanceCurrency(unrealized),
        };
      }),
    );

    return {
      positions: hydratedPositions,
      totalValueLabel: formatFinanceCurrency(totalValue),
    };
  } catch (error) {
    if (isMissingFinanceTableError(error)) {
      return {
        positions: [],
        totalValueLabel: formatFinanceCurrency(0),
      };
    }

    throw error;
  }
}

export async function getFinanceAlertPreference(
  game: GameSlug,
  clerkUserId: string,
): Promise<FinanceAlertPreferenceSummary> {
  try {
    const preference = await prisma.financeAlertPreference.findUnique({
      where: {
        game_clerkUserId: {
          game: GAME_TO_PRISMA[game],
          clerkUserId,
        },
      },
    });

    return {
      emailEnabled: preference?.emailEnabled ?? true,
      moversEnabled: preference?.moversEnabled ?? true,
      reversalsEnabled: preference?.reversalsEnabled ?? true,
      watchlistEnabled: preference?.watchlistEnabled ?? true,
    };
  } catch (error) {
    if (isMissingFinanceTableError(error)) {
      return {
        emailEnabled: true,
        moversEnabled: true,
        reversalsEnabled: true,
        watchlistEnabled: true,
      };
    }

    throw error;
  }
}

export async function upsertFinanceAlertPreference(
  game: GameSlug,
  clerkUserId: string,
  input: FinanceAlertPreferenceSummary,
) {
  return prisma.financeAlertPreference.upsert({
    where: {
      game_clerkUserId: {
        game: GAME_TO_PRISMA[game],
        clerkUserId,
      },
    },
    update: input,
    create: {
      game: GAME_TO_PRISMA[game],
      clerkUserId,
      ...input,
    },
  });
}

export async function touchFinanceCollectionSync(
  game: GameSlug,
  clerkUserId: string,
  source = "collection-page",
) {
  return prisma.financeCollectionSync.upsert({
    where: {
      game_clerkUserId: {
        game: GAME_TO_PRISMA[game],
        clerkUserId,
      },
    },
    update: {
      source,
      lastSyncedAt: new Date(),
    },
    create: {
      game: GAME_TO_PRISMA[game],
      clerkUserId,
      source,
      lastSyncedAt: new Date(),
    },
  });
}
