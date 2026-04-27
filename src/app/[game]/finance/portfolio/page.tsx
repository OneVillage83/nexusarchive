import { FinancePortfolioView } from "@/components/finance/FinanceViews";
import { getOptionalFinanceUserId, listFinancePortfolio } from "@/lib/finance/user-data";
import { requireGame } from "@/lib/server-game";

type GameFinancePortfolioPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameFinancePortfolioPage({
  params,
}: GameFinancePortfolioPageProps) {
  const game = await requireGame(params);
  const userId = await getOptionalFinanceUserId();
  const portfolio = userId
    ? await listFinancePortfolio(game, userId)
    : { positions: [], totalValueLabel: "$0.00" };

  return <FinancePortfolioView portfolio={portfolio} signedIn={Boolean(userId)} />;
}
