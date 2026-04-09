import { FinanceAlertsView } from "@/components/finance/FinanceViews";
import { getFinanceHome } from "@/lib/finance/query";
import {
  getFinanceAlertPreference,
  getOptionalFinanceUserId,
} from "@/lib/finance/user-data";
import { requireGame } from "@/lib/server-game";

type GameFinanceAlertsPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameFinanceAlertsPage({
  params,
}: GameFinanceAlertsPageProps) {
  const game = await requireGame(params);
  const userId = await getOptionalFinanceUserId();
  const home = await getFinanceHome(game);
  const preferences = userId
    ? await getFinanceAlertPreference(game, userId)
    : {
        emailEnabled: true,
        moversEnabled: true,
        reversalsEnabled: true,
        watchlistEnabled: true,
      };

  return (
    <FinanceAlertsView
      alerts={home.alerts}
      signedIn={Boolean(userId)}
      preferences={preferences}
    />
  );
}
