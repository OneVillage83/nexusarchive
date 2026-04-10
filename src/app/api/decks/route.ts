import { NextResponse } from "next/server";

import type { GameSlug } from "@/lib/games";
import { isGameSlug } from "@/lib/games";
import {
  createDeck,
  getOptionalDeckUserId,
  listDecks,
  type DeckListScope,
  type DeckWriteInput,
} from "@/lib/decks/query";

function getGame(value: string | null): GameSlug {
  return value && isGameSlug(value) ? value : "riftbound";
}

function getScope(value: string | null): DeckListScope {
  return value === "mine" ? "mine" : "community";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const game = getGame(url.searchParams.get("game"));
  const scope = getScope(url.searchParams.get("scope"));
  const viewerUserId = await getOptionalDeckUserId();

  if (scope === "mine" && !viewerUserId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const decks = await listDecks({
      game,
      scope,
      viewerUserId,
      q: url.searchParams.get("q") ?? undefined,
      formatKey: url.searchParams.get("format") ?? undefined,
    });
    return NextResponse.json(decks, {
      headers: {
        "Cache-Control":
          scope === "community"
            ? "public, s-maxage=120, stale-while-revalidate=900"
            : "private, no-store",
      },
    });
  } catch (error) {
    console.error("Failed to list decks:", error);
    return NextResponse.json({ error: "Failed to list decks." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const viewerUserId = await getOptionalDeckUserId();
  if (!viewerUserId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as DeckWriteInput | null;
  if (!body || !body.game || !Array.isArray(body.entries)) {
    return NextResponse.json({ error: "Invalid deck payload." }, { status: 400 });
  }

  try {
    const deck = await createDeck(viewerUserId, body);
    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create deck.";
    const status = /required|needs at least/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
