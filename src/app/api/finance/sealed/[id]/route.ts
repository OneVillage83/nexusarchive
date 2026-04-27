import { NextResponse } from "next/server";

import { getFinanceSealedDetail } from "@/lib/finance/query";
import { isGameSlug } from "@/lib/games";

function getGame(value: string | null) {
  return value && isGameSlug(value) ? value : "riftbound";
}

type SealedRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: SealedRouteProps) {
  const url = new URL(request.url);
  const { id } = await params;
  const game = getGame(url.searchParams.get("game"));

  try {
    const detail = await getFinanceSealedDetail(game, id);
    if (!detail) {
      return NextResponse.json({ error: "Sealed product not found." }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Failed to load sealed finance detail:", error);
    return NextResponse.json({ error: "Failed to load sealed finance detail." }, { status: 500 });
  }
}
