import { GameCardsPageView } from "@/app/cards/page";
import { requireGame } from "@/lib/server-game";

type GameCardsPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameCardsPage({ params }: GameCardsPageProps) {
  const game = await requireGame(params);
  return <GameCardsPageView game={game} />;
}
