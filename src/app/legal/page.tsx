export const metadata = {
  title: "Legal Stuff | NexusArchive",
  description:
    "All the Important (and mildly humorous) legal information for NexusArchive.",
};

export default function LegalPage() {
  return (
    <main className="prose prose-invert max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold">Legal Stuff</h1>
      <p className="text-slate-400">
        The boring-but-necessary section. Grab a snack.
      </p>

      <hr className="my-6 border-slate-700" />

      <h2 className="text-xl font-semibold">1. Unofficial Fan Project</h2>
      <p>
        NexusArchive is a <strong>fan-made</strong>, <strong>non-commercial</strong> project
        created for card game players who love decks, combos, edge cases, and
        whatever shiny piece of cardboard is currently ruining their sleep schedule.
      </p>
      <p>
        NexusArchive is <strong>not</strong> affiliated with, endorsed by, sponsored by, 
        or secretly operated by Riot Games, Bandai, Wizards of the Coast, or
        any other publisher with a significantly larger legal department than ours.
      </p>
      <p>
        Game names, artwork, card designs, logos, characters, mana symbols,
        suspiciously expensive staples, and other related assets still belong to
        their respective rights holders. We own the jokes. Probably.
      </p>

      <hr className="my-6 border-slate-700" />

      <h2 className="text-xl font-semibold">2. Use of Other People&apos;s Very Valuable Stuff</h2>
      <p>
        This website tries to stay inside each publisher&apos;s fan-content lane,
        official rules pages, and public product material. When a game has a
        published policy, we follow that policy. When it has official rules or
        product pages, we link to those instead of pretending we invented the game.
      </p>
      <p>
        No secret API hacking. No ripping off clients. No datamining with a
        pickaxe. No pretending the archive is official just because the buttons
        look confident.
      </p>

      <hr className="my-6 border-slate-700" />

      <h2 className="text-xl font-semibold">3. Terms of Service (The Fun-ish Part)</h2>

      <h3 className="text-lg font-semibold">3.1 Using the Website</h3>
      <p>You agree that you will:</p>
      <ul>
        <li>Use the site normally (i.e., like a human).</li>
        <li>Not try to break, reverse engineer, or &quot;yeet&quot; the database.</li>
        <li>Not build bots or scrapers that spam every endpoint 200 times a second.</li>
        <li>Not upload malicious code, cursed images, or malware.</li>
        <li>Be a generally decent human being.</li>
      </ul>

      <h3 className="text-lg font-semibold">3.2 Accounts (Apparently We Have Those Now)</h3>
      <p>
        NexusArchive now uses account login for game sections. That means we do
        have profile access controls, and you should not share your login, abuse
        someone else&apos;s, or do anything that makes the auth logs look like a
        horror movie.
      </p>

      <h3 className="text-lg font-semibold">3.3 Decklists & User Content (Future Stuff)</h3>
      <p>
        If/when user-generated content is added (decklists, comments, guides, etc.), 
        you agree not to post anything illegal, hateful, threatening, or weirdly cryptic.
      </p>
      <p>
        We reserve the right to remove content that violates the above or makes
        us go &ldquo;uhhh… what?&rdquo;
      </p>

      <h3 className="text-lg font-semibold">3.4 No Warranty (Because Software)</h3>
      <p>
        We try our best, but this site is provided <strong>&quot;as-is&quot;</strong>.  
        No guarantees it won’t break, display the wrong card price, 
        or summon a void creature from beyond the Rift.
      </p>

      <h3 className="text-lg font-semibold">3.5 Limitation of Liability</h3>
      <p>
        By using this site, you agree that NexusArchive, its developers,
        and its imaginary office cat are not liable for:
      </p>
      <ul>
        <li>Decks that lose you LP</li>
        <li>Crafting bad cards because the meta tricked you</li>
        <li>Your friend beating you because they found a better combo here</li>
        <li>Any emotional damage caused by your pack RNG</li>
      </ul>

      <hr className="my-6 border-slate-700" />

      <h2 className="text-xl font-semibold">4. Privacy</h2>
      <p>
        We keep this as light as we reasonably can. We do not sell your data to
        third parties, and we are not in the business of turning your deck
        experiments into ad-tech compost.
      </p>
      <p>
        Account and contact information may be stored only as needed to let you
        sign in, save future features, or hear back if you emailed us first.
        We may use basic analytics to understand traffic, but not to become a
        tiny surveillance goblin.
      </p>

      <hr className="my-6 border-slate-700" />

      <h2 className="text-xl font-semibold">5. Changes to This Page</h2>
      <p>
        We may update this page occasionally when laws, publisher rules, or
        cosmic winds change direction. Check back if you&apos;re curious.
      </p>

      <hr className="my-6 border-slate-700" />

      <h2 className="text-xl font-semibold">6. Questions?</h2>
      <p>
        If you have questions, suggestions, or spot an oopsie, message the
        site owner or submit an issue on the GitHub.
      </p>

      <p className="text-slate-500 mt-8">Thanks for reading. You&apos;re officially legal now.</p>
    </main>
  );
}
