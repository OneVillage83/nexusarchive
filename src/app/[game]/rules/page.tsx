import { GamePlaceholderPage } from "@/components/game-pages/GamePlaceholderPage";
import { RiftboundRulesPage } from "@/app/rules/page";
import { requireGame } from "@/lib/server-game";

type GameRulesPageProps = {
  params: Promise<{ game: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function GameRulesPage({
  params,
  searchParams,
}: GameRulesPageProps) {
  const game = await requireGame(params);

  if (game === "riftbound") {
    return <RiftboundRulesPage searchParams={searchParams} />;
  }

  return <GamePlaceholderPage game={game} variant="rules" />;
}
