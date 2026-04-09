import { FinanceSealedListView } from "@/components/finance/FinanceViews";
import { getFinanceSealedSummaries } from "@/lib/finance/query";
import { requireGame } from "@/lib/server-game";

type GameFinanceSealedPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameFinanceSealedPage({
  params,
}: GameFinanceSealedPageProps) {
  const game = await requireGame(params);
  const summaries = await getFinanceSealedSummaries(game);
  return <FinanceSealedListView game={game} summaries={summaries} />;
}
