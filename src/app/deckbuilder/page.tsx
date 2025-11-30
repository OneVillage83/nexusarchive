export default function DeckBuilderPage() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-[0_0_45px_rgba(15,23,42,0.95)] space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-50">Deck Builder</h1>
        <p className="text-sm text-slate-400">
          Build and refine Riftbound decks in real time. Search the card pool,
          tune your curve, see deck scores, and track prices as you brew.
        </p>
      </header>

      <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-300">
        Deck builder UI will live here: card search on the
        left, deck list in the middle, and stats/price/score on the right.
      </div>
    </div>
  );
}
