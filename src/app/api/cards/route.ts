import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  // 👇 Strongly type `where` as Prisma.CardWhereInput
  // and drop the `mode: "insensitive"` for now
  const where: Prisma.CardWhereInput | undefined = q
    ? {
        OR: [
          { name: { contains: q } },
          { text: { contains: q } },
          { setName: { contains: q } },
        ],
      }
    : undefined;

  const cards = await prisma.card.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ cards, q });
}


