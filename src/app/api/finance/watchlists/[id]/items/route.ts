import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { isGameSlug } from "@/lib/games";
import {
  ensureFinanceProductRecord,
  getOptionalFinanceUserId,
} from "@/lib/finance/user-data";

type WatchlistItemRouteProps = {
  params: Promise<{ id: string }>;
};

function getGame(value: string | null) {
  return value && isGameSlug(value) ? value : "riftbound";
}

export async function POST(request: Request, { params }: WatchlistItemRouteProps) {
  const userId = await getOptionalFinanceUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | { game?: string; financeProductId?: string; note?: string }
    | null;
  const game = getGame(body?.game ?? null);
  const financeProductId = body?.financeProductId?.trim();

  if (!financeProductId) {
    return NextResponse.json({ error: "financeProductId is required." }, { status: 400 });
  }

  try {
    const watchlist = await prisma.financeWatchlist.findFirst({
      where: {
        id,
        clerkUserId: userId,
      },
    });

    if (!watchlist) {
      return NextResponse.json({ error: "Watchlist not found." }, { status: 404 });
    }

    const product = await ensureFinanceProductRecord(game, financeProductId);
    const item = await prisma.financeWatchlistItem.upsert({
      where: {
        watchlistId_productId: {
          watchlistId: watchlist.id,
          productId: product.id,
        },
      },
      update: {
        note: body?.note?.trim() || null,
      },
      create: {
        watchlistId: watchlist.id,
        productId: product.id,
        note: body?.note?.trim() || null,
      },
    });

    return NextResponse.json({ id: item.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to add finance watchlist item:", error);
    return NextResponse.json({ error: "Failed to save watchlist item." }, { status: 500 });
  }
}
