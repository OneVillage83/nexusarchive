import { GamePlaceholderPage } from "@/components/game-pages/GamePlaceholderPage";
import { RiftboundArticlesPage } from "@/app/articles/page";
import { requireGame } from "@/lib/server-game";

type GameArticlesPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameArticlesPage({
  params,
}: GameArticlesPageProps) {
  const game = await requireGame(params);

  if (game === "riftbound") {
    return <RiftboundArticlesPage />;
  }

  return <GamePlaceholderPage game={game} variant="articles" />;
}
