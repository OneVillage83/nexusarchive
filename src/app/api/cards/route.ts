import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Game, Prisma } from "@prisma/client";

const QUERY_TO_GAME: Record<string, Game> = {
  riftbound: Game.RIFTBOUND,
  "one-piece": Game.ONE_PIECE,
  "magic-the-gathering": Game.MAGIC_THE_GATHERING,
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const rawGame = (url.searchParams.get("game") ?? "riftbound").trim();
  const game = QUERY_TO_GAME[rawGame] ?? Game.RIFTBOUND;

  const where: Prisma.CardWhereInput | undefined = q
    ? {
        game,
        OR: [
          { name: { contains: q } },
          { text: { contains: q } },
          { setName: { contains: q } },
        ],
      }
    : { game };

  const cards = await prisma.card.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ cards, q, game: rawGame });
}


