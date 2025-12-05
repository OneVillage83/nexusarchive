// src/app/combo/page.tsx

import Link from "next/link";

const PANEL =
  "rounded-2xl border border-white/25 bg-black/75 shadow-[0_0_40px_rgba(0,0,0,0.95)] p-4 sm:p-5";
const LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-amber-100/80";
const INPUT =
  "mt-1 w-full rounded-md border border-white/25 bg-black/60 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-300/80";

const DOMAIN_ORDER = ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"];

// Static mock combos just to show layout; replace with real data later
const MOCK_COMBOS = [
  {
    id: "combo-1",
    name: "Flame Chain – Fury Burn Loop",
    tags: ["Fury", "Burn", "Tempo"],
    outcome: "Chunk the enemy down from mid–high life with repeatable burn.",
    coreCards: ["Flame Initiate", "Mindstorm Bolt", "Any cheap Fury unit"],
    steps: [
      "Establish an early Fury board with low-cost units.",
      "Use burn spells to clear blockers while pushing face damage.",
      "Loop cheap spells or effects that recur burn or double damage.",
    ],
  },
  {
    id: "combo-2",
    name: "Mindlock – Soft Control Shell",
    tags: ["Mind", "Control", "Lock"],
    outcome:
      "Deny opponent plays for several turns while you assemble a win condition.",
    coreCards: ["Mindstorm Bolt", "Stun / Freeze effects", "Card draw engines"],
    steps: [
      "Stall the board with stuns, freezes, and temporary removal.",
      "Chain draw effects to keep your hand full of interaction.",
      "Transition into a finisher (big Mind unit, burn, or inevitability engine).",
    ],
  },
  {
    id: "combo-3",
    name: "Body + Calm – Stabilize and Outscale",
    tags: ["Body", "Calm", "Lifegain", "Midrange"],
    outcome:
      "Stabilize against aggression, then win through bigger units and sustained value.",
    coreCards: ["Bulky Body frontliners", "Calm support / healers", "Card advantage tools"],
    steps: [
      "Deploy high-HP Body units to stop early pressure.",
      "Layer Calm effects to heal, buff, or recycle key pieces.",
      "Snowball advantage with repeatable value and bigger boards each turn.",
    ],
  },
];

