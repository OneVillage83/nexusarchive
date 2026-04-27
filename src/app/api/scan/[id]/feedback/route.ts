import { NextResponse } from "next/server";

import { getOptionalFinanceUserId } from "@/lib/finance/user-data";
import { submitScanFeedback } from "@/lib/scanner/service";
import { SCAN_FEEDBACK_TYPES } from "@/lib/scanner/types";

export const runtime = "nodejs";

type FeedbackRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: FeedbackRouteProps) {
  const clerkUserId = await getOptionalFinanceUserId();
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        feedbackType?: string;
        note?: string | null;
        correctFinanceProductId?: string | null;
      }
    | null;

  if (!body?.feedbackType || !SCAN_FEEDBACK_TYPES.includes(body.feedbackType as (typeof SCAN_FEEDBACK_TYPES)[number])) {
    return NextResponse.json({ error: "Valid feedbackType is required." }, { status: 400 });
  }

  try {
    const result = await submitScanFeedback({
      scanId: id,
      feedbackType: body.feedbackType as (typeof SCAN_FEEDBACK_TYPES)[number],
      note: body.note?.trim() || null,
      correctFinanceProductId: body.correctFinanceProductId?.trim() || null,
      clerkUserId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit scan feedback.";
    const status = /not found/i.test(message) ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
