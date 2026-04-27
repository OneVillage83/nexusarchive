import { NextResponse } from "next/server";

import { getOptionalFinanceUserId } from "@/lib/finance/user-data";
import { isGameSlug } from "@/lib/games";
import { createScan } from "@/lib/scanner/service";
import { SCAN_INTENTS, SCAN_MODES } from "@/lib/scanner/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        game?: string;
        mode?: string;
        intent?: string;
      }
    | null;

  const game = body?.game?.trim() ?? "";
  const mode = body?.mode?.trim() ?? "";
  const intent = body?.intent?.trim() ?? "general";

  if (!isGameSlug(game)) {
    return NextResponse.json({ error: "Valid game is required." }, { status: 400 });
  }

  if (!SCAN_MODES.includes(mode as (typeof SCAN_MODES)[number])) {
    return NextResponse.json({ error: "Valid scan mode is required." }, { status: 400 });
  }

  if (!SCAN_INTENTS.includes(intent as (typeof SCAN_INTENTS)[number])) {
    return NextResponse.json({ error: "Valid scan intent is required." }, { status: 400 });
  }

  try {
    const clerkUserId = await getOptionalFinanceUserId();
    const scan = await createScan({
      game,
      mode: mode as (typeof SCAN_MODES)[number],
      intent: intent as (typeof SCAN_INTENTS)[number],
      clerkUserId,
    });

    return NextResponse.json(
      {
        scanId: scan.id,
        redirectTo: `/${game}/scan/results/${encodeURIComponent(scan.id)}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create scan:", error);
    return NextResponse.json({ error: "Failed to create scan." }, { status: 500 });
  }
}
