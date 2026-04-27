import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { DeckBuilderApp } from "@/components/decks/DeckBuilderApp";
import { isClerkConfigured } from "@/lib/auth-config";
import { getDeckById, parseDeckId } from "@/lib/decks/query";
import { buildGamePath } from "@/lib/games";
import { requireGame } from "@/lib/server-game";

type Params = {
  params: Promise<{ game: string; deckId: string }>;
};

export default async function GameDeckBuilderDetailPage({ params }: Params) {
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

  if (!deck.canEdit) {
    redirect(buildGamePath(game, `decklists/${deck.id}`));
  }

  return (
    <DeckBuilderApp
      game={game}
      authEnabled={authEnabled}
      userId={userId}
      initialDeck={deck}
    />
  );
}
