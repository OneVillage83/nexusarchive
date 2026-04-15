import { NextResponse } from "next/server";

import { runComboSync } from "@/lib/combos/sync";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runComboSync();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Combo sync failed:", error);
    return NextResponse.json(
      { error: "Combo sync failed." },
      { status: 500 },
    );
  }
}
