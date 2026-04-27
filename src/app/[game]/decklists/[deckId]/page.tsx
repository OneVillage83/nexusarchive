import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import { DeckDetailPage } from "@/components/decks/DeckDetailPage";
import { isClerkConfigured } from "@/lib/auth-config";
import { getDeckById, parseDeckId } from "@/lib/decks/query";
import { requireGame } from "@/lib/server-game";

type Params = {
  params: Promise<{ game: string; deckId: string }>;
};

export default async function GameDeckDetailPage({ params }: Params) {
  const { game: gameParam, deckId: deckIdParam } = await params;
  const game = await requireGame(Promise.resolve({ game: gameParam }));
  const deckId = parseDeckId(deckIdParam);

  if (!deckId) {
    notFound();
  }

  const authEnabled = isClerkConfigured();
  const { userId } = authEnabled ? await auth() : { userId: null };
  const deck = await getDeckById({
    game,
    deckId,
    viewerUserId: userId,
  });

  if (!deck) {
    notFound();
  }

  return <DeckDetailPage game={game} deck={deck} />;
}
