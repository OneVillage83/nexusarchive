import { GamePlaceholderPage } from "@/components/game-pages/GamePlaceholderPage";
import { RiftboundComboFinderPage } from "@/app/combos/page";
import { requireGame } from "@/lib/server-game";

type GameCombosPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameCombosPage({
  params,
}: GameCombosPageProps) {
  const game = await requireGame(params);

  if (game === "riftbound") {
    return <RiftboundComboFinderPage />;
  }

  return <GamePlaceholderPage game={game} variant="combos" />;
}
