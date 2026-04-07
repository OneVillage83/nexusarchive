import { GamePlaceholderPage } from "@/components/game-pages/GamePlaceholderPage";
import { RiftboundDeckBuilderPage } from "@/app/deckbuilder/page";
import { requireGame } from "@/lib/server-game";

type GameDeckBuilderPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameDeckBuilderRoute({
  params,
}: GameDeckBuilderPageProps) {
  const game = await requireGame(params);

  if (game === "riftbound") {
    return <RiftboundDeckBuilderPage />;
  }

  return <GamePlaceholderPage game={game} variant="deckbuilder" />;
}
