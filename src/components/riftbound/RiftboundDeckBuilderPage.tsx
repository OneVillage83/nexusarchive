"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const PANEL =
  "rounded-2xl border border-white/25 bg-black/70 shadow-[0_0_40px_rgba(0,0,0,0.9)] p-4 sm:p-5";

const LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-amber-100/80";

const INPUT =
  "mt-1 w-full rounded-md border border-white/25 bg-black/60 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-200/70 focus:outline-none focus:ring-2 focus:ring-amber-300/80";

const BUTTON_PRIMARY =
  "inline-flex items-center justify-center rounded-full bg-amber-400/95 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-[0_0_18px_rgba(0,0,0,0.9)] transition hover:bg-amber-300";

const BUTTON_GHOST =
  "inline-flex items-center justify-center rounded-full border border-white/35 bg-black/60 px-2.5 py-1 text-xs font-medium text-amber-50 shadow-[0_0_14px_rgba(0,0,0,0.7)] transition hover:bg-white/5";

const DOMAIN_ORDER = ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"];

const MOCK_CARDS = [
  {
    id: "RB001",
    name: "Flame Initiate",
    type: "Unit",
    domain: "Fury",
    cost: 1,
    power: 2,
    energy: 1,
    keywords: ["Pierce"],
  },
  {
    id: "RB002",
    name: "Tranquil Grovekeeper",
    type: "Unit",
    domain: "Calm",
    cost: 2,
    power: 2,
    energy: 2,
    keywords: ["Guard"],
  },
  {
    id: "RB003",
    name: "Mindstorm Bolt",
    type: "Spell",
    domain: "Mind",
    cost: 3,
    power: 0,
    energy: 0,
    keywords: ["Burst"],
  },
  {
    id: "RB004",
    name: "Stonefront Bulwark",
    type: "Unit",
    domain: "Body",
    cost: 4,
    power: 3,
    energy: 5,
    keywords: ["Guard", "Taunt"],
  },
];

function normalise(text: string) {
  return text.toLowerCase();
}

type DeckEntry = {
  cardId: string;
  count: number;
};

type RiftboundDeckBuilderPageProps = {
  authEnabled: boolean;
  userId: string | null;
};

