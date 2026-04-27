import { ScannerModePicker } from "@/components/scanner/ScannerModePicker";
import { requireGame } from "@/lib/server-game";
import type { ScannerIntent } from "@/lib/scanner/types";

type GameScanPageProps = {
  params: Promise<{ game: string }>;
  searchParams?: Promise<{ intent?: string }>;
};

export default async function GameScanPage({
  params,
  searchParams,
}: GameScanPageProps) {
  const game = await requireGame(params);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const intent: ScannerIntent =
    resolvedSearchParams?.intent === "collection" ? "collection" : "general";

  return <ScannerModePicker game={game} intent={intent} />;
}
