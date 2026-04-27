import { NextResponse } from "next/server";

import {
  deleteDeck,
  getDeckById,
  getOptionalDeckUserId,
  parseDeckId,
  updateDeck,
  type DeckWriteInput,
} from "@/lib/decks/query";
import type { GameSlug } from "@/lib/games";
import { isGameSlug } from "@/lib/games";

function getGame(value: string | null): GameSlug {
  return value && isGameSlug(value) ? value : "riftbound";
}

type Params = {
  params: Promise<{ deckId: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const { deckId: deckIdParam } = await params;
  const deckId = parseDeckId(deckIdParam);
  if (!deckId) {
    return NextResponse.json({ error: "Invalid deck id." }, { status: 400 });
  }

  const viewerUserId = await getOptionalDeckUserId();
  const url = new URL(request.url);
  const game = getGame(url.searchParams.get("game"));

  try {
    const deck = await getDeckById({
      game,
      deckId,
      viewerUserId,
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    return NextResponse.json(deck, {
      headers: {
        "Cache-Control": deck.visibility === "PUBLIC" ? "public, s-maxage=120, stale-while-revalidate=900" : "private, no-store",
      },
    });
  } catch (error) {
    console.error("Failed to load deck:", error);
    return NextResponse.json({ error: "Failed to load deck." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const viewerUserId = await getOptionalDeckUserId();
  if (!viewerUserId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { deckId: deckIdParam } = await params;
  const deckId = parseDeckId(deckIdParam);
  if (!deckId) {
    return NextResponse.json({ error: "Invalid deck id." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as DeckWriteInput | null;
  if (!body || !body.game || !Array.isArray(body.entries)) {
    return NextResponse.json({ error: "Invalid deck payload." }, { status: 400 });
  }

  try {
    const deck = await updateDeck(viewerUserId, deckId, body);
    return NextResponse.json(deck);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update deck.";
    const status =
      /not found/i.test(message)
        ? 404
        : /access|required|needs at least/i.test(message)
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const viewerUserId = await getOptionalDeckUserId();
  if (!viewerUserId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { deckId: deckIdParam } = await params;
  const deckId = parseDeckId(deckIdParam);
  if (!deckId) {
    return NextResponse.json({ error: "Invalid deck id." }, { status: 400 });
  }

  const url = new URL(request.url);
  const game = getGame(url.searchParams.get("game"));

  try {
    await deleteDeck(viewerUserId, game, deckId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete deck.";
    const status = /not found/i.test(message) ? 404 : /access/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
