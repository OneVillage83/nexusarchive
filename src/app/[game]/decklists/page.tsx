import { auth } from "@clerk/nextjs/server";

import { DeckListsPage } from "@/components/decks/DeckListsPage";
import { isClerkConfigured } from "@/lib/auth-config";
import { listDecks } from "@/lib/decks/query";
import { requireGame } from "@/lib/server-game";

type GameDeckListsPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameDeckListsPage({
  params,
}: GameDeckListsPageProps) {
  const game = await requireGame(params);
  const authEnabled = isClerkConfigured();
  const { userId } = authEnabled ? await auth() : { userId: null };
  const [communityDecks, myDecks] = await Promise.all([
    listDecks({
      game,
      scope: "community",
      viewerUserId: userId,
    }),
    listDecks({
      game,
      scope: "mine",
      viewerUserId: userId,
    }),
  ]);

  return (
    <DeckListsPage
      game={game}
      signedIn={Boolean(userId)}
      communityDecks={communityDecks}
      myDecks={myDecks}
    />
  );
}
