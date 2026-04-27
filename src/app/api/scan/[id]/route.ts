import { NextResponse } from "next/server";

import { getOptionalFinanceUserId } from "@/lib/finance/user-data";
import { getScanSummary } from "@/lib/scanner/service";

export const runtime = "nodejs";

type ScanRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: ScanRouteProps) {
  const clerkUserId = await getOptionalFinanceUserId();
  const { id } = await params;

  try {
    const scan = await getScanSummary(id, clerkUserId);
    return NextResponse.json(scan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load scan.";
    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
