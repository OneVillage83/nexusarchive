import { Suspense } from "react";
import { redirect } from "next/navigation";

import type { GameSlug } from "@/lib/games";
import { createSearchString } from "@/lib/search-params";

import CardsPageClient from "./CardsPageClient";

type LegacyCardsPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export function RiftboundCardsPage() {
  return <GameCardsPageView game="riftbound" />;
}

export function GameCardsPageView({ game }: { game: GameSlug }) {
  return (
    <Suspense fallback={<div className="p-6 text-slate-300">Loading cards...</div>}>
      <CardsPageClient game={game} />
    </Suspense>
  );
}

export default async function CardsPage({
  searchParams,
}: LegacyCardsPageProps) {
  const query = createSearchString((await searchParams) ?? {});
  redirect(`/riftbound/cards${query}`);
}
