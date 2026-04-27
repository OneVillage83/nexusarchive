import { NextResponse } from "next/server";

import { getOptionalFinanceUserId } from "@/lib/finance/user-data";
import { getScanResultsView } from "@/lib/scanner/service";

export const runtime = "nodejs";

type ScanResultsRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: ScanResultsRouteProps) {
  const clerkUserId = await getOptionalFinanceUserId();
  const { id } = await params;

  try {
    const results = await getScanResultsView(id, clerkUserId);
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load scan results.";
    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
