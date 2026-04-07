import { GamePlaceholderPage } from "@/components/game-pages/GamePlaceholderPage";
import { RiftboundDeckListsPage } from "@/app/decklists/page";
import { requireGame } from "@/lib/server-game";

type GameDecklistsPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameDecklistsPage({
  params,
}: GameDecklistsPageProps) {
  const game = await requireGame(params);

  if (game === "riftbound") {
    return <RiftboundDeckListsPage />;
  }

  return <GamePlaceholderPage game={game} variant="decklists" />;
}
