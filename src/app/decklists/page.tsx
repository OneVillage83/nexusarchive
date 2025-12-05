// src/app/decklists/page.tsx
import Link from "next/link";

const PANEL =
  "rounded-2xl border border-white/25 bg-black/75 shadow-[0_0_40px_rgba(0,0,0,0.95)] p-4 sm:p-5";

export default function DeckListsPage() {
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
            Deck Lists
          </h1>
          <p className="max-w-3xl text-sm text-amber-50/85">
            Browse Riftbound deck lists ranked by NexusArchive deck score. In the
            full version you&apos;ll be able to filter by champion, domain mix,
            archetype, budget, format, and tags like &quot;aggro&quot;,
            &quot;control&quot;, and &quot;ladder&quot;.
          </p>

          <div className="mt-4 rounded-2xl border border-sky-200/35 bg-sky-950/60 px-4 py-3 text-xs text-sky-50/85">
            <p>
              <span className="font-semibold text-sky-100">Planned features:</span>{" "}
              sortable deck tables, quick filters, winrate / popularity badges,
              and direct links to open a list in the NexusArchive Deck Builder.
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
            This is the deck list scaffolding. Once Riftbound deck data (and
            community submissions) are wired in, this page will promote real
            lists with scores, tags, and links straight into the deck builder —
            not just this lonely placeholder panel.
          </p>
        </div>

        {/* Deck list scaffolding panel */}
        <section className={PANEL}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-amber-200">
                Deck list table / grid (preview)
              </h2>
              <p className="text-[11px] text-amber-100/70">
                This will render a sortable deck table with filters and score
                badges once the data layer is connected.
              </p>
            </div>
          </div>

          {/* Placeholder content showing future layout */}
          <div className="rounded-2xl border border-white/20 bg-black/60 px-4 py-3 text-sm text-amber-100/75">
            <p className="mb-2">
              Imagine a table here with columns like:
            </p>
            <ul className="list-disc list-inside text-[12px] space-y-1">
              <li>Deck name &amp; creator</li>
              <li>Core domains / runes</li>
              <li>Archetype (&quot;Fury Aggro&quot;, &quot;Mind Control&quot;, etc.)</li>
              <li>NexusArchive deck score &amp; popularity</li>
              <li>Format / queue tags</li>
              <li>Buttons: &quot;View list&quot; and &quot;Open in Deck Builder&quot;</li>
            </ul>
          </div>
        </section>

        {/* Back link */}
        <div className="pt-2">
          <Link
            href="/deckbuilder"
            className="text-xs font-medium text-amber-200 hover:text-white"
          >
            ← Go to Deck Builder
          </Link>
        </div>
      </div>
    </main>
  );
}
