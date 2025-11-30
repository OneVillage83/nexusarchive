export default function DeckBuilderPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Deck Builder</h1>
        <p className="text-sm text-slate-400">
          Build and refine Riftbound decks in real time. Search the card pool,
          tune your curve, see deck scores, and track TCGplayer prices as you
          brew.
        </p>
      </header>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        Archidekt-style deck builder UI will live here: card search on the
        left, deck list in the middle, and stats/price/score on the right.
      </div>
    </div>
  );
}
