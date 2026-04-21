import { NextResponse } from "next/server";

import {
  getFinanceProductDetail,
  refreshFinanceProductDetail,
} from "@/lib/finance/query";
import { isGameSlug } from "@/lib/games";

function getGame(value: string | null) {
  return value && isGameSlug(value) ? value : "riftbound";
}

type ProductRefreshRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: ProductRefreshRouteProps) {
  const url = new URL(request.url);
  const { id } = await params;
  const game = getGame(url.searchParams.get("game"));

  try {
    const detail = await refreshFinanceProductDetail(game, id);
    if (!detail) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Failed to refresh finance product:", error);

    const fallback = await getFinanceProductDetail(game, id).catch(() => null);
    if (fallback) {
      return NextResponse.json(fallback, { status: 202 });
    }

    return NextResponse.json(
      { error: "Failed to refresh finance product." },
      { status: 500 },
    );
  }
}
