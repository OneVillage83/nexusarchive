import { GradeScanWorkspace } from "@/components/scanner/GradeScanWorkspace";
import { requireGame } from "@/lib/server-game";

type GradeScanPageProps = {
  params: Promise<{ game: string }>;
};

export default async function GradeScanPage({ params }: GradeScanPageProps) {
  const game = await requireGame(params);
  return <GradeScanWorkspace game={game} />;
}
