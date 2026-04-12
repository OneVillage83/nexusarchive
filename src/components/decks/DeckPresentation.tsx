"use client";

import { useState, type FocusEvent, type PointerEvent } from "react";
import Image from "next/image";

import {
  computeDeckStats,
  getDeckSections,
  getRulesModeLabel,
  type DeckBuilderEntry,
  type DeckRulesModeValue,
} from "@/lib/decks/config";
import type { GameSlug } from "@/lib/games";

const SURFACE =
  "rounded-[28px] border border-white/10 bg-black/45 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-sm";

function isLandscapeCard(entry: Pick<DeckBuilderEntry, "sectionKey" | "typeLine">) {
  return (
    entry.sectionKey === "battlefields" ||
    (entry.typeLine ?? "").toLowerCase().includes("battlefield")
  );
}

function CardThumbnail({
  imageUrl,
  alt,
  landscape,
  workspace = false,
}: {
  imageUrl: string | null | undefined;
  alt: string;
  landscape: boolean;
  workspace?: boolean;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl border border-white/12 bg-black/55 ${
        workspace
          ? landscape
            ? "h-[132px] w-full"
            : "h-[300px] w-full"
          : landscape
            ? "h-16 w-[104px]"
            : "h-[92px] w-[66px]"
      }`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          unoptimized
          sizes={
            workspace
              ? landscape
                ? "220px"
                : "220px"
              : landscape
                ? "104px"
                : "66px"
          }
          className="object-contain"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-amber-50/45">
          No art
        </div>
      )}
    </div>
  );
}

function CardTextPreviewPill({
  cardName,
  text,
  typeLine,
}: {
  cardName: string;
  text?: string | null;
  typeLine?: string | null;
}) {
  const previewText = text?.trim() || typeLine?.trim() || null;
  const [popoverSide, setPopoverSide] = useState<"left" | "right">("right");

  if (!previewText) {
    return null;
  }

  function handleOpen(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    updatePopoverSide(rect.left, rect.right);
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    updatePopoverSide(rect.left, rect.right);
  }

  function updatePopoverSide(left: number, right: number) {
    const preferredWidth = 360;
    const viewportPadding = 16;
    const spaceRight = window.innerWidth - left - viewportPadding;
    const spaceLeft = right - viewportPadding;

    setPopoverSide(spaceRight >= preferredWidth || spaceRight >= spaceLeft ? "right" : "left");
  }

  return (
    <div
      className="group/textpill pointer-events-auto absolute right-2 top-11 z-20"
      onPointerEnter={handleOpen}
      onFocusCapture={handleFocus}
    >
      <div className="rounded-full border border-white/12 bg-black/78 px-2 py-1 text-[10px] font-semibold text-amber-100 shadow-[0_8px_18px_rgba(0,0,0,0.3)]">
        Card text
      </div>

      <div
        className={`pointer-events-none absolute top-full z-10 mt-2 w-[360px] max-w-[min(360px,calc(100vw-2rem))] translate-y-1 rounded-[22px] border border-white/14 bg-black/96 p-4 text-left opacity-0 shadow-[0_22px_45px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover/textpill:pointer-events-auto group-hover/textpill:translate-y-0 group-hover/textpill:opacity-100 ${
          popoverSide === "right" ? "left-0" : "right-0"
        }`}
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/75">
          Card text
        </div>
        <div className="mt-1 text-sm font-semibold text-amber-50">{cardName}</div>
        {typeLine ? (
          <div className="mt-1 text-xs text-amber-50/60">{typeLine}</div>
        ) : null}
        <div className="mt-3 max-h-72 overflow-y-auto pr-1 text-[15px] leading-6 text-amber-50/96 whitespace-pre-line break-words">
          {previewText}
        </div>
      </div>
    </div>
  );
}

type DeckCanvasProps = {
  game: GameSlug;
  formatKey: string;
  entries: DeckBuilderEntry[];
  editable?: boolean;
  workspace?: boolean;
  showBoardHeader?: boolean;
  showEmptySections?: boolean;
  emptyMessage?: string | null;
  onIncrement?: (familyKey: string) => void;
  onDecrement?: (familyKey: string) => void;
  onRemove?: (familyKey: string) => void;
  onSectionChange?: (familyKey: string, sectionKey: string) => void;
};

export function DeckCanvas({
  game,
  formatKey,
  entries,
  editable = false,
  workspace = false,
  showBoardHeader = true,
  showEmptySections = true,
  emptyMessage = "Search a card to start building.",
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
  const visibleSections = workspace
    ? sections.filter((section) => (entriesBySection.get(section.key) ?? []).length > 0)
    : sections;
  const totalCards = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const hasVisibleSections = visibleSections.length > 0;

  return (
    <section className={workspace ? "flex h-full min-h-0 flex-col gap-4" : "space-y-4"}>
      {showBoardHeader ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
              Deck Board
            </p>
            <h2 className="mt-2 text-xl font-semibold text-amber-50">
              Category columns
            </h2>
            <p className="mt-1 text-sm text-amber-50/70">
              Build straight on the board. Each lane owns its own cardboard mess.
            </p>
          </div>
          <div className="rounded-full border border-white/12 bg-black/45 px-4 py-2 text-xs text-amber-100/75">
            {totalCards} cards across {visibleSections.length || sections.length} columns
          </div>
        </div>
      ) : null}

      {!hasVisibleSections ? (
        workspace ? (
          emptyMessage ? (
            <div className="flex flex-1 items-center justify-center text-sm text-amber-50/40">
              {emptyMessage}
            </div>
          ) : (
            <div className="flex-1 min-h-0" />
          )
        ) : null
      ) : (
      <div className={workspace ? "min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-2" : "overflow-x-auto pb-2"}>
        <div className={workspace ? "flex flex-wrap content-start items-start gap-6" : "flex min-w-max gap-3 lg:gap-4"}>
          {visibleSections.map((section) => {
            const cards = entriesBySection.get(section.key) ?? [];
            const sectionTotalCards = cards.reduce((sum, entry) => sum + entry.quantity, 0);

            return (
              <section
                key={section.key}
                className={
                  workspace
                    ? "w-[214px] shrink-0 space-y-3"
                    : `${SURFACE} w-[250px] shrink-0 p-3`
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-100">
                      {section.label}
                    </h3>
                    {!workspace ? (
                      <p className="mt-1 text-[11px] leading-5 text-amber-50/52">
                        {section.description}
                      </p>
                    ) : null}
                  </div>
                  <span className={`rounded-full ${workspace ? "border border-white/10 bg-black/30" : "border border-white/12 bg-black/60"} px-2.5 py-1 text-[11px] font-semibold text-amber-200`}>
                    {sectionTotalCards}
                  </span>
                </div>

                <div className={workspace ? "space-y-3" : "space-y-2.5"}>
                  {cards.length === 0 && showEmptySections ? (
                    <div className="rounded-2xl border border-dashed border-white/12 bg-black/35 px-3 py-6 text-center text-[11px] text-amber-50/45">
                      Empty column. Add something reckless.
                    </div>
                  ) : (
                    cards.map((entry) => {
                      const landscape = isLandscapeCard(entry);

                      if (workspace) {
                        return (
                          <article
                            key={entry.familyKey}
                            className="group relative"
                          >
                            <CardThumbnail
                              imageUrl={entry.imageUrl}
                              alt={entry.cardName}
                              landscape={landscape}
                              workspace
                            />

                            {editable ? (
                              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/88 via-black/35 to-transparent opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                                <div className="pointer-events-auto absolute right-2 top-2 rounded-full border border-white/12 bg-black/70 px-2 py-1 text-[10px] font-semibold text-amber-100 shadow-[0_8px_18px_rgba(0,0,0,0.3)]">
                                  x{entry.quantity}
                                </div>

                                <CardTextPreviewPill
                                  cardName={entry.cardName}
                                  text={entry.text}
                                  typeLine={entry.typeLine}
                                />

                                <div className="pointer-events-auto absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => onDecrement?.(entry.familyKey)}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/75 text-sm text-amber-50 hover:bg-white/10"
                                    >
                                      −
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onIncrement?.(entry.familyKey)}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/75 text-sm text-amber-50 hover:bg-white/10"
                                    >
                                      +
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => onRemove?.(entry.familyKey)}
                                    className="rounded-full border border-rose-300/20 bg-rose-500/15 px-3 py-1.5 text-[10px] font-semibold text-rose-100 hover:bg-rose-500/25"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </article>
                        );
                      }

                      return (
                        <article
                          key={entry.familyKey}
                          className={
                            "rounded-2xl border border-white/12 bg-black/60 p-2.5 shadow-[0_10px_22px_rgba(0,0,0,0.28)]"
                          }
                        >
                          <div className="flex gap-3">
                            <CardThumbnail
                              imageUrl={entry.imageUrl}
                              alt={entry.cardName}
                              landscape={landscape}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="truncate text-sm font-semibold text-amber-50">
                                    {entry.cardName}
                                  </h4>
                                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-amber-50/58">
                                    {entry.typeLine ?? "Card"}
                                  </p>
                                </div>
                                <span className="rounded-xl border border-white/12 bg-black/55 px-2 py-1 text-[10px] font-semibold text-amber-200">
                                  x{entry.quantity}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-amber-100/72">
                                {entry.cost != null ? (
                                  <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-1">
                                    Cost {entry.cost}
                                  </span>
                                ) : null}
                                {entry.domainValues.slice(0, 2).map((domain) => (
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
                                  <div className="flex flex-wrap items-center gap-1.5">
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

                                  <label className="block text-[10px] uppercase tracking-[0.2em] text-amber-200/62">
                                    Move To
                                    <select
                                      value={entry.sectionKey}
                                      onChange={(event) =>
                                        onSectionChange?.(
                                          entry.familyKey,
                                          event.target.value,
                                        )
                                      }
                                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/55 px-2.5 py-2 text-[11px] text-amber-50"
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
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      )}
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
    <section className={`${SURFACE} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
            Deck Snapshot
          </p>
          <h2 className="mt-2 text-xl font-semibold text-amber-50">
            {game === "magic-the-gathering"
              ? "Mana, type, and color read"
              : game === "one-piece"
                ? "Crew, color, and DON!! read"
                : "Domain, curve, and section read"}
          </h2>
          <p className="mt-1 text-sm text-amber-50/65">
            Rules mode: {getRulesModeLabel(game, rulesMode)}.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.headline.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-white/12 bg-black/50 p-3"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/72">
              {metric.label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-amber-50">
              {metric.value}
            </div>
            {metric.note ? (
              <div className="mt-1 text-xs text-amber-50/58">{metric.note}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="grid gap-4">
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
                Nothing obvious is exploding in the rules layer right now.
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
          <div className="text-xs text-amber-50/48">
            No numbers yet. Add some cardboard and this section gets chatty.
          </div>
        ) : (
          bars.map((bar) => (
            <div key={bar.key}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs text-amber-50/75">
                <span>{bar.label}</span>
                <span>
                  {bar.count}{" "}
                  <span className="text-amber-200/65">({bar.percent}%)</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-black/55">
                <div
                  className="h-full bg-amber-400/90"
                  style={{
                    width: `${Math.max(bar.percent, bar.count > 0 ? 6 : 0)}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
