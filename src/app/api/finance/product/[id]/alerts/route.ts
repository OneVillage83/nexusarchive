import { NextResponse } from "next/server";

import { getFinanceProductDetail } from "@/lib/finance/query";
import { isGameSlug } from "@/lib/games";

function getGame(value: string | null) {
  return value && isGameSlug(value) ? value : "riftbound";
}

type ProductAlertsRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: ProductAlertsRouteProps) {
  const url = new URL(request.url);
  const { id } = await params;
  const game = getGame(url.searchParams.get("game"));

  try {
    const detail = await getFinanceProductDetail(game, id);
    if (!detail) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({
      financeProductId: detail.financeProductId,
      alerts: detail.alerts,
    });
  } catch (error) {
    console.error("Failed to load finance alerts:", error);
    return NextResponse.json({ error: "Failed to load finance alerts." }, { status: 500 });
  }
}
