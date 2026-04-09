import { NextResponse } from "next/server";

import { getFinanceHome } from "@/lib/finance/query";
import { isGameSlug, type GameSlug } from "@/lib/games";

function getGame(value: string | null): GameSlug {
  return value && isGameSlug(value) ? value : "riftbound";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const game = getGame(url.searchParams.get("game"));

  try {
    const home = await getFinanceHome(game);
    return NextResponse.json(home.alerts);
  } catch (error) {
    console.error("Failed to load public finance alerts:", error);
    return NextResponse.json({ error: "Failed to load public finance alerts." }, { status: 500 });
  }
}