export default function ComboFinderPage() {
  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl px-4 space-y-6 sm:space-y-8">
        {/* Hero header */}
        <section
          className="
            rounded-3xl border border-white/25
            bg-[radial-gradient(circle_at_top,#020617,#020617_40%,#020617_70%,#020617_100%)]
            px-5 py-5 sm:px-8 sm:py-7
            shadow-[0_0_50px_rgba(0,0,0,0.95)]
          "
        >
          <h1 className="text-2xl sm:text-3xl font-semibold text-amber-50 mb-2">
            Combo & Synergy Finder
          </h1>
          <p className="max-w-3xl text-sm text-amber-50/85">
            Search powerful Riftbound combos by specific cards, domains, or goals
            like “infinite value”, “OTK”, or “lock”. Each combo will show its
            core pieces, steps, and decks that use it once the live data is wired
            in.
          </p>

          <div className="mt-4 rounded-2xl border border-sky-200/35 bg-sky-950/60 px-4 py-3 text-xs text-sky-50/85">
            <p>
              <span className="font-semibold text-sky-100">How this will work:</span>{" "}
              You&apos;ll be able to filter combos by involved cards, domains,
              synergy type, and desired outcome. This page is already laid out for
              that — we just need to plug in the real Riftbound combo dataset or
              community-submitted lists.
            </p>
          </div>
        </section>

        {/* 🔮 Riot-style API waiting message with rift flicker */}
        <div
          className="
            rift-flicker
            mt-1 rounded-xl border border-amber-300/30 bg-black/55
            px-4 py-3 text-[12px] text-amber-100/85 shadow-[0_0_15px_rgba(0,0,0,0.6)]
          "
        >
          <p>
            <span className="font-semibold text-amber-200">Developer Note:</span>{" "}
            This is the combo finder&apos;s skeleton crew. Once Riot opens the
            Riftbound data gates (or the community seeds the NexusArchive combo
            list), this scaffolding will start surfacing real, game-winning
            synergies instead of mock examples.
          </p>
        </div>

        {/* Main layout: filters + results */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] xl:gap-5">
          {/* LEFT: Combo search & filters */}
          <div className={PANEL}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-amber-200">
                  Search & filters
                </h2>
                <p className="text-[11px] text-amber-100/70">
                  Build the query — card names, domains, and what you want the
                  combo to do.
                </p>
              </div>
            </div>

            {/* For now this is just a layout form; later we can wire it to query params / API */}
            <form className="space-y-4">
              {/* Search text */}
              <div>
                <label className={LABEL} htmlFor="combo-search">
                  Search text
                </label>
                <input
                  id="combo-search"
                  name="q"
                  type="text"
                  placeholder='e.g. "Flame combo", "infinite", "Mind lock"'
                  className={INPUT}
                />
              </div>

              {/* Involved cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL} htmlFor="include-cards">
                    Include cards
                  </label>
                  <input
                    id="include-cards"
                    name="includeCards"
                    type="text"
                    placeholder='Card names, comma separated – e.g. "Flame Initiate, Mindstorm Bolt"'
                    className={INPUT}
                  />
                  <p className="mt-1 text-[11px] text-amber-100/70">
                    Only show combos that contain at least one of these cards.
                  </p>
                </div>

                <div>
                  <label className={LABEL} htmlFor="exclude-cards">
                    Exclude cards
                  </label>
                  <input
                    id="exclude-cards"
                    name="excludeCards"
                    type="text"
                    placeholder='e.g. "Legendary only", "no Fury cards"'
                    className={INPUT}
                  />
                  <p className="mt-1 text-[11px] text-amber-100/70">
                    Later, this can filter out combos that rely on cards you
                    don&apos;t own or dislike.
                  </p>
                </div>
              </div>

              {/* Domains */}
              <div>
                <div className={LABEL}>Domains</div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  {DOMAIN_ORDER.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className="
                        rounded-full border border-white/30 bg-black/45
                        px-3 py-1 text-amber-50/85
                        hover:bg-white/5
                      "
                    >
                      {d}
                    </button>
                  ))}
                  <span className="ml-1 text-[10px] text-amber-100/60">
                    (Filtering will become interactive once we hook into real
                    combo data.)
                  </span>
                </div>
              </div>

              {/* Synergy goals */}
              <div>
                <div className={LABEL}>Synergy type / goal</div>
                <div className="mt-2 grid gap-1.5 text-[11px] text-amber-50/85 sm:grid-cols-2">
                  {[
                    "Aggro burn / face damage",
                    "Board control / lock",
                    "Infinite or loop combo",
                    "Card draw / hand refill",
                    "Mana / cost cheating",
                    "Stabilize vs aggro",
                    "OTK (one-turn kill) setups",
                    "Value engines / grind",
                  ].map((label) => (
                    <label
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 border border-white/25"
                    >
                      <input
                        type="checkbox"
                        className="h-3 w-3 rounded border-white/40 bg-black/70"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Outcome description (free text) */}
              <div>
                <label className={LABEL} htmlFor="outcome">
                  Desired outcome
                </label>
                <input
                  id="outcome"
                  name="outcome"
                  type="text"
                  placeholder='e.g. "lock opponent out", "win by turn 6", "refill my hand every turn"'
                  className={INPUT}
                />
              </div>

              {/* Submit row (scaffolding only – no actual wiring yet) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-amber-100/70">
                  Filters are scaffolding only for now — once the combo dataset
                  is live, this form can drive real search queries.
                </span>
                <button
                  type="button"
                  className="
                    inline-flex items-center justify-center rounded-full
                    bg-amber-400/95 px-4 py-1.5 text-xs font-semibold
                    text-slate-950 shadow-[0_0_18px_rgba(0,0,0,0.9)]
                    transition hover:bg-amber-300
                  "
                >
                  (Future) Search combos
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: Combo results & layout preview */}
          <div className={PANEL}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-amber-200">
                  Combo results (layout preview)
                </h2>
                <p className="text-[11px] text-amber-100/70">
                  Rendered as expandable cards with tags, outcome summaries, and
                  step-by-step instructions.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {MOCK_COMBOS.map((combo) => (
                <article
                  key={combo.id}
                  className="
                    rounded-2xl border border-white/20 bg-black/60
                    px-4 py-3 text-xs text-amber-50
                  "
                >
                  <header className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-amber-50">
                        {combo.name}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-amber-100/75">
                        {combo.outcome}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {combo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-amber-300/50 bg-black/60 px-2 py-[2px] text-amber-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </header>

                  <div className="mt-2 space-y-1.5">
                    <div>
                      <div className={LABEL}>Core cards</div>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-amber-100/85">
                        {combo.coreCards.map((card) => (
                          <span
                            key={card}
                            className="rounded-full bg-slate-900/70 px-2 py-[2px] border border-white/15"
                          >
                            {card}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className={LABEL}>How it works</div>
                      <ol className="mt-1 list-decimal list-inside space-y-1 text-[11px] text-amber-100/80">
                        {combo.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <footer className="mt-2 flex flex-wrap justify-between gap-2 text-[10px] text-amber-100/70">
                    <span>
                      Later: link to decks using this combo, estimated winrate,
                      and tags for formats.
                    </span>
                    <button
                      type="button"
                      className="
                        inline-flex items-center justify-center rounded-full
                        border border-white/35 bg-black/60 px-3 py-1
                        text-[10px] font-medium text-amber-50
                        shadow-[0_0_14px_rgba(0,0,0,0.7)]
                        transition hover:bg-white/5
                      "
                    >
                      (Future) Open in Deck Builder
                    </button>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Back link */}
        <div className="pt-2">
          <Link
            href="/cards"
            className="text-xs font-medium text-amber-200 hover:text-white"
          >
            ← Back to Card Gallery
          </Link>
        </div>
      </div>
    </main>
  );
}
