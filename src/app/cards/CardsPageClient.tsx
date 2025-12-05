"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Card = {
  id: number;
  name: string;
  type: string | null;
  domains: string[] | null;
  energyCost: number | null;
  power: number | null;
  might: number | null;
  hp: number | null;
  rarity: string | null;
  text: string | null;
};

// Shared styling tokens (mirrors Advanced Search / Deck Builder)
const PANEL =
  "rounded-3xl border border-white/25 bg-black/75 shadow-[0_0_45px_rgba(0,0,0,0.98)] px-5 py-5 sm:px-8 sm:py-7";
const LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-amber-100/80";
const INPUT =
  "h-10 flex-1 rounded-md border border-white/25 bg-black/60 px-3 text-sm text-amber-50 placeholder:text-amber-200/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/80";

export default function CardGalleryPage() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cards whenever ?q changes
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/cards${q ? `?q=${encodeURIComponent(q)}` : ""}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCards(data.cards ?? []);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load cards.");
        setCards([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [q]);

  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl px-4 space-y-6 sm:space-y-8">
        {/* Main card gallery panel */}
        <section className={PANEL}>
          {/* Header */}
          <header className="space-y-1 mb-4">
            <h1 className="text-2xl sm:text-3xl font-semibold text-amber-50">
              Card Gallery
            </h1>
            <p className="text-sm text-amber-50/80 max-w-2xl">
              Browse Riftbound cards and filter by name or rules text. Once the
              full API is live, this will show the complete card pool for every
              domain and set.
            </p>
          </header>

          {/* Search bar – regular GET form, URL controls q */}
          <form method="GET" className="flex max-w-md gap-2 mb-2">
            <div className="flex-1">
              <label className={LABEL} htmlFor="card-search">
                Search cards
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="card-search"
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search by name, rules texr or any keyword…"
                  className={INPUT}
                />
                <button
                  type="submit"
                  className="
                             h-10 rounded-full
                             bg-amber-400/95 px-4 text-sm font-semibold text-slate-950
                             shadow-[0_0_20px_rgba(0,0,0,0.9)]
                             hover:bg-amber-300
                             "
                 >
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Small status / debug line */}
          <div className="text-[11px] text-amber-100/70 mb-3">
            Search query: “{q || " (none)"}” · {cards.length} card
            {cards.length === 1 ? "" : "s"} found
            {loading ? " · Loading…" : ""}
            {error ? ` · ${error}` : ""}
          </div>

          {/* Results table */}
          <div className="rounded-2xl border border-white/20 bg-black/60 overflow-hidden">
            <div className="border-b border-white/15 px-4 py-2 text-[11px] uppercase tracking-wide text-amber-100/70">
              {cards.length} card{cards.length === 1 ? "" : "s"} found
              {q ? ` for "${q}"` : ""}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-black/70 text-xs uppercase text-amber-100/70">
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Domains</th>
                    <th className="px-4 py-2 text-left">Cost</th>
                    <th className="px-4 py-2 text-left">Stats</th>
                    <th className="px-4 py-2 text-left">Rarity</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr
                      key={card.id}
                      className="border-t border-white/10 hover:bg-white/5"
                    >
                      <td className="px-4 py-2 align-top">
                        <div className="font-medium text-amber-50">
                          {card.name}
                        </div>
                        {card.text && (
                          <div className="text-xs text-amber-100/75 line-clamp-2">
                            {card.text}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-amber-50/85 align-top">
                        {card.type}
                      </td>
                      <td className="px-4 py-2 text-amber-50/85 align-top">
                        {card.domains?.length
                          ? card.domains.join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-amber-50/85 align-top">
                        {card.energyCost ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-amber-50/85 align-top">
                        {card.power != null ||
                        card.might != null ||
                        card.hp != null
                          ? `${card.power ?? "-"} / ${card.might ?? "-"} / ${
                              card.hp ?? "-"
                            }`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-amber-50/85 align-top">
                        {card.rarity ?? "—"}
                      </td>
                    </tr>
                  ))}

                  {!loading && cards.length === 0 && !error && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-sm text-amber-100/65"
                      >
                        No cards found.
                      </td>
                    </tr>
                  )}

                  {error && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-sm text-red-300/90"
                      >
                        {error}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 🔮 Riot-style API waiting message (with flicker) */}
        <div
          className="
            rift-flicker
            mt-1 rounded-xl border border-amber-300/30 bg-black/55
            px-4 py-3 text-[12px] text-amber-100/85 shadow-[0_0_15px_rgba(0,0,0,0.6)]
          "
        >
          <p>
            <span className="font-semibold text-amber-200">
              Developer Note:
            </span>{" "}
            This card gallery is still running on a tiny test pool. Once Riot
            opens the Riftbound content API, the full archive will step through
            the portal and replace these mock listings instantly.
          </p>
        </div>
      </div>
    </main>
  );
}
