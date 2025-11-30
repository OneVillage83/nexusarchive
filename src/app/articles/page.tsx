// src/app/articles/page.tsx
import Link from "next/link";

type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  approxRead: string;
};

const demoArticles: ArticleMeta[] = [
  {
    slug: "launch-early-deck-archetypes",
    title: "Riftbound Launch: Early Deck Archetypes",
    description:
      "A first look at champions, shells, and spicy brews that might define the opening weeks of the Riftbound meta.",
    tag: "Meta Snapshot",
    approxRead: "8 min read",
  },
  {
    slug: "patch-notes-01-balance-thoughts",
    title: "Patch 0.1 Notes: “Totally Not Overtuned” Edition",
    description:
      "We walk through the major balance changes and ask the important question: who accidentally got buffed?",
    tag: "Patch Notes",
    approxRead: "6 min read",
  },
  {
    slug: "combo-lab-vol-1",
    title: "Combo Lab Vol. 1 – Infinite? No. Extremely Funny? Yes.",
    description:
      "A tour of janky but delightful interactions that probably shouldn’t work this well, but absolutely do.",
    tag: "Combo Lab",
    approxRead: "7 min read",
  },
];

export default function ArticlesPage() {
  const [featured, ...rest] = demoArticles;

  return (
    <main className="relative overflow-hidden">
      {/* Arcane-ish blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-sky-500/18 blur-3xl" />
        <div className="absolute right-[-6rem] top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-[-10rem] h-72 bg-gradient-to-t from-amber-500/18 via-transparent to-transparent blur-2xl" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10">
        {/* HERO */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-wide text-amber-200/90 shadow-[0_0_18px_rgba(250,204,21,0.35)]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            Articles &amp; Reports
          </div>

          <h1 className="text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
            Patch breakdowns, meta notes, and{" "}
            <span className="text-amber-300">too many words</span> about cards.
          </h1>

          <p className="max-w-2xl text-sm text-slate-200/85 sm:text-base">
            This is the part of the lab where we pin decks to the wall, scribble
            on them with red string, and then pretend it was all planned when a
            list accidentally becomes tier one.
          </p>
        </section>

        {/* FEATURED ARTICLE */}
        <section className="rounded-3xl border border-amber-400/35 bg-black/65 p-5 shadow-[0_0_32px_rgba(15,23,42,0.95)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/80">
            Featured article
          </p>

          <Link
            href={`/articles/${featured.slug}`}
            className="mt-2 block text-lg font-semibold text-slate-50 hover:text-amber-200"
          >
            {featured.title}
          </Link>

          <p className="mt-2 text-sm text-slate-300">{featured.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-amber-200">
              {featured.tag}
            </span>
            <span>{featured.approxRead}</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-500 sm:inline-block" />
            <span className="hidden text-slate-400 sm:inline-block">
              Updated whenever the meta does something weird.
            </span>
          </div>
        </section>

        {/* OTHER ARTICLES */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-amber-300">All articles</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {rest.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group rounded-2xl border border-white/10 bg-black/60 p-4 shadow-[0_0_24px_rgba(15,23,42,0.8)] transition-transform hover:-translate-y-0.5 hover:border-amber-300/60"
              >
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-amber-200">
                    {article.tag}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span>{article.approxRead}</span>
                </div>

                <h3 className="text-sm font-semibold text-slate-50 group-hover:text-amber-200">
                  {article.title}
                </h3>

                <p className="mt-2 text-xs text-slate-300">
                  {article.description}
                </p>
              </Link>
            ))}
          </div>

          <p className="text-xs text-slate-400">
            More pieces will be added over time—patch reactions, deck guides,
            combo deep dives, and the occasional “I played this on ladder so you
            don’t have to” report.
          </p>
        </section>
      </div>
    </main>
  );
}
