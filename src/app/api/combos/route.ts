import { NextResponse } from "next/server";

import { getGameFromQuery } from "@/lib/cards/query";
import {
  getComboBrowseResults,
  parseComboSearchFilters,
} from "@/lib/combos/query";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const game = getGameFromQuery(url.searchParams.get("game"));

  try {
    const result = await getComboBrowseResults(
      game,
      parseComboSearchFilters(url.searchParams),
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=900",
      },
    });
  } catch (error) {
    console.error("Failed to query combos:", error);
    return NextResponse.json(
      { error: "Failed to load combos." },
      { status: 500 },
    );
  }
}
