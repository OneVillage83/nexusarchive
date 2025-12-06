import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden">
      {/* Arcane-ish background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute right-[-6rem] top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-[-10rem] h-72 bg-gradient-to-t from-amber-500/18 via-transparent to-transparent blur-2xl" />
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10">
        {/* HERO */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-wide text-amber-200/90 shadow-[0_0_18px_rgba(250,204,21,0.35)]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            About / FAQ
          </div>

          <h1 className="text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
            What is&nbsp;
            <span className="text-amber-300">NexusArchive</span>?
          </h1>

          <p className="max-w-2xl text-sm text-slate-200/85 sm:text-base">
            NexusArchive is a fan-made Riftbound toolbox built by one very
            determined human with too many decks and not enough sleep. Think of
            it as a place where all the card text, edge cases, and “wait — does
            this actually work?” questions finally live in the same, nicely
            labeled drawer.
          </p>
        </section>

        {/* SECTIONS */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Card 0 – What is Riftbound? */}
          <div className="rounded-2xl border border-violet-500/35 bg-black/60 p-5 shadow-[0_0_28px_rgba(15,23,42,0.9)]">
            <h2 className="text-sm font-semibold text-violet-200">
              What is Riftbound?
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Riftbound is Riot Games’ strategy card game set in the League of
              Legends universe — champions, spells, and board states colliding
              in a tactical, turn-based brawl.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              NexusArchive simply tracks the cards, keywords, and evolving meta
              so players have a clean place to explore everything.
            </p>
          </div>

          {/* Card 1 – Official? */}
          <div className="rounded-2xl border border-sky-500/35 bg-black/60 p-5 shadow-[0_0_28px_rgba(15,23,42,0.9)]">
            <h2 className="text-sm font-semibold text-amber-200">
              Is this official?
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Nope. This is a{" "}
              <span className="font-semibold text-slate-50">
                100% unofficial fan project
              </span>
              . No secret Riot basement, no balance levers — just public info
              and an absurd amount of time.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              NexusArchive is not endorsed by, affiliated with, maintained,
              authorized, or sponsored by Riot Games, Inc., or any of its
              mysterious council of balance wizards.
            </p>
          </div>

          {/* Card 2 – What does it do? */}
          <div className="rounded-2xl border border-emerald-500/35 bg-black/60 p-5 shadow-[0_0_28px_rgba(15,23,42,0.9)]">
            <h2 className="text-sm font-semibold text-emerald-200">
              So what <em>does</em> it do?
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              The mission is simple: bring{" "}
              <span className="font-semibold text-slate-50">
                every Riftbound card, deck, and combo
              </span>{" "}
              into one clean, searchable place — with tools that make brewing
              feel creative instead of tedious.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300/90">
              <li>Fast search for cards, champs, and keywords</li>
              <li>Deck builder with stats &amp; analysis (coming online)</li>
              <li>Combo explorer for “what if I just…” ideas</li>
              <li>LM-powered rules judge for tricky interactions</li>
              <li>Articles, patch reactions, and meta notes</li>
            </ul>
          </div>

          {/* Card 3 – Who’s behind this? */}
          <div className="rounded-2xl border border-amber-400/35 bg-black/60 p-5 shadow-[0_0_28px_rgba(15,23,42,0.9)] md:col-span-2">
            <h2 className="text-sm font-semibold text-amber-200">
              Who’s behind this?
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              NexusArchive is built by a solo developer / card goblin — imagine
              a slightly less explosive Heimerdinger who swapped hextech lasers
              for TypeScript.
            </p>
            <p className="mt-2 text-sm text-slate-300">
              If something looks off, assume it’s either:
            </p>
            <ul className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-300/90">
              <li>A bug</li>
              <li>A feature</li>
              <li>
                A bug that’s been temporarily promoted to a feature until it’s
                fixed
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-amber-300">FAQ</h2>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-black/55 p-4">
              <div className="text-sm font-semibold text-slate-50">
                “Are you tracking my decks?”
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Only if you save them. We don’t peek at private brews, judge
                your jank, or report you for running dangerously cursed combos.
                Your secret tech stays yours.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/55 p-4">
              <div className="text-sm font-semibold text-slate-50">
                “Will this always be free?”
              </div>
              <p className="mt-1 text-sm text-slate-300">
                That’s the plan. Core NexusArchive tools are meant to remain{" "}
                <span className="font-semibold text-slate-50">
                  free forever
                </span>
                — no “premium card text,” no “pay to see your own decklist.”
              </p>
              <p className="mt-1 text-xs text-slate-400">
                If this ever costs money, it’ll be paid in{" "}
                <span className="italic">gratitude, memes, and maybe donations</span>.
                Hosting survives on ads and community support. If that stops
                working, we’ll fix the system — not add lootboxes.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/55 p-4">
              <div className="text-sm font-semibold text-slate-50">
                “How can I give feedback or report bugs?”
              </div>
              <p className="mt-1 text-sm text-slate-300">
                See something cursed — layout bug, card bug, or accidental
                time-travel ruling? The best way is to{" "}
                <Link
                  href="/contact"
                  className="text-amber-300 underline-offset-2 hover:underline"
                >
                  send a message through the Contact page
                </Link>{" "}
                or email{" "}
                <span className="font-semibold text-slate-50">
                  oops@nexusarchive.lol
                </span>{" "}
                for bugs and{" "}
                <span className="font-semibold text-slate-50">
                  suggestions@nexusarchive.lol
                </span>{" "}
                for ideas.
              </p>
            </div>
          </div>
        </section>

        {/* CONTACT / LEGAL LINKS */}
        <section className="space-y-3 border-t border-white/10 pt-6 text-sm">
          <p className="text-slate-300">
            Want to help, send feedback, or share a spicy list? You can reach
            the lab via the{" "}
            <Link
              href="/contact"
              className="text-amber-300 underline-offset-2 hover:underline"
            >
              Contact page
            </Link>{" "}
            or email{" "}
            <span className="font-semibold text-slate-50">
              info@nexusarchive.lol
            </span>
            .
          </p>

          <p className="text-xs text-slate-400">
            For the full wall of text, see our{" "}
            <Link
              href="/legal"
              className="text-amber-300 underline-offset-2 hover:underline"
            >
              tiny little legal stuff →
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
