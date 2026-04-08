import { NextResponse } from "next/server";

import {
  getGameFromQuery,
  parseCardPage,
  parseCardPageSize,
  queryCards,
} from "@/lib/cards/query";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const game = getGameFromQuery(url.searchParams.get("game"));
  const page = parseCardPage(url.searchParams.get("page"));
  const pageSize = parseCardPageSize(url.searchParams.get("pageSize"));

  try {
    const result = await queryCards({
      game,
      q,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to query cards:", error);
    return NextResponse.json(
      { error: "Failed to load cards." },
      { status: 500 },
    );
  }
}
