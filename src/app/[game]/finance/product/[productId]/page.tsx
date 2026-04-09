import { notFound } from "next/navigation";

import { FinanceProductView } from "@/components/finance/FinanceViews";
import { getFinanceProductDetail } from "@/lib/finance/query";
import { requireGame } from "@/lib/server-game";

type GameFinanceProductPageProps = {
  params: Promise<{ game: string; productId: string }>;
};

export default async function GameFinanceProductPage({
  params,
}: GameFinanceProductPageProps) {
  const resolvedParams = await params;
  const { productId } = resolvedParams;
  const game = await requireGame(Promise.resolve({ game: resolvedParams.game }));
  const detail = await getFinanceProductDetail(game, productId);

  if (!detail) {
    notFound();
  }

  return <FinanceProductView game={game} detail={detail} />;
}
