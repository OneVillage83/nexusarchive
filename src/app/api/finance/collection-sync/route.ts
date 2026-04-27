import { NextResponse } from "next/server";

import { isGameSlug, type GameSlug } from "@/lib/games";
import {
  getOptionalFinanceUserId,
  touchFinanceCollectionSync,
} from "@/lib/finance/user-data";

function getGame(value: string | null): GameSlug {
  return value && isGameSlug(value) ? value : "riftbound";
}

export async function POST(request: Request) {
  const userId = await getOptionalFinanceUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { game?: string; source?: string }
    | null;
  const game = getGame(body?.game ?? null);

  try {
    const sync = await touchFinanceCollectionSync(
      game,
      userId,
      body?.source?.trim() || "collection-page",
    );
    return NextResponse.json({ ok: true, lastSyncedAt: sync.lastSyncedAt.toISOString() });
  } catch (error) {
    console.error("Failed to sync finance collection:", error);
    return NextResponse.json({ error: "Failed to sync finance collection." }, { status: 500 });
  }
}
