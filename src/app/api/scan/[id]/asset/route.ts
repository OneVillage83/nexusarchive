import { NextResponse } from "next/server";

import { getOptionalFinanceUserId } from "@/lib/finance/user-data";
import { getScanAsset } from "@/lib/scanner/service";

export const runtime = "nodejs";

type AssetRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: AssetRouteProps) {
  const clerkUserId = await getOptionalFinanceUserId();
  const { id } = await params;
  const url = new URL(request.url);
  const imageId = url.searchParams.get("imageId");
  const detectionId = url.searchParams.get("detectionId");
  const variant = url.searchParams.get("variant");

  if (!variant || !["raw", "normalized", "overlay", "crop"].includes(variant)) {
    return NextResponse.json({ error: "Valid asset variant is required." }, { status: 400 });
  }

  try {
    const asset = await getScanAsset({
      scanId: id,
      imageId,
      detectionId,
      variant: variant as "raw" | "normalized" | "overlay" | "crop",
      clerkUserId,
    });

    return new NextResponse(asset.bytes, {
      headers: {
        "Content-Type": asset.mimeType,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load scan asset.";
    const status = /not found/i.test(message) ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
