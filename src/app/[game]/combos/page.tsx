import { auth } from "@clerk/nextjs/server";

import { ComboFinderWorkspace } from "@/components/combos/ComboFinderWorkspace";
import { isClerkConfigured } from "@/lib/auth-config";
import { requireGame } from "@/lib/server-game";

type GameCombosPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameCombosPage({
  params,
}: GameCombosPageProps) {
  const game = await requireGame(params);
  const authEnabled = isClerkConfigured();
  const { userId } = authEnabled ? await auth() : { userId: null };

  return (
    <ComboFinderWorkspace
      game={game}
      authEnabled={authEnabled}
      userId={userId}
    />
  );
}
