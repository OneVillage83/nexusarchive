import { NextResponse } from "next/server";

import { analyzeCombos } from "@/lib/combos/analyze";
import type { ComboAnalyzeRequest } from "@/lib/combos/types";
import { getOptionalDeckUserId } from "@/lib/decks/query";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ComboAnalyzeRequest;
    const viewerUserId = await getOptionalDeckUserId();
    const result = await analyzeCombos(body, viewerUserId);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to analyze combos:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze combo input.",
      },
      { status: 500 },
    );
  }
}
