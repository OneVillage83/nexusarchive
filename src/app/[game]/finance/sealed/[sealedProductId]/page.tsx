import { notFound } from "next/navigation";

import { FinanceSealedDetailView } from "@/components/finance/FinanceViews";
import { getFinanceSealedDetail } from "@/lib/finance/query";
import { requireGame } from "@/lib/server-game";

type GameFinanceSealedDetailPageProps = {
  params: Promise<{ game: string; sealedProductId: string }>;
};

export default async function GameFinanceSealedDetailPage({
  params,
}: GameFinanceSealedDetailPageProps) {
  const resolvedParams = await params;
  const { sealedProductId } = resolvedParams;
  const game = await requireGame(Promise.resolve({ game: resolvedParams.game }));
  const detail = await getFinanceSealedDetail(game, sealedProductId);

  if (!detail) {
    notFound();
  }

  return <FinanceSealedDetailView detail={detail} />;
}
