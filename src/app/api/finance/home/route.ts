import { NextResponse } from "next/server";

import { getFinanceHome } from "@/lib/finance/query";
import { isGameSlug } from "@/lib/games";

function getGame(value: string | null) {
  return value && isGameSlug(value) ? value : "riftbound";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const game = getGame(url.searchParams.get("game"));

  try {
    const data = await getFinanceHome(game);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load finance home:", error);
    return NextResponse.json({ error: "Failed to load finance home." }, { status: 500 });
  }
}
