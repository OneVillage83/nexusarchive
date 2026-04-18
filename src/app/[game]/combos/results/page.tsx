import { ComboLibraryResultsPage } from "@/components/combos/ComboLibraryResultsPage";
import { requireGame } from "@/lib/server-game";

type GameComboResultsPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GameComboResultsPage({
  params,
}: GameComboResultsPageProps) {
  const game = await requireGame(params);

  return <ComboLibraryResultsPage game={game} />;
}
