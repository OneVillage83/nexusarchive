import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import { ScanResultsClient } from "@/components/scanner/ScanResultsClient";
import { isClerkConfigured } from "@/lib/auth-config";
import { getScanResultsView } from "@/lib/scanner/service";
import { requireGame } from "@/lib/server-game";

type ScanResultsPageProps = {
  params: Promise<{ game: string; scanId: string }>;
};

export default async function ScanResultsPage({ params }: ScanResultsPageProps) {
  const resolvedParams = await params;
  await requireGame(Promise.resolve({ game: resolvedParams.game }));
  const authEnabled = isClerkConfigured();
  const { userId } = authEnabled ? await auth() : { userId: null };
  let results;

  try {
    results = await getScanResultsView(resolvedParams.scanId, userId ?? null);
  } catch {
    notFound();
  }

  return <ScanResultsClient initialResults={results} signedIn={Boolean(userId)} />;
}
