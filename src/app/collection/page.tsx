import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { CollectionFinancePage } from "@/components/finance/CollectionFinancePage";
import { isClerkConfigured } from "@/lib/auth-config";
import { getCollectionFinanceSnapshot } from "@/lib/finance/query";

export async function RiftboundCollectionsPage() {
  const authEnabled = isClerkConfigured();
  const { userId } = authEnabled ? await auth() : { userId: null };
  const snapshot = await getCollectionFinanceSnapshot("riftbound");

  return (
    <CollectionFinancePage
      game="riftbound"
      snapshot={snapshot}
      signedIn={Boolean(userId)}
    />
  );
}

export default function CollectionsPage() {
  redirect("/riftbound/collection");
}
