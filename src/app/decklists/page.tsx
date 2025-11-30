export default function DeckListsPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Deck Lists</h1>
        <p className="text-sm text-slate-400">
          Browse Riftbound deck lists ranked by NexusArchive deck score. Filter
          by champion, archetype, budget, or tags like &quot;aggro&quot;,
          &quot;control&quot;, and &quot;ladder&quot;.
        </p>
      </header>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        Deck list table / grid (similar to commandersalt-style listing) will go
        here with sorting, filters, and score badges.
      </div>
    </div>
  );
}
