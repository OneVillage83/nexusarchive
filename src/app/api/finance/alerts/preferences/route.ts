import { NextResponse } from "next/server";

import { isGameSlug, type GameSlug } from "@/lib/games";
import {
  getFinanceAlertPreference,
  getOptionalFinanceUserId,
  upsertFinanceAlertPreference,
} from "@/lib/finance/user-data";

function getGame(value: string | null): GameSlug {
  return value && isGameSlug(value) ? value : "riftbound";
}

export async function GET(request: Request) {
  const userId = await getOptionalFinanceUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const game = getGame(url.searchParams.get("game"));

  try {
    const preference = await getFinanceAlertPreference(game, userId);
    return NextResponse.json(preference);
  } catch (error) {
    console.error("Failed to load finance alert preferences:", error);
    return NextResponse.json({ error: "Failed to load alert preferences." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getOptionalFinanceUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        game?: string;
        emailEnabled?: boolean;
        moversEnabled?: boolean;
        reversalsEnabled?: boolean;
        watchlistEnabled?: boolean;
      }
    | null;
  const game = getGame(body?.game ?? null);

  try {
    const preference = await upsertFinanceAlertPreference(game, userId, {
      emailEnabled: body?.emailEnabled ?? true,
      moversEnabled: body?.moversEnabled ?? true,
      reversalsEnabled: body?.reversalsEnabled ?? true,
      watchlistEnabled: body?.watchlistEnabled ?? true,
    });

    return NextResponse.json(preference);
  } catch (error) {
    console.error("Failed to save finance alert preferences:", error);
    return NextResponse.json({ error: "Failed to save alert preferences." }, { status: 500 });
  }
}
