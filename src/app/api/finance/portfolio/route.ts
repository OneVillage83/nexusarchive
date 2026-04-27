import { Game as PrismaGame } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { isGameSlug, type GameSlug } from "@/lib/games";
import {
  ensureFinanceProductRecord,
  getOptionalFinanceUserId,
  listFinancePortfolio,
} from "@/lib/finance/user-data";

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
    const portfolio = await listFinancePortfolio(game, userId);
    return NextResponse.json(portfolio);
  } catch (error) {
    console.error("Failed to load finance portfolio:", error);
    return NextResponse.json({ error: "Failed to load portfolio." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getOptionalFinanceUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        game?: string;
        financeProductId?: string;
        quantity?: number;
        averageCost?: number | null;
      }
    | null;
  const game = getGame(body?.game ?? null);
  const financeProductId = body?.financeProductId?.trim();
  const quantity = Math.max(1, Number(body?.quantity ?? 1));

  if (!financeProductId) {
    return NextResponse.json({ error: "financeProductId is required." }, { status: 400 });
  }

  try {
    const product = await ensureFinanceProductRecord(game, financeProductId);
    const position = await prisma.financePortfolioPosition.upsert({
      where: {
        game_clerkUserId_productId: {
          game: GAME_TO_PRISMA[game],
          clerkUserId: userId,
          productId: product.id,
        },
      },
      update: {
        quantity,
        averageCost:
          typeof body?.averageCost === "number" && Number.isFinite(body.averageCost)
            ? body.averageCost
            : null,
      },
      create: {
        game: GAME_TO_PRISMA[game],
        clerkUserId: userId,
        productId: product.id,
        quantity,
        averageCost:
          typeof body?.averageCost === "number" && Number.isFinite(body.averageCost)
            ? body.averageCost
            : null,
      },
    });

    return NextResponse.json({ id: position.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to save finance portfolio position:", error);
    return NextResponse.json({ error: "Failed to save portfolio position." }, { status: 500 });
  }
}
