export const metadata = {
  title: "Legal, Privacy & Cookies | NexusArchive",
  description: "NexusArchive legal, privacy, cookie, and fan-content notes.",
};

export default function LegalPage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
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
          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              1. Unofficial Fan Project
            </h2>
            <p>
              NexusArchive is a <strong>fan-made</strong>,{" "}
              <strong>non-commercial</strong> archive created for card game
              players who love decks, combos, edge cases, and whatever shiny
              piece of cardboard is currently ruining their sleep schedule.
            </p>
            <p>
              NexusArchive is <strong>not</strong> affiliated with, endorsed by,
              sponsored by, or secretly operated by Riot Games, Bandai, Wizards
              of the Coast, or any other publisher with a significantly larger
              legal department than ours.
            </p>
            <p>
              Game names, artwork, card designs, logos, characters, mana
              symbols, suspiciously expensive staples, and other related assets
              belong to their respective rights holders.
            </p>
          </div>

          <hr className="border-slate-700" />

          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              2. Use of Other People&apos;s Stuff
            </h2>
            <p>
              This website tries to stay inside each publisher&apos;s fan-content
              lane, official rules pages, and public product material. When a
              game has a published policy, we follow that policy. When it has
              official rules or product pages, we link to those instead of
              pretending we invented the game.
            </p>
            <p>
              No secret API hacking. No ripping off clients. No datamining with
              a pickaxe. No pretending the archive is official just because the
              buttons look confident.
            </p>
          </div>

          <hr className="border-slate-700" />

          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              3. Terms of Service
            </h2>

            <h3 className="mt-3 text-sm font-semibold text-amber-50">
              3.1 Using the Website
            </h3>
            <p>By using NexusArchive, you agree that you will:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Use the site normally, like a human.</li>
              <li>Not try to break, reverse engineer, or yeet the database.</li>
              <li>Not build bots or scrapers that hammer every endpoint.</li>
              <li>Not upload malicious code, cursed images, or malware.</li>
              <li>Be a generally decent human being.</li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              3.2 Accounts & User Content
            </h3>
            <p>
              NexusArchive uses account login for features such as collection
              workflows. Do not share your login, abuse someone else&apos;s account,
              or do anything that makes the auth logs look like a horror movie.
            </p>
            <p>
              If user-generated content is added, such as decklists, comments,
              guides, or scan feedback, you agree not to post anything illegal,
              hateful, threatening, or bizarrely cryptic. We may remove content
              that violates these rules or makes us go &quot;uhhh... what?&quot;
            </p>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              3.3 No Warranty
            </h3>
            <p>
              We try our best, but this site is provided{" "}
              <strong>&quot;as is&quot;</strong>. There is no guarantee it will not break,
              display outdated info, misread a scan, or suggest a deck that loses
              you LP.
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

          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              4. Privacy Policy
            </h2>

            <h3 className="mt-3 text-sm font-semibold text-amber-50">
              4.1 What We Collect
            </h3>
            <p>
              We keep this as light as we reasonably can. We do not sell your
              data to third parties, and we are not in the business of turning
              your deck experiments into ad-tech compost.
            </p>
            <p>
              Account and contact information may be stored only as needed to
              let you sign in, save features, or hear back if you emailed us
              first. Scanner uploads may be stored privately so scan results and
              asset previews can work.
            </p>
            <p>Like most websites, we may also automatically receive:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>IP address and general region.</li>
              <li>Browser type, device type, and operating system.</li>
              <li>Pages visited and basic usage stats.</li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              4.2 Analytics & Logs
            </h3>
            <p>
              We may use privacy-respecting analytics tools and standard server
              logs to understand how the site is used. These tools are used to
              improve NexusArchive, not to build creepy profiles of you.
            </p>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              4.3 Advertising
            </h3>
            <p>
              NexusArchive may be supported in part by ads. We use{" "}
              <strong>Google AdSense</strong>, which may use cookies and similar
              technologies to serve relevant ads, limit repeated ads, and measure
              ad performance.
            </p>
            <p>
              You can learn more and manage Google ad settings at{" "}
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
              trusted providers necessary to operate the site, such as hosting,
              authentication, storage, analytics, advertising networks, and AI
              scan processing providers.
            </p>

            <h3 className="mt-4 text-sm font-semibold text-amber-50">
              4.5 Your Choices
            </h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                You can block or delete cookies in your browser settings. This
                may impact some functionality or ad relevance.
              </li>
              <li>
                If you are in a region that requires granular consent, you may
                see a consent banner where you can choose how your data is used
                for ads.
              </li>
            </ul>
          </div>

          <hr className="border-slate-700" />

          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              5. Cookies & Consent Banner
            </h2>
            <p>
              NexusArchive uses cookies and similar technologies for basic site
              functionality, anonymous or aggregated analytics, account features,
              and advertising through Google AdSense.
            </p>
            <p>
              Visitors from the European Economic Area, the UK, and Switzerland
              may see a consent message powered by a Google-certified Consent
              Management Platform. That banner lets you give or withhold consent
              for personalized ads and adjust your preferences.
            </p>
          </div>

          <hr className="border-slate-700" />

          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              6. Changes to This Page
            </h2>
            <p>
              We may update this page when laws, publisher rules, cosmic winds,
              or site features change direction. When we update it, we will
              refresh the last updated date.
            </p>
            <p className="mt-1 text-slate-300">Last updated: {currentYear}</p>
          </div>

          <hr className="border-slate-700" />

          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              7. Questions?
            </h2>
            <p>
              If you have questions, suggestions, or spot an oopsie, contact the
              site owner through the Contact page or open an issue on GitHub.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Thanks for reading. You are officially legal now.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
