import { NextResponse } from "next/server";

import { getOptionalFinanceUserId } from "@/lib/finance/user-data";
import { retryScan } from "@/lib/scanner/service";

export const runtime = "nodejs";

type RetryRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RetryRouteProps) {
  const clerkUserId = await getOptionalFinanceUserId();
  const { id } = await params;

  try {
    const results = await retryScan({
      scanId: id,
      clerkUserId,
    });

    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retry scan.";
    const status = /not found/i.test(message) ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
