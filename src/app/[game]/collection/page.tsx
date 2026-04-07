import { GamePlaceholderPage } from "@/components/game-pages/GamePlaceholderPage";
import { RiftboundCollectionsPage } from "@/app/collection/page";
import { requireGame } from "@/lib/server-game";

type GameCollectionPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameCollectionPage({
  params,
}: GameCollectionPageProps) {
  const game = await requireGame(params);

  if (game === "riftbound") {
    return <RiftboundCollectionsPage />;
  }

  return <GamePlaceholderPage game={game} variant="collection" />;
}
