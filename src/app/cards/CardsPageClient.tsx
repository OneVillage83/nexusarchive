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
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Card Gallery</h1>
        <p className="text-sm text-slate-400">
          Browse Riftbound cards and filter by name or rules text.
        </p>
      </header>

      {/* Search bar – regular GET form, URL controls q */}
      <form method="GET" className="flex max-w-md gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search cards…"
          className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-emerald-500 px-4 text-sm font-medium text-slate-950 hover:bg-emerald-400"
        >
          Search
        </button>
      </form>

      {/* Small status / debug line */}
      <div className="text-xs text-slate-500">
        Search query: “{q || " (none)"}” · {cards.length} card
        {cards.length === 1 ? "" : "s"} found
        {loading ? " · Loading…" : ""}
        {error ? ` · ${error}` : ""}
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 px-4 py-2 text-xs uppercase tracking-wide text-slate-400">
          {cards.length} card{cards.length === 1 ? "" : "s"} found
          {q ? ` for "${q}"` : ""}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
              <tr>
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
                  className="border-t border-slate-800 hover:bg-slate-900/70"
                >
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-100">{card.name}</div>
                    {card.text && (
                      <div className="text-xs text-slate-400 line-clamp-2">
                        {card.text}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-300">{card.type}</td>
                  <td className="px-4 py-2 text-slate-300">
                    {card.domains?.join(", ") || "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-300">
                    {card.energyCost ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-300">
                    {card.power != null ||
                    card.might != null ||
                    card.hp != null
                      ? `${card.power ?? "-"} / ${card.might ?? "-"} / ${
                          card.hp ?? "-"
                        }`
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-300">{card.rarity}</td>
                </tr>
              ))}

              {!loading && cards.length === 0 && !error && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No cards found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
