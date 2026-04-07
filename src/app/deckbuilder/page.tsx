import { redirect } from "next/navigation";

import { RiftboundDeckBuilderPage as RiftboundDeckBuilderPageContent } from "@/components/riftbound/RiftboundDeckBuilderPage";

export function RiftboundDeckBuilderPage() {
  return <RiftboundDeckBuilderPageContent />;
}

export default function DeckBuilderPage() {
  redirect("/riftbound/deckbuilder");
}
