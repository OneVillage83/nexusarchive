import { NextResponse } from "next/server";

import { isGameSlug, type GameSlug } from "@/lib/games";
import {
  getOptionalFinanceUserId,
  listFinanceWatchlists,
} from "@/lib/finance/user-data";
import prisma from "@/lib/db";
import { Game as PrismaGame } from "@prisma/client";

function getGame(value: string | null): GameSlug {
  return value && isGameSlug(value) ? value : "riftbound";
}

const GAME_TO_PRISMA: Record<GameSlug, PrismaGame> = {
  riftbound: PrismaGame.RIFTBOUND,
  "one-piece": PrismaGame.ONE_PIECE,
  "magic-the-gathering": PrismaGame.MAGIC_THE_GATHERING,
};

export async function GET(request: Request) {
  const userId = await getOptionalFinanceUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const game = getGame(url.searchParams.get("game"));

  try {
    const watchlists = await listFinanceWatchlists(game, userId);
    return NextResponse.json(watchlists);
  } catch (error) {
    console.error("Failed to list finance watchlists:", error);
    return NextResponse.json({ error: "Failed to list watchlists." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getOptionalFinanceUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { game?: string; name?: string }
    | null;
  const game = getGame(body?.game ?? null);
  const name = body?.name?.trim() || "New Finance Watchlist";

  try {
    const watchlist = await prisma.financeWatchlist.create({
      data: {
        game: GAME_TO_PRISMA[game],
        clerkUserId: userId,
        name,
      },
    });

    return NextResponse.json({ id: watchlist.id, name: watchlist.name }, { status: 201 });
  } catch (error) {
    console.error("Failed to create finance watchlist:", error);
    return NextResponse.json({ error: "Failed to create watchlist." }, { status: 500 });
  }
}
