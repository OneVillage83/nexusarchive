// src/app/about/page.tsx
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
            Short answer: a fan-made Riftbound toolbox built by one very
            determined human with too many decks and not enough sleep. Think of
            it as a Piltover lab where all the charts, card text, and wild
            ideas are taped to the same wall.
          </p>
        </section>

        {/* SECTIONS */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Card 1 */}
          <div className="rounded-2xl border border-sky-500/35 bg-black/60 p-5 shadow-[0_0_28px_rgba(15,23,42,0.9)]">
            <h2 className="text-sm font-semibold text-amber-200">
              Is this official?
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Nope. This is a{" "}
              <span className="font-semibold text-slate-50">
                100% unofficial fan project
              </span>
              . No secret Riot basement, no hidden balance levers, just public
              info and a lot of spreadsheets.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              NexusArchive is not endorsed by, directly affiliated with,
              maintained, authorized, or sponsored by Riot Games, Inc. or any
              of its mysterious council of balance wizards.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-emerald-500/35 bg-black/60 p-5 shadow-[0_0_28px_rgba(15,23,42,0.9)]">
            <h2 className="text-sm font-semibold text-emerald-200">
              So what *does* it do?
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              The goal is simple:{" "}
              <span className="font-semibold text-slate-50">
                every Riftbound card, deck, and combo in one place
              </span>
              —with tools that make brewing feel like tinkering in an
              Arcane lab rather than fighting a spreadsheet boss.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300/90">
              <li>Fast search for cards, champs, and keywords</li>
              <li>Deck builder with scores &amp; stats (coming online)</li>
              <li>Combo explorer for “what if I just…” ideas</li>
              <li>Articles, patch reactions, and meta notes</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-amber-400/35 bg-black/60 p-5 shadow-[0_0_28px_rgba(15,23,42,0.9)] md:col-span-2">
            <h2 className="text-sm font-semibold text-amber-200">
              Who’s behind this?
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              NexusArchive is lovingly cobbled together by a solo developer /
              card goblin. Imagine a slightly less explosive Heimerdinger who
              replaced lasers with TypeScript and too many Trello boards.
            </p>
            <p className="mt-2 text-sm text-slate-300">
              If something looks broken, assume it’s either:
            </p>
            <ul className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-300/90">
              <li>A bug</li>
              <li>A feature</li>
              <li>A bug that has been re-branded as a feature until it’s fixed</li>
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
                Only if you save them. We don’t peek at your private brews,
                judge your jank, or report you for running completely
                unreasonable combos. Your secret tech is between you and your
                queue.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/55 p-4">
              <div className="text-sm font-semibold text-slate-50">
                “Will this always be free?”
              </div>
              <p className="mt-1 text-sm text-slate-300">
                That’s the plan. Core NexusArchive tools are meant to stay{" "}
                <span className="font-semibold text-slate-50">free forever</span>. 
                No “premium card text,” no “pay to see your own decklist.” If this
                ever costs money, it’ll be paid in{" "}
                <span className="italic">gratitude, memes, and maybe donations</span>.
              </p>
                <p className="mt-1 text-xs text-slate-400">
                Hosting is kept alive by ads and community support. If that combo
                stops working, we’ll fix the combo—not sneak in a lootbox.
              </p>
             </div>

            <div className="rounded-xl border border-white/10 bg-black/55 p-4">
              <div className="text-sm font-semibold text-slate-50">
                “How can I give feedback or report bugs?”
              </div>
              <p className="mt-1 text-sm text-slate-300">
              See something cursed? Either a layout bug or a card combo that should not exist? The best way is to{" "}
              <Link
              href="/contact"
              className="text-amber-300 underline-offset-2 hover:underline"
             >
             send a message through the contact lab
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

        {/* CONTACT / LEGAL LINKS */}
        <section className="space-y-3 border-t border-white/10 pt-6 text-sm">
          <p className="text-slate-300">
          Want to help, send feedback, or just share a spicy list? You can now{" "}
          <Link
         href="/contact"
         className="text-amber-300 underline-offset-2 hover:underline"
        >
         talk directly to the lab on the Contact page
        </Link>
        . Or email{" "}
      <span className="font-semibold text-slate-50">
       info@nexusarchive.lol
      </span>{" "}
       if you prefer good old-fashioned scrolls… uh, emails.
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
