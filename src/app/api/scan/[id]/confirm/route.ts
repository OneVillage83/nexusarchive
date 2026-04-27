import { NextResponse } from "next/server";

import { getOptionalFinanceUserId } from "@/lib/finance/user-data";
import { confirmScanSelection } from "@/lib/scanner/service";

export const runtime = "nodejs";

type ConfirmRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: ConfirmRouteProps) {
  const clerkUserId = await getOptionalFinanceUserId();
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        detectionId?: string;
        identificationId?: string;
      }
    | null;

  if (!body?.detectionId?.trim() || !body?.identificationId?.trim()) {
    return NextResponse.json(
      { error: "detectionId and identificationId are required." },
      { status: 400 },
    );
  }

  try {
    const results = await confirmScanSelection({
      scanId: id,
      detectionId: body.detectionId.trim(),
      identificationId: body.identificationId.trim(),
      clerkUserId,
    });

    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to confirm scan result.";
    const status = /not found/i.test(message) ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
