import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="pt-8 pb-4">
        <div className="w-full flex flex-col items-center text-center space-y-6">
          {/* Title */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-3xl font-semibold sm:text-4xl">
              NexusArchive – all the Riftbound tools you need in one spot.
          </h1>
         </div>
          {/* Search form → /cards?q=... */}
          <form
            action="/cards"
            method="GET"
            className="mt-2 flex w-full max-w-xl items-center justify-center gap-2"
          >
            <input
              type="search"
              name="q"
              placeholder="Search for a card, champion, or keyword…"
              className="h-11 w-full rounded-xl border border-na-blue/60 bg-na-surface-soft px-4 text-sm text-slate-100
                         placeholder:text-slate-500
                         focus:border-na-cyan focus:outline-none
                         focus:ring-2 focus:ring-na-cyan/70 focus:ring-offset-2 focus:ring-offset-na-bg
                         transition-all"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-full
                         bg-amber-400 px-6 text-sm font-semibold text-slate-950
                         shadow-none
                         transition-all duration-200
                         hover:bg-amber-300
                         hover:shadow-[0_0_30px_rgba(251,191,36,0.65)]"
            >
              Search
            </button>
          </form>

          {/* Quick links */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="text-na-cyan/80">Jump to:</span>

            <Link
              href="/deckbuilder"
              className="rounded-full border border-na-gold/60 bg-na-gold/15 px-3 py-1 text-na-gold
                         hover:bg-na-gold/25 hover:border-na-gold
                         transition-colors"
            >
              Deck Builder
            </Link>

            <Link
              href="/cards"
              className="rounded-full border border-na-blue/70 bg-na-surface-soft px-3 py-1 text-slate-200
                         hover:border-na-cyan hover:text-na-cyan
                         transition-colors"
            >
              Card Gallery
            </Link>

            <Link
              href="/combos"
              className="rounded-full border border-na-blue/70 bg-na-surface-soft px-3 py-1 text-slate-200
                         hover:border-na-cyan hover:text-na-cyan
                         transition-colors"
            >
              Combo Finder
            </Link>
          </div>
        </div>
      </section>

      {/* Latest section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-na-gold">
          Latest from the Archive
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Newest Cards */}
          <div
            className="rounded-2xl border border-na-blue/60 bg-na-surface/90 p-4
                       shadow-[0_0_22px_rgba(15,23,42,0.85)]
                       hover:border-na-cyan hover:shadow-[0_0_30px_rgba(56,189,248,0.45)]
                       transition-all"
          >
            <h3 className="text-sm font-semibold text-slate-50">Newest Cards</h3>
            <p className="mt-1 text-xs text-slate-400">
              Recent additions to the Riftbound card pool.
            </p>

            <div className="mt-4 flex justify-center gap-2">
              {/* Placeholder clickable slots – later these will be real newest cards */}
              <Link
                href="/cards"
                className="h-20 w-14 rounded-lg bg-na-surface-soft/80
                           outline outline-1 outline-na-blue/60
                           hover:outline-na-cyan hover:bg-na-surface-soft
                           transition-all"
              />
              <Link
                href="/cards"
                className="h-20 w-14 rounded-lg bg-na-surface-soft/80
                           outline outline-1 outline-na-blue/60
                           hover:outline-na-cyan hover:bg-na-surface-soft
                           transition-all"
              />
              <Link
                href="/cards"
                className="h-20 w-14 rounded-lg bg-na-surface-soft/80
                           outline outline-1 outline-na-blue/60
                           hover:outline-na-cyan hover:bg-na-surface-soft
                           transition-all"
              />
            </div>

            <Link
              href="/cards"
              className="mt-4 inline-flex text-xs font-medium text-na-cyan hover:text-na-gold transition-colors"
            >
              View Card Gallery →
            </Link>
          </div>

          {/* New Deck Lists */}
          <div
            className="rounded-2xl border border-na-blue/60 bg-na-surface/90 p-4
                       shadow-[0_0_22px_rgba(15,23,42,0.85)]
                       hover:border-na-cyan hover:shadow-[0_0_30px_rgba(56,189,248,0.45)]
                       transition-all"
          >
            <h3 className="text-sm font-semibold text-slate-50">New Deck Lists</h3>
            <p className="mt-1 text-xs text-slate-400">
              Recently added or updated builds.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-100">
                    Sample Aggro List
                  </div>
                  <div className="text-slate-500">Early meta shell</div>
                </div>
                <span className="rounded-full bg-na-emerald/15 px-2 py-1 text-[10px] text-na-emerald">
                  Score 82
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-100">
                    Control Shell (WIP)
                  </div>
                  <div className="text-slate-500">Experimental control build</div>
                </div>
                <span className="rounded-full bg-na-emerald/15 px-2 py-1 text-[10px] text-na-emerald">
                  Score 76
                </span>
              </div>
            </div>

            <Link
              href="/decklists"
              className="mt-4 inline-flex text-xs font-medium text-na-cyan hover:text-na-gold transition-colors"
            >
              Browse Deck Lists →
            </Link>
          </div>

          {/* Latest Article */}
          <div
            className="rounded-2xl border border-na-blue/60 bg-na-surface/90 p-4
                       shadow-[0_0_22px_rgba(15,23,42,0.85)]
                       hover:border-na-cyan hover:shadow-[0_0_30px_rgba(56,189,248,0.45)]
                       transition-all"
          >
            <h3 className="text-sm font-semibold text-slate-50">Latest Article</h3>
            <p className="mt-1 text-xs text-slate-400">
              Meta reports, patch breakdowns, and highlights.
            </p>

            <div className="mt-4 space-y-1 text-xs">
              <div className="font-medium text-slate-100">
                Riftbound Launch: Early Deck Archetypes
              </div>
              <p className="text-slate-500">
                A first look at champions and core shells that might define the
                early Riftbound meta…
              </p>
            </div>

            <Link
              href="/articles"
              className="mt-4 inline-flex text-xs font-medium text-na-cyan hover:text-na-gold transition-colors"
            >
              View Articles →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
