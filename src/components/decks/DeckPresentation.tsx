"use client";

import Image from "next/image";

import {
  computeDeckStats,
  getDeckSections,
  getRulesModeLabel,
  type DeckBuilderEntry,
  type DeckRulesModeValue,
} from "@/lib/decks/config";
import type { GameSlug } from "@/lib/games";

const PANEL =
  "rounded-3xl border border-white/15 bg-black/70 shadow-[0_0_35px_rgba(0,0,0,0.78)]";

type DeckCanvasProps = {
  game: GameSlug;
  formatKey: string;
  entries: DeckBuilderEntry[];
  editable?: boolean;
  onIncrement?: (familyKey: string) => void;
  onDecrement?: (familyKey: string) => void;
  onRemove?: (familyKey: string) => void;
  onSectionChange?: (familyKey: string, sectionKey: string) => void;
};

function isLandscapeCard(entry: DeckBuilderEntry) {
  return (
    entry.sectionKey === "battlefields" ||
    (entry.typeLine ?? "").toLowerCase().includes("battlefield")
  );
}

export function DeckCanvas({
  game,
  formatKey,
  entries,
  editable = false,
  onIncrement,
  onDecrement,
  onRemove,
  onSectionChange,
}: DeckCanvasProps) {
  const sections = getDeckSections(game, formatKey);
  const entriesBySection = new Map(
    sections.map((section) => [
      section.key,
      entries
        .filter((entry) => entry.sectionKey === section.key)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    ]),
  );

  return (
    <section className={`${PANEL} p-4 sm:p-5`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Deck Canvas
          </p>
          <h2 className="mt-2 text-xl font-semibold text-amber-50">
            Build in live columns
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-amber-50/75">
            Each section keeps its own lane, so the deck reads more like an actual
            build surface and less like a giant receipt.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          className="grid min-w-max gap-4"
          style={{
            gridTemplateColumns: `repeat(${sections.length}, minmax(220px, 1fr))`,
          }}
        >
          {sections.map((section) => {
            const cards = entriesBySection.get(section.key) ?? [];
            const totalCards = cards.reduce((sum, entry) => sum + entry.quantity, 0);

            return (
              <div
                key={section.key}
                className="rounded-2xl border border-white/10 bg-black/45 p-3 shadow-[0_0_20px_rgba(0,0,0,0.4)]"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-100">
                      {section.label}
                    </h3>
                    <p className="mt-1 text-[11px] text-amber-50/60">
                      {section.description}
                    </p>
                  </div>
                  <div className="rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                    {totalCards}
                  </div>
                </div>

                <div className="space-y-3">
                  {cards.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-black/35 px-3 py-5 text-center text-[11px] text-amber-50/50">
                      Empty for now. Add a card and this column wakes up.
                    </div>
                  ) : (
                    cards.map((entry) => (
                      <article
                        key={entry.familyKey}
                        className="rounded-2xl border border-white/12 bg-black/65 p-2 shadow-[0_0_16px_rgba(0,0,0,0.45)]"
                      >
                        <div className="flex gap-3">
                          <div
                            className={`relative overflow-hidden rounded-xl border border-white/10 bg-black/50 ${
                              isLandscapeCard(entry)
                                ? "h-24 w-32"
                                : "h-28 w-20"
                            }`}
                          >
                            {entry.imageUrl ? (
                              <Image
                                src={entry.imageUrl}
                                alt={entry.cardName}
                                fill
                                sizes={isLandscapeCard(entry) ? "128px" : "80px"}
                                className="object-contain"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-amber-50/45">
                                No art loaded yet
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="truncate text-sm font-semibold text-amber-50">
                                  {entry.cardName}
                                </h4>
                                <p className="mt-0.5 text-[11px] text-amber-50/60">
                                  {entry.typeLine ?? "Card"}
                                </p>
                              </div>
                              <div className="rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-semibold text-amber-200">
                                x{entry.quantity}
                              </div>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-amber-50/75">
                              {entry.cost != null ? (
                                <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-1 text-amber-100">
                                  Cost {entry.cost}
                                </span>
                              ) : null}
                              {entry.domainValues.slice(0, 3).map((domain) => (
                                <span
                                  key={domain}
                                  className="rounded-full border border-white/10 bg-white/5 px-2 py-1"
                                >
                                  {domain}
                                </span>
                              ))}
                              {entry.versionLabel ? (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                                  {entry.versionLabel}
                                </span>
                              ) : null}
                            </div>

                            {editable ? (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onDecrement?.(entry.familyKey)}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/60 text-sm text-amber-50 hover:bg-white/10"
                                  >
                                    −
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onIncrement?.(entry.familyKey)}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/60 text-sm text-amber-50 hover:bg-white/10"
                                  >
                                    +
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onRemove?.(entry.familyKey)}
                                    className="rounded-full border border-rose-300/20 bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold text-rose-100 hover:bg-rose-500/20"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <label className="block text-[10px] uppercase tracking-[0.22em] text-amber-200/65">
                                  Move To
                                  <select
                                    value={entry.sectionKey}
                                    onChange={(event) =>
                                      onSectionChange?.(
                                        entry.familyKey,
                                        event.target.value,
                                      )
                                    }
                                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/55 px-2 py-1.5 text-[11px] text-amber-50"
                                  >
                                    {sections.map((sectionOption) => (
                                      <option
                                        key={sectionOption.key}
                                        value={sectionOption.key}
                                      >
                                        {sectionOption.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type DeckStatsPanelProps = {
  game: GameSlug;
  formatKey: string;
  rulesMode: DeckRulesModeValue;
  entries: DeckBuilderEntry[];
};

export function DeckStatsPanel({
  game,
  formatKey,
  rulesMode,
  entries,
}: DeckStatsPanelProps) {
  const stats = computeDeckStats(game, formatKey, rulesMode, entries);

  return (
    <section className={`${PANEL} p-4 sm:p-5`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Deck Stats
          </p>
          <h2 className="mt-2 text-xl font-semibold text-amber-50">
            {game === "magic-the-gathering"
              ? "Mana, type, and format snapshot"
              : game === "one-piece"
                ? "Leader, color, and DON!! snapshot"
                : "Domain, curve, and section snapshot"}
          </h2>
          <p className="mt-1 text-sm text-amber-50/70">
            Rules mode: {getRulesModeLabel(game, rulesMode)}.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.headline.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-white/12 bg-black/55 p-3"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200/70">
              {metric.label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-amber-50">
              {metric.value}
            </div>
            {metric.note ? (
              <div className="mt-1 text-xs text-amber-50/60">{metric.note}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          <StatsBarGroup title="Section mix" bars={stats.sectionBars} />
          <StatsBarGroup
            title={game === "magic-the-gathering" ? "Mana curve" : "Cost curve"}
            bars={stats.curveBars}
          />
          <StatsBarGroup
            title={game === "riftbound" ? "Domain mix" : "Color split"}
            bars={stats.domainBars}
          />
        </div>

        <div className="rounded-2xl border border-white/12 bg-black/50 p-4">
          <h3 className="text-sm font-semibold text-amber-100">
            Legality & build notes
          </h3>
          <div className="mt-3 space-y-2 text-sm">
            {stats.issues.length === 0 ? (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-emerald-100">
                This shell is not throwing obvious legality tantrums right now.
              </div>
            ) : (
              stats.issues.map((issue, index) => (
                <div
                  key={`${issue.message}-${index}`}
                  className={`rounded-2xl border px-3 py-2 ${
                    issue.severity === "error"
                      ? "border-rose-300/20 bg-rose-500/10 text-rose-100"
                      : issue.severity === "warning"
                        ? "border-amber-300/20 bg-amber-500/10 text-amber-100"
                        : "border-sky-300/20 bg-sky-500/10 text-sky-100"
                  }`}
                >
                  {issue.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBarGroup({
  title,
  bars,
}: {
  title: string;
  bars: Array<{
    key: string;
    label: string;
    count: number;
    percent: number;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-black/50 p-4">
      <h3 className="text-sm font-semibold text-amber-100">{title}</h3>
      <div className="mt-3 space-y-2">
        {bars.length === 0 || bars.every((bar) => bar.count === 0) ? (
          <div className="text-xs text-amber-50/50">
            Nothing here yet. Add some cards and the numbers stop being coy.
          </div>
        ) : (
          bars.map((bar) => (
            <div key={bar.key}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs text-amber-50/75">
                <span>{bar.label}</span>
                <span>
                  {bar.count} <span className="text-amber-200/65">({bar.percent}%)</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-black/55">
                <div
                  className="h-full bg-amber-400/90"
                  style={{ width: `${Math.max(bar.percent, bar.count > 0 ? 6 : 0)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
