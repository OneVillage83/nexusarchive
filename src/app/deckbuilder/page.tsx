import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { RiftboundDeckBuilderPage as RiftboundDeckBuilderPageContent } from "@/components/riftbound/RiftboundDeckBuilderPage";
import { isClerkConfigured } from "@/lib/auth-config";

export async function RiftboundDeckBuilderPage() {
  const authEnabled = isClerkConfigured();
  const { userId } = authEnabled ? await auth() : { userId: null };

  return (
    <RiftboundDeckBuilderPageContent
      authEnabled={authEnabled}
      userId={userId}
    />
  );
}

export default function DeckBuilderPage() {
  redirect("/riftbound/deckbuilder");
}
