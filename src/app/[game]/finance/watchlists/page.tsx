import { FinanceWatchlistsView } from "@/components/finance/FinanceViews";
import { getOptionalFinanceUserId, listFinanceWatchlists } from "@/lib/finance/user-data";
import { requireGame } from "@/lib/server-game";

type GameFinanceWatchlistsPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameFinanceWatchlistsPage({
  params,
}: GameFinanceWatchlistsPageProps) {
  const game = await requireGame(params);
  const userId = await getOptionalFinanceUserId();
  const watchlists = userId ? await listFinanceWatchlists(game, userId) : [];

  return <FinanceWatchlistsView watchlists={watchlists} signedIn={Boolean(userId)} />;
}
