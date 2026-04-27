import { NextResponse } from "next/server";

import type { CardCatalogSummary } from "@/lib/cards/catalog";
import {
  cardCatalogImageCacheKey,
  cardCatalogSummaryKey,
} from "@/lib/cards/catalog";
import { isGameSlug, type GameSlug } from "@/lib/games";
import { getRedis } from "@/lib/storage/redis";

export const runtime = "nodejs";

type CachedCardImage = {
  base64: string;
  contentType: string;
  sourceUrl: string;
  fetchedAt: string;
};

function buildImageResponse(buffer: Buffer, contentType: string, sourceUrl: string) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(buffer.byteLength),
      "X-NexusArchive-Image-Source": sourceUrl,
    },
  });
}

async function getCardSummary(game: GameSlug, cardId: string) {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  return (
    (await redis.get<CardCatalogSummary>(cardCatalogSummaryKey(game, cardId))) ?? null
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ game: string; cardId: string }> },
) {
  const { game: rawGame, cardId } = await context.params;
  if (!isGameSlug(rawGame)) {
    return NextResponse.json({ error: "Unknown game." }, { status: 404 });
  }

  const game = rawGame as GameSlug;
  const summary = await getCardSummary(game, cardId);

  if (!summary?.imageUrl) {
    return NextResponse.json({ error: "Card image not found." }, { status: 404 });
  }

  const sourceUrl = summary.imageUrl;
  if (!/^https?:\/\//i.test(sourceUrl)) {
    return NextResponse.json({ error: "Card image source is not remote." }, { status: 400 });
  }

  const redis = getRedis();
  const cacheKey = cardCatalogImageCacheKey(game, cardId);
  const cached = redis
    ? await redis.get<CachedCardImage>(cacheKey)
    : null;

  if (
    cached?.base64 &&
    cached.contentType &&
    cached.sourceUrl === sourceUrl
  ) {
    return buildImageResponse(
      Buffer.from(cached.base64, "base64"),
      cached.contentType,
      cached.sourceUrl,
    );
  }

  const upstream = await fetch(sourceUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 NexusArchive/1.0",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream image request failed with ${upstream.status}.` },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "image/png";
  const buffer = Buffer.from(await upstream.arrayBuffer());

  if (redis) {
    const payload: CachedCardImage = {
      base64: buffer.toString("base64"),
      contentType,
      sourceUrl,
      fetchedAt: new Date().toISOString(),
    };
    await redis.set(cacheKey, payload);
  }

  return buildImageResponse(buffer, contentType, sourceUrl);
}
