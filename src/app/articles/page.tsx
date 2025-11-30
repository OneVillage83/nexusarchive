export default function ArticlesPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Articles</h1>
        <p className="text-sm text-slate-400">
          Meta reports, patch breakdowns, card highlight pieces, and curated
          deck features for Riftbound.
        </p>
      </header>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        Article list will be rendered here once we wire in the content system.
      </div>
    </div>
  );
}
