import { NextResponse } from "next/server";

import {
  parseCardFilterParam,
  parseCardSort,
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
  const sort = parseCardSort(url.searchParams.get("sort"));
  const filters = {
    domains: parseCardFilterParam(url.searchParams.get("domains")),
    rarities: parseCardFilterParam(url.searchParams.get("rarities")),
    sets: parseCardFilterParam(url.searchParams.get("sets")),
  };

  try {
    const result = await queryCards({
      game,
      q,
      page,
      pageSize,
      filters,
      sort,
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
