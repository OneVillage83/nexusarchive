import { GameHomeShowcase } from "@/components/game-pages/GameHomeShowcase";
import { requireGame } from "@/lib/server-game";

type GamePageProps = {
  params: Promise<{ game: string }>;
};

export default async function GamePage({ params }: GamePageProps) {
  const game = await requireGame(params);
  return <GameHomeShowcase game={game} />;
}
