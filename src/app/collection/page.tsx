// src/app/collections/page.tsx
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isClerkConfigured } from "@/lib/auth-config";

const PANEL =
  "rounded-2xl border border-white/25 bg-black/75 shadow-[0_0_40px_rgba(0,0,0,0.95)] p-4 sm:p-5";

const LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-amber-100/80";

// Mock data – replace with real user data later
const MOCK_USER = {
  name: "Guest Riftbounder",
  joinDate: "Not signed in",
  totalCardsOwned: 128,
  totalUniqueCards: 94,
  estimatedValueUsd: 237.5,
  decksSaved: 6,
  publicDecklists: 2,
};

const MOCK_DOMAIN_PROGRESS = [
  { domain: "Fury", color: "Red", owned: 32, total: 60 },
  { domain: "Calm", color: "Green", owned: 20, total: 48 },
  { domain: "Mind", color: "Blue", owned: 18, total: 42 },
  { domain: "Body", color: "Orange", owned: 12, total: 35 },
  { domain: "Chaos", color: "Purple", owned: 8, total: 27 },
  { domain: "Order", color: "Yellow", owned: 4, total: 20 },
];

const MOCK_SAVED_DECKS = [
  {
    id: "deck-1",
    name: "Fury Tempo Burn",
    domains: ["Fury"],
    type: "Aggro / Tempo",
    cards: 40,
    lastTouched: "Recently",
  },
  {
    id: "deck-2",
    name: "Mindlock Control",
    domains: ["Mind", "Order"],
    type: "Control",
    cards: 40,
    lastTouched: "3 days ago",
  },
  {
    id: "deck-3",
    name: "Body + Calm Midrange",
    domains: ["Body", "Calm"],
    type: "Midrange",
    cards: 40,
    lastTouched: "Last week",
  },
];

