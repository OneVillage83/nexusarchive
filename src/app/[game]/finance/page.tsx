import { FinanceHubView } from "@/components/finance/FinanceViews";
import { getFinanceHome } from "@/lib/finance/query";
import { requireGame } from "@/lib/server-game";

type GameFinancePageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameFinancePage({ params }: GameFinancePageProps) {
  const game = await requireGame(params);
  const data = await getFinanceHome(game);
  return <FinanceHubView game={game} data={data} />;
}
