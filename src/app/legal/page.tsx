export const metadata = {
  title: "Legal, Privacy & Cookies | NexusArchive",
  description:
    "All the important legal, privacy, and cookie information for NexusArchive.",
};

export default function LegalPage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Glassy dark panel so the text isn't on pure orange */}
      <div className="rounded-3xl border border-amber-500/25 bg-black/80 px-6 py-7 shadow-[0_0_35px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold text-amber-100">
            Legal, Privacy & Cookies
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            The boring-but-necessary section. Grab a snack.
          </p>
        </header>

        <section className="space-y-5 text-sm leading-relaxed text-slate-100">
          {/* 1. Unofficial Fan Project */}
          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              1. Unofficial Fan Project
            </h2>
            <p>
              NexusArchive is a <strong>fan-made</strong> project created for
              Riftbound players who love cards, combos, decks, and whatever
              shiny thing Riot releases next.
            </p>
            <p>
              NexusArchive is <strong>not</strong> affiliated with, endorsed by,
              sponsored by, or secretly operated by Riot Games. (We checked.
              Twice.)
            </p>
            <p>
              Riftbound™, all related artwork, card designs, champions, icons,
              magical blue sparkles, etc. are © Riot Games, Inc.
            </p>
          </div>

          <hr className="border-slate-700" />

          {/* 2. Use of Riot Assets */}
          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              2. Use of Riot Assets
            </h2>
            <p>
              This website follows Riot Games’ official guidelines located at:{" "}
              <a
                href="https://www.riotgames.com/en/legal"
                target="_blank"
                rel="noreferrer"
                className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
              >
                https://www.riotgames.com/en/legal
              </a>
              .
            </p>
            <p>
              We only use assets allowed under their “Legal Jibber Jabber”
              policy. No secret API hacking. No ripping off their client. No
              data-mining their game files with a pickaxe.
            </p>
          </div>

          <hr className="border-slate-700" />

          {/* 3. Terms of Service */}
          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              3. Terms of Service
            </h2>

            <h3 className="mt-3 text-sm font-semibold text-amber-50">
              3.1 Using the Website
            </h3>
            <p>By using NexusArchive, you agree that you will:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Use the site normally (i.e., like a human).</li>
              <li>Not try to break, reverse engineer, or nuke the database.</li>
              <li>Not build bots or scrapers that hammer every endpoint.</li>
              <li>Not upload malicious code, cursed images, or malware.</li>
              <li>Be a generally decent human being.</li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              3.2 Accounts &amp; User Content
            </h3>
            <p>
              NexusArchive currently doesn’t use login accounts or profile
              systems. If we add user-generated content later (decklists,
              comments, guides, etc.), you agree not to post anything illegal,
              hateful, threatening, or bizarrely cryptic.
            </p>
            <p>
              We reserve the right to remove content that violates these rules
              or makes us go “uhhh… what?”
            </p>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              3.3 No Warranty
            </h3>
            <p>
              We try our best, but this site is provided{" "}
              <strong>"as is"</strong>. There is no guarantee it won’t break,
              display outdated info, or suggest a deck that loses you LP.
            </p>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              3.4 Limitation of Liability
            </h3>
            <p>
              By using this site, you agree that NexusArchive, its developers,
              and its imaginary office cat are not liable for:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Decks that lose you LP or matches.</li>
              <li>Crafting bad cards because the meta tricked you.</li>
              <li>
                Your friend beating you because they found a better combo here.
              </li>
              <li>Any emotional damage caused by your pack RNG.</li>
            </ul>
          </div>

          <hr className="border-slate-700" />

          {/* 4. Privacy Policy */}
          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              4. Privacy Policy
            </h2>

            <h3 className="mt-3 text-sm font-semibold text-amber-50">
              4.1 What We Collect
            </h3>
            <p>
              NexusArchive is designed to collect as little personal data as
              possible. We do <strong>not</strong> run user accounts and we
              don&apos;t ask you to log in.
            </p>
            <p>However, like most websites, we may automatically receive:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>IP address and general region (e.g., country or city-level).</li>
              <li>Browser type and version, device type, operating system.</li>
              <li>
                Pages visited and basic usage stats (time on page, clicks, etc.).
              </li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              4.2 Analytics &amp; Logs
            </h3>
            <p>
              We may use privacy-respecting analytics tools and standard server
              logs to understand how the site is used (which pages are popular,
              performance issues, etc.). These tools are used to improve
              NexusArchive, not to build creepy profiles of you.
            </p>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              4.3 Advertising (Google AdSense)
            </h3>
            <p>
              NexusArchive is supported in part by ads. We use{" "}
              <strong>Google AdSense</strong>, which may use cookies and similar
              technologies to:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Serve ads relevant to your interests.</li>
              <li>Limit how often you see the same ad.</li>
              <li>Measure ad performance.</li>
            </ul>
            <p>
              You can learn more and manage ad settings at{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noreferrer"
                className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
              >
                https://www.google.com/settings/ads
              </a>
              .
            </p>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              4.4 Data Sharing
            </h3>
            <p>
              We do not sell your personal data. We only share information with
              trusted providers necessary to operate the site (hosting,
              analytics, advertising networks like Google, etc.), and only to
              the extent required for those services.
            </p>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              4.5 International Users
            </h3>
            <p>
              If you access NexusArchive from outside the United States, your
              data may be processed on servers located in the U.S. or other
              regions where our service providers operate.
            </p>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              4.6 Your Choices
            </h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                You can block or delete cookies in your browser settings (this
                may impact some functionality or ad relevance).
              </li>
              <li>
                If you&apos;re in the EU/EEA, UK, or Switzerland, you will see a
                consent banner where you can choose how your data is used for
                ads.
              </li>
            </ul>
          </div>

          <hr className="border-slate-700" />

          {/* 5. Cookies & Consent */}
          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              5. Cookies &amp; Consent Banner
            </h2>
            <p>
              NexusArchive uses cookies and similar technologies for three main
              reasons:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Basic site functionality and performance.</li>
              <li>Anonymous or aggregated analytics.</li>
              <li>Advertising through Google AdSense.</li>
            </ul>
            <p>
              Visitors from the European Economic Area (EEA), the UK, and
              Switzerland will see a consent message powered by a{" "}
              <strong>Google-certified Consent Management Platform (CMP)</strong>.
              That banner lets you:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Give or withhold consent for personalized ads.</li>
              <li>Adjust your preferences via “Manage options”.</li>
            </ul>
            <p>
              Outside those regions, you may still see a simpler cookie or
              privacy notice, but full granular consent is primarily required in
              the regions above.
            </p>
          </div>

          <hr className="border-slate-700" />

          {/* 6. Changes */}
          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              6. Changes to This Page
            </h2>
            <p>
              We may update this page when laws change, Riot changes its
              policies, or we ship new features (like accounts or comments).
              When we update it, we&apos;ll refresh the “Last updated” date.
            </p>
            <p className="mt-1 text-slate-300">Last updated: {currentYear}</p>
          </div>

          <hr className="border-slate-700" />

          {/* 7. Contact */}
          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              7. Questions?
            </h2>
            <p>
              If you have questions, suggestions, or spot an oopsie, you can
              contact the site owner via the Contact page or open an issue on
              the project&apos;s GitHub.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Thanks for reading. You&apos;re officially legal now. 🎉
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
