// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="py-0">
      <div className="mx-auto max-w-6xl px-4">
        {/* Invisible H1 for accessibility + SEO */}
        <h1 className="sr-only">
          NexusArchive – all the Riftbound tools you need in one spot.
        </h1>

        {/* HERO */}
        <section className="relative mt-8">
          {/* CONTENT ROW */}
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
            {/* LEFT: wordmark + tagline + search */}
            <div className="flex flex-col items-center lg:items-start">
              {/* Shared container for wordmark + tagline + search */}
              <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
                {/* WORDMARK */}
                <Image
                  src="/Logos/whiteoutlinewordmark.png"
                  alt="NexusArchive wordmark"
                  width={760}
                  height={85}
                  className="block w-full h-auto object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.7)]"
                  priority
                />

                {/* TAGLINE – centered and tightly under wordmark */}
                <p className="mt-3 text-lg sm:text-xl md:text-2xl text-amber-50/95 leading-tight text-center">
                  All the Riftbound tools you need in{" "}
                  <span className="text-[#ffd35a]">one spot.</span>
                </p>

                {/* SEARCH BAR + BUTTON – same width as wordmark */}
                <form action="/cards" className="mt-6 w-full">
                  <div
                    className="
                      mx-auto flex w-full items-center rounded-full
                      border border-white/40 bg-black/55 px-1 py-1
                      shadow-[0_0_32px_rgba(0,0,0,0.8)]
                    "
                  >
                    <input
                      type="search"
                      name="q"
                      autoComplete="off"
                      placeholder="Search the card database..."
                      className="
                        flex-1 rounded-full bg-transparent px-5 py-2.5
                        text-sm text-amber-50 placeholder:text-amber-200/75
                        outline-none
                      "
                    />
                    <button
                      type="submit"
                      className="
                        mr-1 rounded-full px-4 py-2 text-sm font-semibold
                        bg-amber-400/95 text-slate-950
                        shadow-[0_0_18px_rgba(0,0,0,0.7)]
                        transition hover:bg-amber-300
                      "
                    >
                      Search
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT: symbol logo, vertically balanced with hero stack */}
            <div className="relative flex items-center justify-center mt-10 lg:mt-4">
              {/* Soft glow behind dice */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
              </div>

              <div className="relative h-56 w-56 drop-shadow-[0_0_40px_rgba(0,0,0,0.9)] sm:h-64 sm:w-64 lg:h-72 lg:w-72">
                <Image
                  src="/Logos/transparentsymbollogo.png"
                  alt="NexusArchive symbol logo"
                  fill
                  sizes="320px"
                  className="object-contain mix-blend-screen"
                  priority
                />
              </div>
            </div>
          </div>

          {/* BOTTOM TILES – nudged down a bit for nicer framing */}
          <div className="mt-16">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <HeroTile
                href="/cards"
                title="Card Gallery"
                description="Browse every Riftbound card in the archive."
              />
              <HeroTile
                href="/deckbuilder"
                title="Deck Builder"
                description="Plan new decks and tweak your favorite lists."
              />
              <HeroTile
                href="/combos"
                title="Combo Finder"
                description="Hunt for synergies, combos, and spicy interactions."
              />
              <HeroTile
                href="/decklists"
                title="Deck Lists"
                description="Curated decks, meta shells, and experiments."
              />
              <HeroTile
                href="/rules"
                title="Game Rules"
                description="Quick access to core rules and references."
              />
            </div>
          </div>
        </section>

        {/* LATEST SECTION */}
        <section className="mt-44 space-y-4">
          <h2 className="text-lg font-semibold text-amber-200">
            Latest from the Archive
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Newest Cards */}
            <div className="rounded-2xl border border-white/30 bg-black/55 p-4 shadow-[0_0_25px_rgba(15,23,42,0.85)]">
              <h3 className="text-sm font-semibold text-amber-200">Newest Cards</h3>
              <p className="mt-1 text-xs text-amber-50/80">
                Recent additions to the Riftbound card pool.
              </p>

              <div className="mt-4 flex gap-2">
                <div className="h-20 flex-1 rounded-xl bg-slate-900/80 ring-1 ring-white/30" />
                <div className="h-20 flex-1 rounded-xl bg-slate-900/80 ring-1 ring-white/30" />
                <div className="h-20 flex-1 rounded-xl bg-slate-900/80 ring-1 ring-white/30" />
              </div>

              <Link
                href="/cards"
                className="mt-4 inline-flex text-xs font-medium text-amber-200 transition-colors hover:text-white"
              >
                View Card Gallery →
              </Link>
            </div>

            {/* New Deck Lists */}
            <div className="rounded-2xl border border-white/30 bg-black/55 p-4 shadow-[0_0_25px_rgba(15,23,42,0.85)]">
              <h3 className="text-sm font-semibold text-amber-200">New Deck Lists</h3>
              <p className="mt-1 text-xs text-amber-50/80">
                Recently added or updated builds.
              </p>

              <div className="mt-4 space-y-2 text-xs text-amber-50/90">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">
                      Sample Aggro List
                    </div>
                    <p className="text-[11px] text-amber-50/80">
                      Early meta shell
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-200">
                    Score 82
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">
                      Control Shell (WIP)
                    </div>
                    <p className="text-[11px] text-amber-50/80">
                      Experimental control build
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-100">
                    Score 76
                  </span>
                </div>
              </div>

              <Link
                href="/decklists"
                className="mt-4 inline-flex text-xs font-medium text-emerald-200 transition-colors hover:text-white"
              >
                Browse Deck Lists →
              </Link>
            </div>

            {/* Latest Article */}
            <div className="rounded-2xl border border-white/30 bg-black/60 p-4 shadow-[0_0_25px_rgba(15,23,42,0.9)]">
              <h3 className="text-sm font-semibold text-amber-200">Latest Article</h3>
              <p className="mt-1 text-xs text-amber-50/80">
                Meta reports, patch breakdowns, and highlights.
              </p>

              <div className="mt-4 space-y-1 text-xs text-amber-50/90">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-200">
                  Featured
                </div>
                <div className="font-medium text-white">
                  Riftbound Launch: Early Deck Archetypes
                </div>
                <p className="text-[11px] text-amber-50/80">
                  A first look at champions and shells that might define early
                  Riftbound meta.
                </p>
              </div>

              <Link
                href="/articles"
                className="mt-4 inline-flex text-xs font-medium text-amber-200 transition-colors hover:text-white"
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

type HeroTileProps = {
  href: string;
  title: string;
  description: string;
};

function HeroTile({ href, title, description }: HeroTileProps) {
  return (
    <Link
      href={href}
      className="
        flex flex-col justify-between rounded-2xl border border-white/35
        bg-black/55 px-4 py-3 text-left text-amber-50
        shadow-[0_0_22px_rgba(0,0,0,0.55)]
        transition-transform transition-shadow hover:-translate-y-1
        hover:shadow-[0_0_30px_rgba(0,0,0,0.85)]
      "
    >
      <div className="text-base font-semibold text-amber-200">
        {title}
      </div>

      <p className="mt-2 text-xs text-amber-100/85">
        {description}
      </p>
    </Link>
  );
}