export function RiftboundDeckBuilderPage({
  authEnabled,
  userId,
}: RiftboundDeckBuilderPageProps) {
  const [deckName, setDeckName] = useState("New Riftbound Deck");
  const [searchText, setSearchText] = useState("");
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [deckEntries, setDeckEntries] = useState<DeckEntry[]>([]);

  const allCards = MOCK_CARDS;

  const filteredCards = useMemo(() => {
    const q = normalise(searchText.trim());
    return allCards.filter((card) => {
      if (domainFilter && card.domain !== domainFilter) return false;
      if (!q) return true;

      const haystack = [card.name, card.type, card.domain, ...card.keywords]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [allCards, searchText, domainFilter]);

  const deckWithCards = useMemo(() => {
    return deckEntries
      .map((entry) => {
        const card = allCards.find((c) => c.id === entry.cardId);
        if (!card) return null;
        return { entry, card };
      })
      .filter(Boolean) as { entry: DeckEntry; card: (typeof allCards)[number] }[];
  }, [deckEntries, allCards]);

  const totalCards = deckEntries.reduce((sum, e) => sum + e.count, 0);

  const manaCurve = useMemo(() => {
    const buckets: Record<string, number> = {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6+": 0,
    };

    deckWithCards.forEach(({ card, entry }) => {
      const c = card.cost ?? 0;
      const bucket = c <= 0 ? "0" : c <= 5 ? String(c) : "6+";
      buckets[bucket] += entry.count;
    });

    return buckets;
  }, [deckWithCards]);

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    deckWithCards.forEach(({ card, entry }) => {
      counts[card.domain] = (counts[card.domain] || 0) + entry.count;
    });
    return counts;
  }, [deckWithCards]);

  function addCard(cardId: string) {
    setDeckEntries((prev) => {
      const existing = prev.find((e) => e.cardId === cardId);
      if (existing) {
        return prev.map((e) =>
          e.cardId === cardId ? { ...e, count: e.count + 1 } : e,
        );
      }
      return [...prev, { cardId, count: 1 }];
    });
  }

  function removeCard(cardId: string) {
    setDeckEntries((prev) =>
      prev
        .map((e) => (e.cardId === cardId ? { ...e, count: e.count - 1 } : e))
        .filter((e) => e.count > 0),
    );
  }

  function clearDeck() {
    setDeckEntries([]);
  }

  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl px-4 space-y-6 sm:space-y-8">
        <section
          className="
            rounded-3xl border border-white/25 bg-[radial-gradient(circle_at_top,#020617,#020617_40%,#020617_70%,#020617_100%)]
            px-5 py-5 shadow-[0_0_50px_rgba(0,0,0,0.95)] sm:px-8 sm:py-7
          "
        >
          <h1 className="mb-2 text-2xl font-semibold text-amber-50 sm:text-3xl">
            Deck Builder
          </h1>
          <p className="max-w-3xl text-sm text-amber-50/85">
            Build and refine Riftbound decks in real time. Search the card pool,
            tune your curve, track domains, and get ready for ranked queues as
            soon as the API is live.
          </p>

          <div className="mt-4 rounded-2xl border border-sky-200/35 bg-sky-950/60 px-4 py-3 text-xs text-sky-50/85">
            <p>
              <span className="font-semibold text-sky-100">Layout preview:</span>{" "}
              Card search on the left, deck list in the middle, and stats /
              exports on the right. All interactions below are wired up so we can
              plug in real data later without redesigning the UI.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/25 bg-black/45 px-4 py-3 text-xs text-amber-100/85">
            <span className="font-semibold text-amber-200">Save behavior:</span>
            <span className="flex-1">
              Browsing and brewing are public. Signing in is only for saving
              decks, syncing them to your account, and other persistence-shaped
              nonsense.
            </span>
            {!userId && authEnabled ? (
              <Link href="/sign-in" className={BUTTON_PRIMARY}>
                Sign in to save decks
              </Link>
            ) : null}
          </div>
        </section>

        <div
          className="
            rift-flicker mt-4 rounded-xl border border-amber-300/30 bg-black/50
            px-4 py-3 text-[12px] text-amber-100/80 shadow-[0_0_15px_rgba(0,0,0,0.6)]
          "
        >
          <p>
            <span className="font-semibold text-amber-200">Developer Note:</span>{" "}
            This is the deck builder’s skeleton crew. Once Riot opens the
            Riftbound data gates, the real card pool will replace these mock
            minions instantly.
          </p>
        </div>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-5">
          <div className={PANEL}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-amber-200">
                  Card search
                </h2>
                <p className="text-[11px] text-amber-100/70">
                  Search by name, type, domain, or keyword. Click a card to add
                  it to your deck.
                </p>
              </div>
            </div>

            <div className="mb-3">
              <label className={LABEL} htmlFor="card-search">
                Search cards
              </label>
              <input
                id="card-search"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder='Try "Flame", "Guard", or "Spell"'
                className={INPUT}
              />
            </div>

            <div className="mb-3">
              <div className={LABEL}>Filter by Domain</div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDomainFilter(null)}
                  className={
                    "rounded-full border px-3 py-1 " +
                    (domainFilter === null
                      ? "border-amber-300 bg-amber-400/20 text-amber-100"
                      : "border-white/30 bg-black/40 text-amber-50/80 hover:bg-white/5")
                  }
                >
                  All
                </button>
                {DOMAIN_ORDER.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setDomainFilter((prev) => (prev === d ? null : d))
                    }
                    className={
                      "rounded-full border px-3 py-1 " +
                      (domainFilter === d
                        ? "border-amber-300 bg-amber-400/20 text-amber-100"
                        : "border-white/30 bg-black/40 text-amber-50/80 hover:bg-white/5")
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 h-[360px] space-y-1 overflow-y-auto pr-1 sm:h-[420px]">
              {filteredCards.length === 0 ? (
                <div className="text-[11px] italic text-amber-100/65">
                  No cards match your filters yet. Once the API is wired up, this
                  will show the live Riftbound card pool.
                </div>
              ) : (
                filteredCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => addCard(card.id)}
                    className="
                      flex w-full items-start justify-between gap-2 rounded-xl border border-white/20
                      bg-black/50 px-3 py-2 text-left text-xs text-amber-50
                      hover:border-amber-300 hover:bg-black/70
                    "
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-400/95 px-2 py-[1px] text-[10px] font-semibold text-slate-950 shadow">
                          {card.cost}
                        </span>
                        <span className="text-[12px] font-semibold">{card.name}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-amber-100/70">
                        <span>{card.type}</span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-2 py-[1px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          <span>{card.domain}</span>
                        </span>
                        {card.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="rounded-full border border-white/15 bg-slate-900/70 px-2 py-[1px]"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="rounded-full bg-amber-400/90 px-2 py-1 text-[10px] font-semibold text-slate-950 shadow">
                        Add
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={PANEL}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-amber-200">Deck list</h2>
                <p className="text-[11px] text-amber-100/70">
                  Rename your deck, manage card counts, and see your total card
                  count.
                </p>
              </div>
              <button type="button" onClick={clearDeck} className={BUTTON_GHOST}>
                Clear deck
              </button>
            </div>

            <div className="mb-3">
              <label className={LABEL} htmlFor="deck-name">
                Deck name
              </label>
              <input
                id="deck-name"
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className={INPUT}
              />
            </div>

            <div className="mb-3 flex items-center justify-between text-[11px] text-amber-100/75">
              <span>
                <span className="font-semibold">{totalCards}</span> cards in deck
                • <span className="font-semibold">{deckEntries.length || 0}</span>{" "}
                unique
              </span>
              <span className="text-amber-200/80">Target: 40–60 cards</span>
            </div>

            <div className="h-[420px] space-y-1.5 overflow-y-auto pr-1">
              {deckWithCards.length === 0 ? (
                <div className="text-[11px] italic text-amber-100/65">
                  Your deck is empty. Use the card search on the left to add
                  cards.
                </div>
              ) : (
                deckWithCards.map(({ card, entry }) => (
                  <div
                    key={entry.cardId}
                    className="
                      flex items-center justify-between gap-2 rounded-xl border border-white/20
                      bg-black/55 px-3 py-2 text-xs
                    "
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-400/95 px-2 py-[1px] text-[10px] font-semibold text-slate-950 shadow">
                          {card.cost}
                        </span>
                        <span className="truncate font-semibold text-amber-50">
                          {card.name}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-amber-100/70">
                        <span>{card.type}</span>
                        <span>{card.domain}</span>
                        {!!card.keywords.length && (
                          <span className="max-w-[150px] truncate sm:max-w-[220px]">
                            {card.keywords.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => removeCard(card.id)}
                        className={BUTTON_GHOST}
                      >
                        −
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold text-amber-50">
                        {entry.count}
                      </span>
                      <button
                        type="button"
                        onClick={() => addCard(card.id)}
                        className={BUTTON_GHOST}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={PANEL}>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-amber-200">
                Curve & domains
              </h2>
              <p className="text-[11px] text-amber-100/70">
                Simple deck stats. Later this can power win-rate models, matchup
                tables, and export codes.
              </p>
            </div>

            <div className="mb-4">
              <div className={LABEL}>Cost curve (card count by cost)</div>
              <div className="mt-2 space-y-1.5 text-[11px]">
                {Object.entries(manaCurve).map(([bucket, count]) => {
                  const barWidth =
                    totalCards === 0 ? 0 : Math.max(8, (count / totalCards) * 100);
                  return (
                    <div key={bucket} className="flex items-center gap-2">
                      <span className="w-8 text-amber-100/75">{bucket}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full border border-white/15 bg-black/60">
                        <div
                          className="h-full bg-amber-400/90"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-amber-100/80">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <div className={LABEL}>Domain mix</div>
              <div className="mt-2 space-y-1 text-[11px]">
                {DOMAIN_ORDER.map((d) => {
                  const count = domainCounts[d] || 0;
                  if (totalCards === 0 && count === 0) {
                    return (
                      <div
                        key={d}
                        className="flex items-center justify-between text-amber-100/35"
                      >
                        <span>{d}</span>
                        <span>0</span>
                      </div>
                    );
                  }
                  const pct =
                    totalCards === 0 ? 0 : Math.round((count / totalCards) * 100);
                  return (
                    <div key={d} className="flex items-center justify-between">
                      <span className="text-amber-100/75">{d}</span>
                      <span className="text-amber-100/85">
                        {count} <span className="text-amber-200/80">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-3">
              <div className={LABEL}>Export & tools</div>
              <div className="mt-2 space-y-2 text-[11px] text-amber-100/75">
                <p>
                  Once the Riftbound API + NexusArchive DB are live, this area can
                  generate:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>Shareable deck codes / permalinks</li>
                  <li>Price estimates from TCG/Steam/market APIs</li>
                  <li>Matchup & win-rate projections powered by HoldIQ-style ML</li>
                </ul>
              </div>
              <div className="mt-3 rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-[11px] text-amber-100/75">
                {userId
                  ? "You are signed in, so this builder is ready for future save hooks as soon as the persistence layer finishes crawling out of the basement."
                  : authEnabled
                    ? "You can build decks without logging in. Signing in only matters when we turn on save-to-account and sync."
                    : "Auth is still asleep in this environment, so save-to-account is parked until the real Clerk keys wake it up."}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={BUTTON_PRIMARY}>
                  Copy deck (coming soon)
                </button>
                <button type="button" className={BUTTON_GHOST}>
                  Export to text
                </button>
                {!userId && authEnabled ? (
                  <Link href="/sign-in" className={BUTTON_GHOST}>
                    Sign in for saves
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="pt-2">
          <Link
            href="/riftbound/cards"
            prefetch={false}
            className="text-xs font-medium text-amber-200 hover:text-white"
          >
            ← Back to Card Gallery
          </Link>
        </div>
      </div>
    </main>
  );
}
