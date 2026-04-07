import { GamePlaceholderPage } from "@/components/game-pages/GamePlaceholderPage";
import { RiftboundCardsPage } from "@/app/cards/page";
import { requireGame } from "@/lib/server-game";

type GameCardsPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameCardsPage({ params }: GameCardsPageProps) {
  const game = await requireGame(params);

  if (game === "riftbound") {
    return <RiftboundCardsPage />;
  }

  return <GamePlaceholderPage game={game} variant="cards" />;
}
