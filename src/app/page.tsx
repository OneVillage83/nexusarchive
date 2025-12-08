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
        <section className="relative mt-6">
          <div className="mt-16 grid items-center gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
            {/* LEFT: wordmark + tagline + search + pills */}
            <div className="flex flex-col items-center text-center lg:items-center lg:text-center">
              {/* Wordmark + centered tagline */}
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

                {/* TAGLINE – centered under wordmark & search */}
                <p className="mt-3 text-lg sm:text-xl md:text-2xl text-amber-50/90 leading-tight text-center">
                  All the Riftbound tools you need in{" "}
                  <span className="text-[#ffd35a]">one spot.</span>
                </p>
              </div>

              {/* SEARCH BAR + BUTTON */}
              <form action="/cards" className="mt-6 w-full max-w-3xl">
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
                    placeholder='Search by card name, keyword, or wild idea... try “burn everything”, “token swarm”, “greedy control”…'
                    className="
                      flex-1 rounded-full bg-transparent px-4 sm:px-5 py-2.5
                      text-xs sm:text-sm text-amber-50 placeholder:text-amber-200/75
                      outline-none
                    "
                  />
                  <button
                    type="submit"
                    className="
                      mr-1 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold
                      bg-amber-400/95 text-slate-950
                      shadow-[0_0_18px_rgba(0,0,0,0.7)]
                      transition hover:bg-amber-300
                    "
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* ACTION PILLS ROW – Random / Advanced / New Patch */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
                {/* Random card (dummy) */}
                <button
                  type="button"
                  className="
                    inline-flex items-center gap-2 rounded-full
                    bg-black/55 px-3 py-1.5
                    text-[11px] font-medium text-amber-50
                    border border-white/25
                    shadow-[0_0_10px_rgba(0,0,0,0.6)]
                    transition hover:bg-amber-400/90 hover:text-slate-950
                    hover:shadow-[0_0_22px_rgba(246,191,38,0.85)]
                  "
                >
                  <span className="text-[10px]">🎲</span>
                  Random card
                </button>

                {/* Advanced search */}
                <Link
                  href="/cards/advanced"
                  className="
                    inline-flex items-center gap-2 rounded-full
                    bg-black/55 px-3 py-1.5
                    text-[11px] font-medium text-amber-50
                    border border-white/25
                    shadow-[0_0_10px_rgba(0,0,0,0.6)]
                    transition hover:bg-amber-400/90 hover:text-slate-950
                    hover:shadow-[0_0_22px_rgba(246,191,38,0.85)]
                  "
                >
                  <span className="text-[11px]">🔍</span>
                  Advanced search
                </Link>

                {/* NEW PATCH HIGHLIGHTS – same gold hover treatment */}
                <Link
                  href="/articles"
                  className="
                    inline-flex items-center gap-2 rounded-full
                    bg-black/55 px-3 py-1.5
                    text-[11px] font-medium text-amber-50
                    border border-white/25
                    shadow-[0_0_10px_rgba(0,0,0,0.6)]
                    transition hover:bg-amber-400/90 hover:text-slate-950
                    hover:shadow-[0_0_22px_rgba(246,191,38,0.85)]
                  "
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
                  <span className="uppercase tracking-wide">
                    New patch highlights
                  </span>
                  <span className="text-[10px] font-semibold">VIEW →</span>
                </Link>
              </div>

              {/* Tiny helper line under pills */}
              <p className="mt-2 text-[11px] text-amber-100/80 tracking-wide text-center">
                Tip: Use card names, keywords, or vibes — “barrier”, “burn”,
                “token swarm”, “greedy control”.
              </p>
            </div>

            {/* RIGHT: dice / symbol logo */}
            <div className="relative flex items-center justify-center">
              {/* Soft glow behind dice */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
              </div>

              <div className="relative h-56 w-56 sm:h-64 sm:w-64 lg:h-72 lg:w-72 drop-shadow-[0_0_40px_rgba(0,0,0,0.9)]">
                <Image
                  src="/Logos/transparentsymbollogo.png"
                  alt="NexusArchive symbol logo"
                  fill
                  sizes="(max-width: 640px) 224px, (max-width: 1024px) 256px, 288px"
                  className="object-contain mix-blend-screen animate-dice-float"
                  priority
                />
              </div>
            </div>
          </div>

          {/* BOTTOM TILES – pushed further down so Latest is below the fold */}
          <div className="mt-28 sm:mt-32 lg:mt-36 hidden lg:block">
            <div className="grid gap-4 lg:grid-cols-6">
              <HeroTile
                href="/cards"
                title="Card Gallery"
                description="Browse every Riftbound card in the Nexus Archive."
              />
              <HeroTile
                href="/deckbuilder"
                title="Deck Builder"
                description="Plan new decks and tweak your favorite lists."
              />
              <HeroTile
                href="/combos"
                title="Synergy & Combo Finder"
                description="Hunt for synergies, combos, and spicy interactions."
              />
              <HeroTile
                href="/decklists"
                title="Deck Lists"
                description="Curated decks, meta shells, and experiments."
              />
              <HeroTile
                href="/collection"
                title="Collection"
                description="Track your real collection and see what it's worth."
              />
              <HeroTile
                href="/rules"
                title="Game Rules"
                description="Ask the archive. Any ruling, any nuance, answered on the spot."
              />
            </div>
          </div>
        </section>

        {/* LATEST SECTION */}
        <section className="mt-10 md:mt-16 lg:mt-34 space-y-4">
          <h2 className="text-lg font-semibold text-amber-200">
            Latest from the Archive
          </h2>

          {/* now 4 tiles, so adjust grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

            {/* New Deck Lists (scores removed) */}
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
                </div>
              </div>

              <Link
                href="/decklists"
                className="mt-4 inline-flex text-xs font-medium text-amber-200 transition-colors hover:text-white"
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

            {/* LM Rules Judge tile */}
        <div className="rounded-2xl border border-white/30 bg-black/60 p-4 shadow-[0_0_25px_rgba(15,23,42,0.9)]">
        <h3 className="text-sm font-semibold text-amber-200">
        LM Rules Judge
        </h3>

        <p className="mt-1 text-xs text-amber-50/85">
        Ask natural-language rules questions — timing, priority, digital quirks,
        and unexpected interactions — all grounded in the Riftbound rulebook.
        </p>

         <ul className="mt-3 space-y-1 text-[11px] text-amber-50/80">
          <li>“If a card creates temporary mana, do I lose it at the end of the round?”</li>
          <li>“If a unit is stunned during its attack, does it still strike?”</li>
          <li>“If I kill a unit that’s targeting something, does the ability still resolve?”</li>
          </ul>
           <Link
             href="/rules"
             className="mt-4 inline-flex text-xs font-medium text-amber-200 transition-colors hover:text-white"
            >
             Open Rules Judge →
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
        flex flex-col rounded-2xl border border-white/35
        bg-black/55 px-4 py-3 text-left text-amber-50
        shadow-[0_0_22px_rgba(0,0,0,0.55)]
        transition-transform transition-shadow
        hover:-translate-y-1
        hover:shadow-[0_0_30px_rgba(246,191,38,0.75)]
      "
    >
      {/* Title – tightened spacing, better vertical alignment */}
      <div className="text-base font-semibold text-amber-200 leading-tight">
        {title}
      </div>

      {/* Description – reduced top spacing + tighter line height */}
      <p className="mt-1.5 text-xs text-amber-100/85 leading-snug">
        {description}
      </p>
    </Link>
  );
}
