// src/app/cards/advanced/page.tsx
import Link from "next/link";
import Image from "next/image";

const PANEL =
  "rounded-2xl border border-white/25 bg-black/65 shadow-[0_0_30px_rgba(0,0,0,0.85)] p-4 sm:p-5";

const LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-amber-100/80";

const INPUT =
  "mt-1 w-full rounded-md border border-white/25 bg-black/60 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-300/80";

const SELECT =
  "mt-1 w-full rounded-md border border-white/25 bg-black/60 px-3 py-2 text-sm text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-300/80";

const CHECKBOX_ROW =
  "flex flex-wrap gap-2 mt-2 text-[11px] text-amber-50/85";

// 🔮 Domain rune metadata – update icon paths to your real files
const DOMAIN_RUNES = [
  { id: "Fury", label: "Fury", colorLabel: "Red", icon: "/runes/fury.png" },
  { id: "Calm", label: "Calm", colorLabel: "Green", icon: "/runes/calm.png" },
  { id: "Mind", label: "Mind", colorLabel: "Blue", icon: "/runes/mind.png" },
  { id: "Body", label: "Body", colorLabel: "Brown", icon: "/runes/body.png" },
  { id: "Chaos", label: "Chaos", colorLabel: "Purple", icon: "/runes/chaos.png" },
  { id: "Order", label: "Order", colorLabel: "Yellow", icon: "/runes/order.png" },
];

