import { NextResponse } from "next/server";

import { getOptionalFinanceUserId } from "@/lib/finance/user-data";
import { uploadAndProcessScan } from "@/lib/scanner/service";

export const runtime = "nodejs";

type UploadRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: UploadRouteProps) {
  const clerkUserId = await getOptionalFinanceUserId();
  const { id } = await params;
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ error: "Multipart form data is required." }, { status: 400 });
  }

  const source = formData.get("source") === "camera" ? "camera" : "upload";
  const files: Array<{
    side: "front" | "back" | "multi" | "unknown";
    fileName: string;
    mimeType: string;
    bytes: Buffer;
  }> = [];

  for (const [key, value] of formData.entries()) {
    if (!(value instanceof File)) {
      continue;
    }

    const side =
      key === "front"
        ? "front"
        : key === "back"
          ? "back"
          : key === "image" || key === "multi"
            ? "multi"
            : "unknown";

    files.push({
      side,
      fileName: value.name,
      mimeType: value.type,
      bytes: Buffer.from(await value.arrayBuffer()),
    });
  }

  try {
    const results = await uploadAndProcessScan({
      scanId: id,
      source,
      files,
      clerkUserId,
    });

    return NextResponse.json({
      ok: true,
      scanId: results.id,
      status: results.status,
      redirectTo: `/${results.game}/scan/results/${encodeURIComponent(results.id)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload scan images.";
    const status = /not found/i.test(message) ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
