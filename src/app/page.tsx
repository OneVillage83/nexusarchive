import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      {/* Painterly / Arcane-ish background shapes */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute right-[-6rem] top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-[-10rem] h-72 bg-gradient-to-t from-amber-500/18 via-transparent to-transparent blur-2xl" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-10">
        {/* HERO */}
        <section className="grid items-center gap-10 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          {/* Left: text + search */}
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-wide text-amber-200/90 shadow-[0_0_18px_rgba(250,204,21,0.35)]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              NexusArchive · Riftbound toolkit
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                NexusArchive – all the Riftbound tools you need
                <span className="text-amber-300"> in one spot.</span>
              </h1>

              <p className="text-sm text-slate-200/80 sm:text-base">
                Search cards, explore combos, and brew decks with a
                fan-made Archive inspired by Piltover’s brightest minds.
              </p>
            </div>

            {/* Search form → /cards?q=... */}
            <form
              action="/cards"
              method="GET"
              className="mx-auto flex max-w-xl items-stretch gap-3 rounded-full bg-black/50 p-2 shadow-[0_0_40px_rgba(15,23,42,0.9)] backdrop-blur"
            >
              <input
                type="search"
                name="q"
                placeholder="Search for a card, champion, or keyword..."
                className="h-11 flex-1 rounded-full bg-transparent px-4 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="h-11 rounded-full bg-amber-400 px-6 text-sm font-semibold text-slate-950 shadow-[0_0_22px_rgba(250,204,21,0.6)] transition-glow hover:bg-amber-300 hover:shadow-[0_0_30px_rgba(250,204,21,0.85)]"
              >
                Search
              </button>
            </form>

            {/* Quick links */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 md:justify-start">
              <span className="text-na-cyan/80">Jump to:</span>

              <Link
                href="/deckbuilder"
                className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-slate-200 hover:border-amber-300/70 hover:text-amber-200 transition-colors"
              >
                Deck Builder
              </Link>

              <Link
                href="/cards"
                className="rounded-full border border-na-blue/70 bg-na-surface-soft px-3 py-1 text-slate-200 hover:border-na-cyan hover:text-na-cyan transition-colors"
              >
                Card Gallery
              </Link>

              <Link
                href="/combos"
                className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-slate-200 hover:border-emerald-300/80 hover:text-emerald-200 transition-colors"
              >
                Combo Finder
              </Link>
            </div>
          </div>

          {/* Right: glowing logo / art panel */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-amber-400/25 via-emerald-400/15 to-sky-500/25 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-amber-300/40 bg-black/60 p-6 shadow-[0_0_55px_rgba(15,23,42,0.95)]">
              <div className="relative mx-auto aspect-square max-w-[260px]">
                <Image
                  src="/Logos/nexusarchivelogo.png"
                  alt="NexusArchive arcane logo"
                  fill
                  sizes="260px"
                  className="object-contain drop-shadow-[0_0_30px_rgba(250,204,21,0.75)]"
                />
              </div>
              <p className="mt-4 text-center text-xs text-slate-300">
                Fan-made archive. Not endorsed by Riot Games or the Riftbound
                team.
              </p>
            </div>
          </div>
        </section>

        {/* LATEST FROM THE ARCHIVE */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-amber-300">
            Latest from the Archive
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Newest Cards */}
            <div className="rounded-2xl border border-sky-500/30 bg-black/55 p-4 shadow-[0_0_25px_rgba(15,23,42,0.85)]">
              <h3 className="text-sm font-semibold text-slate-50">
                Newest Cards
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Recent additions to the Riftbound card pool.
              </p>

              <div className="mt-4 flex gap-2">
                <div className="h-20 flex-1 rounded-xl bg-slate-900/80 ring-1 ring-sky-500/30" />
                <div className="h-20 flex-1 rounded-xl bg-slate-900/80 ring-1 ring-sky-500/30" />
                <div className="h-20 flex-1 rounded-xl bg-slate-900/80 ring-1 ring-sky-500/30" />
              </div>

              <Link
                href="/cards"
                className="mt-4 inline-flex text-xs font-medium text-na-cyan hover:text-amber-300 transition-colors"
              >
                View Card Gallery →
              </Link>
            </div>

            {/* New Deck Lists */}
            <div className="rounded-2xl border border-emerald-500/25 bg-black/55 p-4 shadow-[0_0_25px_rgba(15,23,42,0.85)]">
              <h3 className="text-sm font-semibold text-slate-50">
                New Deck Lists
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Recently added or updated builds.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-100">
                      Sample Aggro List
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Early meta shell
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">
                    Score 82
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-100">
                      Control Shell (WIP)
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Experimental control build
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">
                    Score 76
                  </span>
                </div>
              </div>

              <Link
                href="/decklists"
                className="mt-4 inline-flex text-xs font-medium text-emerald-300 hover:text-amber-300 transition-colors"
              >
                Browse Deck Lists →
              </Link>
            </div>

            {/* Latest Article */}
            <div className="rounded-2xl border border-amber-400/30 bg-black/60 p-4 shadow-[0_0_25px_rgba(15,23,42,0.9)]">
              <h3 className="text-sm font-semibold text-slate-50">
                Latest Article
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Meta reports, patch breakdowns, and highlights.
              </p>

              <div className="mt-4 space-y-1 text-xs">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300/80">
                  Featured
                </div>
                <div className="font-medium text-slate-50">
                  Riftbound Launch: Early Deck Archetypes
                </div>
                <p className="text-[11px] text-slate-400">
                  A first look at champions and shells that might define
                  early Riftbound meta.
                </p>
              </div>

              <Link
                href="/articles"
                className="mt-4 inline-flex text-xs font-medium text-amber-300 hover:text-na-cyan transition-colors"
              >
                View Articles →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
