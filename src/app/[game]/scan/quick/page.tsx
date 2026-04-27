import { QuickScanWorkspace } from "@/components/scanner/QuickScanWorkspace";
import { requireGame } from "@/lib/server-game";
import type { ScannerIntent } from "@/lib/scanner/types";

type QuickScanPageProps = {
  params: Promise<{ game: string }>;
  searchParams?: Promise<{ intent?: string }>;
};

export default async function QuickScanPage({
  params,
  searchParams,
}: QuickScanPageProps) {
  const game = await requireGame(params);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const intent: ScannerIntent =
    resolvedSearchParams?.intent === "collection" ? "collection" : "general";

  return <QuickScanWorkspace game={game} intent={intent} />;
}
