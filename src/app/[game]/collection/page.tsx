import { auth } from "@clerk/nextjs/server";

import { CollectionFinancePage } from "@/components/finance/CollectionFinancePage";
import { isClerkConfigured } from "@/lib/auth-config";
import { getCollectionFinanceSnapshot } from "@/lib/finance/query";
import { requireGame } from "@/lib/server-game";

type GameCollectionPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameCollectionPage({
  params,
}: GameCollectionPageProps) {
  const game = await requireGame(params);
  const authEnabled = isClerkConfigured();
  const { userId } = authEnabled ? await auth() : { userId: null };
  const snapshot = await getCollectionFinanceSnapshot(game);

  return (
    <CollectionFinancePage
      game={game}
      snapshot={snapshot}
      signedIn={Boolean(userId)}
    />
  );
}
