import { notFound } from "next/navigation";

import { GameSlug, isGameSlug } from "@/lib/games";

export async function requireGame(
  params: Promise<{ game: string }>,
): Promise<GameSlug> {
  const { game } = await params;

  if (!isGameSlug(game)) {
    notFound();
  }

  return game;
}
