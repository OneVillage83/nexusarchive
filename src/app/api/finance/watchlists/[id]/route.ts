import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getOptionalFinanceUserId } from "@/lib/finance/user-data";

type WatchlistRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: WatchlistRouteProps) {
  const userId = await getOptionalFinanceUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const watchlist = await prisma.financeWatchlist.findFirst({
      where: {
        id,
        clerkUserId: userId,
      },
      include: {
        items: true,
      },
    });

    if (!watchlist) {
      return NextResponse.json({ error: "Watchlist not found." }, { status: 404 });
    }

    return NextResponse.json(watchlist);
  } catch (error) {
    console.error("Failed to load finance watchlist:", error);
    return NextResponse.json({ error: "Failed to load watchlist." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: WatchlistRouteProps) {
  const userId = await getOptionalFinanceUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "A name is required." }, { status: 400 });
  }

  try {
    const watchlist = await prisma.financeWatchlist.updateMany({
      where: {
        id,
        clerkUserId: userId,
      },
      data: {
        name,
      },
    });

    if (watchlist.count === 0) {
      return NextResponse.json({ error: "Watchlist not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update finance watchlist:", error);
    return NextResponse.json({ error: "Failed to update watchlist." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: WatchlistRouteProps) {
  const userId = await getOptionalFinanceUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleted = await prisma.financeWatchlist.deleteMany({
      where: {
        id,
        clerkUserId: userId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Watchlist not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete finance watchlist:", error);
    return NextResponse.json({ error: "Failed to delete watchlist." }, { status: 500 });
  }
}
