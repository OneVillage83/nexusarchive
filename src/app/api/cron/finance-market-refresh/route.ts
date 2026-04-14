import { NextResponse } from "next/server";

import { runFinanceMarketRefresh } from "@/lib/finance/refresh";

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

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  try {
    const summary = await runFinanceMarketRefresh({ dryRun });
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Finance market refresh failed:", error);
    return NextResponse.json(
      { error: "Finance market refresh failed." },
      { status: 500 },
    );
  }
}