export async function RiftboundCollectionsPage() {
  const authEnabled = isClerkConfigured();
  const { userId } = authEnabled ? await auth() : { userId: null };
  const profileUser = userId
    ? {
        ...MOCK_USER,
        name: "Signed-in Riftbounder",
        joinDate: "Clerk connected",
      }
    : authEnabled
      ? MOCK_USER
      : {
          ...MOCK_USER,
          joinDate: "Auth sleeping",
        };

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
            Collection
          </h1>
          <p className="max-w-3xl text-sm text-amber-50/85">
            Browse the layout now, then sign in when you want NexusArchive to
            remember your Riftbound collection, save decks from the builder, and
            manage the lists you share with the community.
          </p>

          <div className="mt-4 rounded-2xl border border-sky-200/35 bg-sky-950/60 px-4 py-3 text-xs text-sky-50/85">
            <p>
              <span className="font-semibold text-sky-100">Planned flow:</span>{" "}
              browse freely &rarr; sign in when you want persistence &rarr;
              Collections tracks owned cards, estimated value, saved decks, and
              the decklists you choose to publish.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/25 bg-black/45 px-4 py-3 text-xs text-amber-100/85">
            <span className="font-semibold text-amber-200">Access rule:</span>
            <span className="flex-1">
              This page is public to view. Signing in only matters when you want
              collection sync, saved decks, and account-tied progress.
            </span>
            {!userId && authEnabled ? (
              <Link
                href="/sign-in"
                className="
                  inline-flex items-center justify-center rounded-full bg-amber-400/95 px-3 py-1
                  text-[11px] font-semibold text-slate-950 shadow-[0_0_18px_rgba(0,0,0,0.8)]
                  transition hover:bg-amber-300
                "
              >
                Sign in for saves
              </Link>
            ) : null}
          </div>
        </section>

        {/* 🔮 Riot-style API / auth waiting message */}
        <div
          className="
            rift-flicker
            mt-1 rounded-xl border border-amber-300/30 bg-black/55
            px-4 py-3 text-[12px] text-amber-100/85 shadow-[0_0_15px_rgba(0,0,0,0.6)]
          "
        >
          <p>
            <span className="font-semibold text-amber-200">Developer Note:</span>{" "}
            This is Collections in scaffold mode. The page is public on purpose;
            the account layer only needs to wake up when it is time to save real
            cards, decks, and published lists to a player profile.
          </p>
        </div>

        {/* Main layout grid */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)] xl:gap-5">
          {/* LEFT COLUMN – profile + completion */}
          <div className="space-y-4">
            {/* Profile / account summary */}
            <div className={PANEL}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-amber-200">
                    Profile overview
                  </h2>
                  <p className="text-[11px] text-amber-100/70">
                    Viewable by anyone. Personal data wakes up once you sign in.
                  </p>
                </div>
                {!userId && authEnabled ? (
                  <Link
                    href="/sign-in"
                    className="
                      inline-flex items-center justify-center rounded-full
                      border border-amber-300/40 bg-black/60 px-3 py-1
                      text-[11px] font-medium text-amber-100
                      shadow-[0_0_14px_rgba(0,0,0,0.7)]
                      transition hover:bg-white/5
                    "
                  >
                    Sign in to save
                  </Link>
                ) : (
                  <span
                    className="
                      inline-flex items-center justify-center rounded-full
                      border border-emerald-300/35 bg-emerald-950/35 px-3 py-1
                      text-[11px] font-medium text-emerald-100
                      shadow-[0_0_14px_rgba(0,0,0,0.7)]
                    "
                  >
                    {userId ? "Signed in" : "Preview mode"}
                  </span>
                )}
              </div>

              <div className="grid gap-3 text-xs text-amber-50/90 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className={LABEL}>User</div>
                    <div className="text-sm font-semibold text-amber-100">
                    {profileUser.name}
                  </div>
                  <div className="text-[11px] text-amber-100/70">
                    Joined: {profileUser.joinDate}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className={LABEL}>Collection snapshot</div>
                  <div className="text-[11px] text-amber-100/85">
                    <div>
                      <span className="font-semibold">
                        {MOCK_USER.totalCardsOwned}
                      </span>{" "}
                      total cards owned
                    </div>
                    <div>
                      <span className="font-semibold">
                        {MOCK_USER.totalUniqueCards}
                      </span>{" "}
                      unique cards
                    </div>
                    <div className="mt-1">
                      Est. value:{" "}
                      <span className="font-semibold text-amber-200">
                        $
                        {MOCK_USER.estimatedValueUsd.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className={LABEL}>Decks &amp; lists</div>
                  <div className="text-[11px] text-amber-100/85">
                    <div>
                      <span className="font-semibold">
                        {MOCK_USER.decksSaved}
                      </span>{" "}
                      decks saved from the builder
                    </div>
                    <div>
                      <span className="font-semibold">
                        {MOCK_USER.publicDecklists}
                      </span>{" "}
                      public decklists
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className={LABEL}>Next steps</div>
                  <ul className="list-disc list-inside text-[11px] text-amber-100/80 space-y-0.5">
                    <li>Show the signed-in player profile when a save exists.</li>
                    <li>Load collection stats from your DB per user ID.</li>
                    <li>
                      Show &quot;sync&quot; status with the latest card / price
                      data.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Collection completion by domain */}
            <div className={PANEL}>
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-amber-200">
                  Collection completion by domain
                </h2>
                <p className="text-[11px] text-amber-100/70">
                  Later this will be computed from your owned-card flags.
                </p>
              </div>

              <div className="space-y-2 text-[11px] text-amber-50/90">
                {MOCK_DOMAIN_PROGRESS.map((row) => {
                  const percent = Math.round(
                    (row.owned / row.total) * 100,
                  );

                  return (
                    <div key={row.domain}>
                      <div className="flex items-center justify-between">
                        <span>
                          {row.domain}{" "}
                          <span className="text-amber-200/80">
                            ({row.color})
                          </span>
                        </span>
                        <span className="text-amber-100/75">
                          {row.owned} / {row.total} cards ·{" "}
                          <span className="font-semibold">{percent}%</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/70">
                        <div
                          className="h-full rounded-full bg-amber-400/90"
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN – saved decks & decklists */}
          <div className="space-y-4">
            {/* Saved decks */}
            <div className={PANEL}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-amber-200">
                    Saved decks
                  </h2>
                  <p className="text-[11px] text-amber-100/70">
                    Decks exported from the Deck Builder will show up here once
                    the user system is wired in.
                  </p>
                </div>
                <Link
                  href="/riftbound/deckbuilder"
                  prefetch={false}
                  className="
                    inline-flex items-center justify-center rounded-full
                    bg-amber-400/95 px-3 py-1 text-[11px] font-semibold
                    text-slate-950 shadow-[0_0_18px_rgba(0,0,0,0.8)]
                    transition hover:bg-amber-300
                  "
                >
                  Open Deck Builder
                </Link>
              </div>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 text-xs text-amber-50/90">
                {MOCK_SAVED_DECKS.map((deck) => (
                  <article
                    key={deck.id}
                    className="
                      rounded-xl border border-white/18 bg-black/60
                      px-3 py-2
                    "
                  >
                    <header className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[13px] font-semibold text-amber-50">
                          {deck.name}
                        </div>
                        <div className="text-[10px] text-amber-100/75">
                          {deck.type} · {deck.cards} cards · Domains:{" "}
                          {deck.domains.join(", ")}
                        </div>
                      </div>
                      <div className="text-[10px] text-amber-100/70">
                        {deck.lastTouched}
                      </div>
                    </header>

                    <footer className="mt-2 flex flex-wrap gap-2 text-[10px]">
                      <button
                        type="button"
                        className="
                          inline-flex items-center justify-center rounded-full
                          border border-white/35 bg-black/60 px-3 py-1
                          text-[10px] font-medium text-amber-50
                          shadow-[0_0_14px_rgba(0,0,0,0.7)]
                          transition hover:bg-white/5
                        "
                      >
                        (Future) Open in Deck Builder
                      </button>
                      <button
                        type="button"
                        className="
                          inline-flex items-center justify-center rounded-full
                          border border-white/25 bg-black/60 px-3 py-1
                          text-[10px] font-medium text-amber-50/90
                          hover:bg-red-900/40 hover:border-red-300/60
                          transition
                        "
                      >
                        (Future) Remove from saved
                      </button>
                    </footer>
                  </article>
                ))}

                {MOCK_SAVED_DECKS.length === 0 && (
                  <p className="text-[11px] text-amber-100/70">
                    No decks saved yet. Once accounts are live, decks you save
                    in the builder will appear here.
                  </p>
                )}
              </div>
            </div>

            {/* Decklists publishing stub */}
            <div className={PANEL}>
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-amber-200">
                  Published decklists (future)
                </h2>
                <p className="text-[11px] text-amber-100/70">
                  This section will list the decks you&apos;ve made public on
                  the Deck Lists page, with edit / unpublish controls.
                </p>
              </div>

              <div className="rounded-2xl border border-white/18 bg-black/60 px-4 py-3 text-[11px] text-amber-100/80">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Link this to the same underlying decklist table the Deck
                    Lists page uses.
                  </li>
                  <li>
                    Filter by <code>authorUserId</code> to show only this
                    player&apos;s lists.
                  </li>
                  <li>
                    Add actions for &quot;Edit list&quot;, &quot;Unpublish&quot;,
                    and &quot;Copy link&quot;.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Back link */}
        <div className="pt-2">
          <Link
            href="/riftbound"
            prefetch={false}
            className="text-xs font-medium text-amber-200 hover:text-white"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CollectionsPage() {
  redirect("/riftbound/collection");
}
