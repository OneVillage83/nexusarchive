import { GamePlaceholderPage } from "@/components/game-pages/GamePlaceholderPage";
import { RiftboundAdvancedCardSearchPage } from "@/app/cards/advanced/page";
import { requireGame } from "@/lib/server-game";

type GameAdvancedCardsPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameAdvancedCardsPage({
  params,
}: GameAdvancedCardsPageProps) {
  const game = await requireGame(params);

  if (game === "riftbound") {
    return <RiftboundAdvancedCardSearchPage />;
  }

  return <GamePlaceholderPage game={game} variant="cards-advanced" />;
}
