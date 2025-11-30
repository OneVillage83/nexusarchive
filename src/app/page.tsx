import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero section */}
      <section className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold sm:text-5xl">
            The Nexus for Riftbound cards, decks, and combos.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Search every card, build and share decks, discover powerful combos,
            and track TCGplayer market prices — a nexus for Riftbound players.
          </p>
        </div>

        {/* Search form → /cards?q=... */}
        <form action="/cards" method="GET" className="flex max-w-xl gap-2">
          <input
            type="search"
            name="q"
            placeholder="Try searching for a card name, champion, or keyword…"
            className="h-11 flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="h-11 rounded-md bg-emerald-500 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <span>Open tools:</span>
          <Link
            href="/deckbuilder"
            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-300 hover:bg-emerald-500/20"
          >
            Open Deck Builder
          </Link>
          <Link
            href="/cards"
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 hover:border-emerald-400 hover:text-emerald-300"
          >
            Browse Card Gallery
          </Link>
          <Link
            href="/combos"
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 hover:border-emerald-400 hover:text-emerald-300"
          >
            Explore Combo Finder
          </Link>
        </div>
      </section>

      {/* Latest section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Latest from the Archive</h2>
          <span className="text-xs text-slate-500">
            New cards, decks, and articles added over time.
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Newest Cards */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold">Newest Cards</h3>
            <p className="mt-1 text-xs text-slate-400">
              Recent additions to the Riftbound card pool.
            </p>

            <div className="mt-4 flex gap-2">
              <div className="h-20 w-14 rounded-md bg-slate-800" />
              <div className="h-20 w-14 rounded-md bg-slate-800" />
              <div className="h-20 w-14 rounded-md bg-slate-800" />
            </div>

            <Link
              href="/cards"
              className="mt-4 inline-flex text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              View Card Gallery →
            </Link>
          </div>

          {/* New Deck Lists */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold">New Deck Lists</h3>
            <p className="mt-1 text-xs text-slate-400">
              Recently added or updated builds.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-100">
                    Sample Aggro List
                  </div>
                  <div className="text-slate-500">
                    Riftbound early meta shell
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">
                  Score 82
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-100">
                    Control Shell (WIP)
                  </div>
                  <div className="text-slate-500">
                    Experimental late-game control build
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">
                  Score 76
                </span>
              </div>
            </div>

            <Link
              href="/decklists"
              className="mt-4 inline-flex text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              Browse Deck Lists →
            </Link>
          </div>

          {/* Latest Article */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold">Latest Article</h3>
            <p className="mt-1 text-xs text-slate-400">
              Meta reports, patch breakdowns, and card highlights.
            </p>

            <div className="mt-4 space-y-1 text-xs">
              <div className="font-medium text-slate-100">
                Riftbound Launch: Early Deck Archetypes
              </div>
              <p className="text-slate-500">
                A first look at the most promising champions and core shells
                emerging from the early Riftbound meta…
              </p>
            </div>

            <Link
              href="/articles"
              className="mt-4 inline-flex text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              View Articles →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
