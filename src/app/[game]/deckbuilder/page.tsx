import { auth } from "@clerk/nextjs/server";

import { DeckBuilderApp } from "@/components/decks/DeckBuilderApp";
import { isClerkConfigured } from "@/lib/auth-config";
import { requireGame } from "@/lib/server-game";

type GameDeckBuilderPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameDeckBuilderPage({
  params,
}: GameDeckBuilderPageProps) {
  const game = await requireGame(params);
  const authEnabled = isClerkConfigured();
  const { userId } = authEnabled ? await auth() : { userId: null };

  return (
    <DeckBuilderApp
      game={game}
      authEnabled={authEnabled}
      userId={userId}
      initialDeck={null}
    />
  );
}
