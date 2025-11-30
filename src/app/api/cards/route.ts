import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { text: { contains: q, mode: "insensitive" } },
          { setName: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const cards = await prisma.card.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ cards, q });
}
