export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">About NexusArchive</h1>
        <p className="text-sm text-slate-400">
          NexusArchive is a community-built archive for Riftbound cards, decks,
          and combos — with live pricing and deck analytics planned.
        </p>
      </header>

      <section className="space-y-2 text-sm text-slate-300">
        <h2 className="text-base font-semibold">What is NexusArchive?</h2>
        <p>
          NexusArchive is a free, Riftbound-focused card database with current
          market prices, a powerful deck builder, and a combo finder — built to
          be the Nexus for every Riftbound player.
        </p>
      </section>

      <section className="space-y-2 text-sm text-slate-300">
        <h2 className="text-base font-semibold">Is this official?</h2>
        <p>
          No. NexusArchive is an unofficial fan project and is not affiliated
          with Riot Games or the creators of Riftbound. All card data and art
          references are used to help players learn and enjoy the game.
        </p>
      </section>

      <section className="space-y-2 text-sm text-slate-300">
        <h2 className="text-base font-semibold">
          Will NexusArchive always be free?
        </h2>
        <p>
          The goal is to keep all tools — card search, deck building, combo
          search, and pricing — freely accessible. If the site ever accepts
          support, it will be to cover hosting and development costs, not to
          lock features behind a paywall.
        </p>
      </section>
    </div>
  );
}
