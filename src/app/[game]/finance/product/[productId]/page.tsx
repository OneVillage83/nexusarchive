import { notFound } from "next/navigation";

import { FinanceProductHydrator } from "@/components/finance/FinanceProductHydrator";
import { FinanceProductView } from "@/components/finance/FinanceViews";
import { getFinanceProductDetail } from "@/lib/finance/query";
import { requireGame } from "@/lib/server-game";

type GameFinanceProductPageProps = {
  params: Promise<{ game: string; productId: string }>;
  searchParams?: Promise<{ fromGallery?: string }>;
};

export default async function GameFinanceProductPage({
  params,
  searchParams,
}: GameFinanceProductPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { productId } = resolvedParams;
  const game = await requireGame(Promise.resolve({ game: resolvedParams.game }));
  const detail = await getFinanceProductDetail(game, productId);
  const fromGallery = resolvedSearchParams?.fromGallery === "1";

  if (!detail) {
    notFound();
  }

  return (
    <>
      <FinanceProductHydrator
        game={game}
        financeProductId={detail.financeProductId}
        snapshotState={detail.snapshotState}
        canAutoRefresh={detail.canAutoRefresh}
        refreshInFlight={detail.refreshInFlight}
      />
      <FinanceProductView game={game} detail={detail} fromGallery={fromGallery} />
    </>
  );
}
