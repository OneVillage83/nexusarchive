import { notFound } from "next/navigation";

import { FinanceWatchlistDetailView } from "@/components/finance/FinanceViews";
import { getFinanceWatchlistById, getOptionalFinanceUserId } from "@/lib/finance/user-data";
import { requireGame } from "@/lib/server-game";

type GameFinanceWatchlistDetailPageProps = {
  params: Promise<{ game: string; watchlistId: string }>;
};

export default async function GameFinanceWatchlistDetailPage({
  params,
}: GameFinanceWatchlistDetailPageProps) {
  const resolvedParams = await params;
  const { watchlistId } = resolvedParams;
  const game = await requireGame(Promise.resolve({ game: resolvedParams.game }));
  const userId = await getOptionalFinanceUserId();

  if (!userId) {
    notFound();
  }

  const watchlist = await getFinanceWatchlistById(game, userId, watchlistId);
  if (!watchlist) {
    notFound();
  }

  return <FinanceWatchlistDetailView watchlist={watchlist} />;
}
