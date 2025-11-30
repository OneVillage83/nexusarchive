import { Suspense } from "react";
import CardsPageClient from "./CardsPageClient";

export default function CardsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-300">Loading cards...</div>}>
      <CardsPageClient />
    </Suspense>
  );
}