export default function AdvancedCardSearchPage() {
  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl px-4 space-y-6 sm:space-y-8">
        {/* Header */}
        <header className="space-y-2 sm:space-y-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-amber-100 drop-shadow-[0_0_18px_rgba(0,0,0,0.9)]">
            Advanced card search
          </h1>
          <p className="max-w-3xl text-sm text-amber-50/85">
            Tap directly into the Riftbound Nexus matrix and dial in filters like a ranked sweat. 
            Every field hooks into real card data — name, regions, cost, stats, Domains, sets, 
            and more — letting you surface sleeper picks, curve perfection, or that one 
            cursed combo piece nobody respects… yet.
          </p>
        </header>

        {/* FORM */}
        {/* This sends a GET request to /cards with all selected filters. */}
        <form
          id="advanced-card-search"
          action="/cards"
          method="GET"
          className="space-y-6 sm:space-y-8"
        >
          {/* 1. Keywords & tags (moved to top) */}
          <section className={`${PANEL} space-y-4`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-amber-200">
                Keywords & tags
              </h2>
              <span className="text-[11px] text-amber-100/75">
                These map directly to Riftbound&apos;s keyword and tag arrays
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="keywords">
                  Keywords (include)
                </label>
                <input
                  id="keywords"
                  name="keywords"
                  type="text"
                  placeholder='Comma separated, e.g. "Poro, Champion"'
                  className={INPUT}
                />
                <p className="mt-1 text-[11px] text-amber-100/70">
                  Matches cards whose <code>keywords</code> list contains{" "}
                  <strong>any</strong> of these.
                </p>
              </div>

              <div>
                <label className={LABEL} htmlFor="tags">
                  Tags (include)
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  placeholder='Comma separated, e.g. "Token, Starter"'
                  className={INPUT}
                />
                <p className="mt-1 text-[11px] text-amber-100/70">
                  Matches cards whose <code>tags</code> list contains{" "}
                  <strong>any</strong> of these.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Card type, Domain, set & regions */}
          <section className={`${PANEL} space-y-4`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-amber-200">
                Card type, Domain, set & regions
              </h2>
              <span className="text-[11px] text-amber-100/75">
                Card type, Domain, set, rarity, and Runeterra regions
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Type */}
              <div>
                <label className={LABEL} htmlFor="type">
                  Card type
                </label>
                <input
                  id="type"
                  name="type"
                  type="text"
                  placeholder='e.g. "Unit", "Spell", "Gear"'
                  className={INPUT}
                />
              </div>

              {/* Domains (runes hidden until assets ready) */}
              <div className="sm:col-span-2">
                <label className={LABEL}>Domains</label>
                <div className={CHECKBOX_ROW}>
                  {DOMAIN_RUNES.map((domain) => (
                    <label
                      key={domain.id}
                      className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5"
                    >
                      <input
                        type="checkbox"
                        name="domain"
                        value={domain.id}
                        className="h-3 w-3 rounded border-white/40 bg-black/70"
                      />

                      {/* 🔒 Icons hidden until real Rune symbols are added */}
                      {/* <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70">
                          <Image src={domain.icon} alt={`${domain.label} rune`} width={20} height={20} />
                        </span> */}

                      <span className="text-[11px] text-amber-50/90">
                        {domain.label}{" "}
                        <span className="text-amber-200/80">
                          ({domain.colorLabel})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rarity */}
              <div>
                <label className={LABEL} htmlFor="rarity">
                  Rarity
                </label>
                <input
                  id="rarity"
                  name="rarity"
                  type="text"
                  placeholder='e.g. "Common", "Rare", "Epic", "Alt Art"'
                  className={INPUT}
                />
              </div>

              {/* Set name (optional, convenience) */}
              <div>
                <label className={LABEL} htmlFor="setName">
                  Set name
                </label>
                <input
                  id="setName"
                  name="setName"
                  type="text"
                  placeholder='e.g. "Origins"'
                  className={INPUT}
                />
              </div>
            </div>

            {/* Regions checklist (kept) */}
            <div>
              <label className={LABEL}>Regions</label>
              <div className={CHECKBOX_ROW}>
                {[
                  "Demacia",
                  "Noxus",
                  "Ionia",
                  "Piltover",
                  "Zaun",
                  "Freljord",
                  "ShadowIsles",
                  "Bilgewater",
                  "Targon",
                  "Shurima",
                  "BandleCity",
                  "Runeterran",
                ].map((r) => (
                  <label
                    key={r}
                    className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      name="regions"
                      value={r}
                      className="h-3 w-3 rounded border-white/40 bg-black/70"
                    />
                    <span className="capitalize">
                      {r === "ShadowIsles"
                        ? "Shadow Isles"
                        : r === "BandleCity"
                        ? "Bandle City"
                        : r}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* 3. Text & identity (moved below Domains) */}
          <section className={`${PANEL} space-y-4`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-amber-200">
                Text & identity
              </h2>
            <span className="text-[11px] text-amber-100/75">
                Card name, IDs, rules text, and flavor
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="name">
                  Card name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder='Any words in the name, e.g. "Flame", "Invoker"'
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL} htmlFor="id">
                  Card ID
                </label>
                <input
                  id="id"
                  name="id"
                  type="text"
                  placeholder="Exact ID, if known"
                  className={INPUT}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="collectorNumber">
                  Collector number
                </label>
                <input
                  id="collectorNumber"
                  name="collectorNumber"
                  type="number"
                  placeholder="e.g. 137"
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL} htmlFor="setText">
                  Rules text
                </label>
                <input
                  id="setText"
                  name="description"
                  type="text"
                  placeholder='Any text in the rules, e.g. "deal 3 damage"'
                  className={INPUT}
                />
              </div>
            </div>

            <div>
              <label className={LABEL} htmlFor="flavorText">
                Flavor text
              </label>
              <input
                id="flavorText"
                name="flavorText"
                type="text"
                placeholder='Any words in the flavor text'
                className={INPUT}
              />
            </div>
          </section>

          {/* 4. Extras & display options (inc. Artist) */}
          <section className={`${PANEL} space-y-4`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-amber-200">
                Extras & display options
              </h2>
              <span className="text-[11px] text-amber-100/75">
                Artist, result ordering, and how to display cards
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Artist */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className={LABEL} htmlFor="artist">
                  Artist name
                </label>
                <input
                  id="artist"
                  name="artist"
                  type="text"
                  placeholder='e.g. "SIXMOREVODKA"'
                  className={INPUT}
                />
              </div>

              {/* Sort */}
<div>
  <label className={LABEL} htmlFor="sort">
    Sort results by
  </label>
  <select id="sort" name="sort" className={SELECT}>
    <option value="name">Card name</option>
    <option value="domain">Domain</option>   {/* <-- Added here */}
    <option value="cost">Cost</option>
    <option value="region">Region</option>
    <option value="type">Card type</option>
    <option value="set">Set / release order</option>
    <option value="rarity">Rarity</option>
  </select>
</div>


              {/* Sort direction */}
              <div>
                <label className={LABEL} htmlFor="order">
                  Sort direction
                </label>
                <select id="order" name="order" className={SELECT}>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>

              {/* View mode */}
              <div>
                <label className={LABEL} htmlFor="view">
                  Display as
                </label>
                <select id="view" name="view" className={SELECT}>
                  <option value="images">Images</option>
                  <option value="text">Text list</option>
                  <option value="table">Table / checklist</option>
                </select>
              </div>
            </div>

            {/* Show alt prints / tokens etc – stub for future */}
            <div className="space-y-2">
              <div className={LABEL}>Extra results</div>
              <div className="space-y-1 text-[11px] text-amber-50/85">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="includeNonPlayable"
                    value="true"
                    className="h-3 w-3 rounded border-white/40 bg-black/70"
                  />
                  <span>Include non-playable / tutorial cards</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="includeTokens"
                    value="true"
                    className="h-3 w-3 rounded border-white/40 bg-black/70"
                  />
                  <span>Include tokens & summoned cards</span>
                </label>
              </div>
            </div>
          </section>
        </form>

        {/* Floating submit bar */}
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-end px-6">
          <div className="w-full max-w-6xl flex justify-end">
            <div
               className="
                         flex flex-wrap items-center justify-center gap-2
                         rounded-full border border-white/35 bg-black/70
                         px-3 py-2 shadow-[0_0_24px_rgba(0,0,0,0.9)]
                         backdrop-blur-md
                        "
                    >

              <button
                type="submit"
                form="advanced-card-search"
                className="
                  inline-flex items-center justify-center rounded-full
                  bg-amber-400/95 px-5 py-2 text-sm font-semibold
                  text-slate-950 shadow-[0_0_24px_rgba(0,0,0,0.9)]
                  transition hover:bg-amber-300
                "
              >
                Search with these options
              </button>

              <button
                type="reset"
                form="advanced-card-search"
                className="
                  inline-flex items-center justify-center rounded-full
                  border border-white/35 bg-black/60 px-4 py-2
                  text-sm font-medium text-amber-50
                  shadow-[0_0_18px_rgba(0,0,0,0.7)]
                  transition hover:bg-white/5
                "
              >
                Clear form
              </button>
            </div>
          </div>
        </div>

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
