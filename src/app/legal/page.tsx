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
        created for Riftbound players who love cards, combos, decks, and 
        whatever shiny thing Riot releases next.
      </p>
      <p>
        NexusArchive is <strong>not</strong> affiliated with, endorsed by, sponsored by, 
        or secretly operated by Riot Games. (We checked. Twice.)
      </p>
      <p>
        Riftbound™, all related artwork, card designs, champions, icons, magical
        blue sparkles, etc. are © Riot Games, Inc.
      </p>

      <hr className="my-6 border-slate-700" />

      <h2 className="text-xl font-semibold">2. Use of Riot Assets</h2>
      <p>
        This website follows Riot Games’ official guidelines located at:{" "}
        <a
          href="https://www.riotgames.com/en/legal"
          target="_blank"
          rel="noreferrer"
        >
          https://www.riotgames.com/en/legal
        </a>
      </p>
      <p>
        We only use assets allowed under their “Legal Jibber Jabber” policy.
        No secret API hacking. No ripping off their client. No datamining 
        their game files with a pickaxe.
      </p>

      <hr className="my-6 border-slate-700" />

      <h2 className="text-xl font-semibold">3. Terms of Service (The Fun-ish Part)</h2>

      <h3 className="text-lg font-semibold">3.1 Using the Website</h3>
      <p>You agree that you will:</p>
      <ul>
        <li>Use the site normally (i.e., like a human).</li>
        <li>Not try to break, reverse engineer, or "yeet" the database.</li>
        <li>Not build bots or scrapers that spam every endpoint 200 times a second.</li>
        <li>Not upload malicious code, cursed images, or malware.</li>
        <li>Be a generally decent human being.</li>
      </ul>

      <h3 className="text-lg font-semibold">3.2 No Accounts (Yet)</h3>
      <p>
        NexusArchive currently doesn’t use login accounts, passwords,
        or any profile systems. So there’s nothing to steal… unless you count our
        CSS, which you technically shouldn’t steal either.
      </p>

      <h3 className="text-lg font-semibold">3.3 Decklists & User Content (Future Stuff)</h3>
      <p>
        If/when user-generated content is added (decklists, comments, guides, etc.), 
        you agree not to post anything illegal, hateful, threatening, or weirdly cryptic.
      </p>
      <p>
        We reserve the right to remove content that violates the above or makes
        us go “uhhh… what?”
      </p>

      <h3 className="text-lg font-semibold">3.4 No Warranty (Because Software)</h3>
      <p>
        We try our best, but this site is provided <strong>"as-is"</strong>.  
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
        We don’t track personal data, don’t store personal profiles,
        and don’t sell anything to third parties.
      </p>
      <p>
        We do use basic analytics (maybe, eventually) to monitor site traffic,
        but not who you are. You’re safe.
      </p>

      <hr className="my-6 border-slate-700" />

      <h2 className="text-xl font-semibold">5. Changes to This Page</h2>
      <p>
        We may update this page occasionally when laws, Riot rules, or
        cosmic winds change direction. Check back if you're curious.
      </p>

      <hr className="my-6 border-slate-700" />

      <h2 className="text-xl font-semibold">6. Questions?</h2>
      <p>
        If you have questions, suggestions, or spot an oopsie, message the
        site owner or submit an issue on the GitHub.
      </p>

      <p className="text-slate-500 mt-8">Thanks for reading. You're officially legal now. 🎉</p>
    </main>
  );
}
