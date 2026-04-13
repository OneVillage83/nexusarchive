import { NextResponse } from "next/server";

import {
  parseCardFilterParam,
  parseCardSort,
  parseCardVersionMode,
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
  const versionMode = parseCardVersionMode(url.searchParams.get("versionMode"));
  const filters = {
    domains: parseCardFilterParam(url.searchParams.get("domains")),
    rarities: parseCardFilterParam(url.searchParams.get("rarities")),
    sets: parseCardFilterParam(url.searchParams.get("sets")),
    types: parseCardFilterParam(url.searchParams.get("types")),
  };

  try {
    const result = await queryCards({
      game,
      q,
      page,
      pageSize,
      filters,
      sort,
      versionMode,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=900",
      },
    });
  } catch (error) {
    console.error("Failed to query cards:", error);
    return NextResponse.json(
      { error: "Failed to load cards." },
      { status: 500 },
    );
  }
}
