"use client";

import type { ReactNode } from "react";

import type {
  ComboMatchBucket,
  ComboResultSummary,
} from "@/lib/combos/types";

export const SURFACE =
  "rounded-[28px] border border-white/12 bg-black/45 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-sm";
export const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/75";

export function CardArt({
  imageUrl,
  alt,
}: {
  imageUrl: string | null;
  alt: string;
}) {
  if (!imageUrl) {
    return (
      <div className="flex h-[84px] w-[60px] items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 text-[10px] text-amber-100/50">
        No art
      </div>
    );
  }

  return (
    <div
      aria-label={alt}
      className="h-[84px] w-[60px] rounded-xl border border-white/10 bg-black/50"
      style={{
        backgroundImage: `url("${imageUrl}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "owned" | "missing";
}) {
  const toneClass =
    tone === "owned"
      ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
      : tone === "missing"
        ? "border-rose-300/20 bg-rose-500/10 text-rose-100"
        : "border-white/12 bg-black/45 text-amber-50/80";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] ${toneClass}`}>
      {children}
    </span>
  );
}

export function bucketLabel(bucket: ComboMatchBucket) {
  switch (bucket) {
    case "exactMatches":
      return "Already In Your Deck";
    case "nearMisses":
      return "Nearly There";
    case "synergySuggestions":
    default:
      return "Synergy Suggestions";
  }
}

export function ResultCard({
  combo,
  selected,
  onSelect,
  onLoad,
}: {
  combo: ComboResultSummary;
  selected: boolean;
  onSelect: (slug: string) => void;
  onLoad: (combo: ComboResultSummary) => void;
}) {
  return (
    <article
      id={combo.slug}
      className={`rounded-[26px] border p-4 sm:p-5 ${
        selected
          ? "border-amber-300/45 bg-amber-400/10"
          : "border-white/12 bg-black/38"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelect(combo.slug)}
          className="min-w-0 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-amber-50">{combo.name}</h3>
            <Badge>{combo.kind}</Badge>
            <Badge>{combo.source}</Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-amber-100/78">
            {combo.summary ?? combo.resultText ?? "No summary logged yet."}
          </p>
        </button>
        <button
          type="button"
          onClick={() => onLoad(combo)}
          className="rounded-full border border-white/12 bg-black/55 px-3 py-2 text-[11px] font-semibold text-amber-50 hover:bg-white/10"
        >
          Open in Deck Builder
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {combo.tags.map((tag) => (
          <Badge key={`${combo.slug}-${tag}`}>{tag}</Badge>
        ))}
        {combo.formatTags.map((tag) => (
          <Badge key={`${combo.slug}-${tag}`}>{tag}</Badge>
        ))}
      </div>

      {combo.match ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-3">
          <div className="text-sm text-amber-50/85">{combo.match.reason}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="owned">
              {combo.match.ownedCount}/{combo.match.totalCount} owned
            </Badge>
            {combo.match.missingPieces.length > 0 ? (
              <Badge tone="missing">{combo.match.missingPieces.length} missing</Badge>
            ) : null}
            {combo.match.ownedPieces.map((piece) => (
              <Badge key={`${combo.slug}-owned-${piece.familyKey}`} tone="owned">
                {piece.quantity}x {piece.cardName}
              </Badge>
            ))}
            {combo.match.missingPieces.map((piece) => (
              <Badge key={`${combo.slug}-missing-${piece.familyKey}`} tone="missing">
                {piece.quantity}x {piece.cardName}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-4">
            {combo.resultText ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className={LABEL}>Outcome</div>
                <p className="mt-2 text-sm text-amber-50/82">{combo.resultText}</p>
              </div>
            ) : null}
            {combo.steps.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className={LABEL}>How It Works</div>
                <ol className="mt-3 space-y-2 text-sm text-amber-50/82">
                  {combo.steps.map((step, index) => (
                    <li key={`${combo.slug}-step-${index}`}>
                      {index + 1}. {step}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            {combo.prerequisites.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className={LABEL}>Prerequisites</div>
                <ul className="mt-3 space-y-2 text-sm text-amber-50/82">
                  {combo.prerequisites.map((item, index) => (
                    <li key={`${combo.slug}-pre-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className={LABEL}>Pieces</div>
            <div className="mt-3 space-y-3">
              {combo.pieces.map((piece) => (
                <div
                  key={`${combo.slug}-${piece.role}-${piece.familyKey}`}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-black/35 p-3"
                >
                  <CardArt imageUrl={piece.imageUrl} alt={piece.cardName} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-amber-50">
                        {piece.quantity}x {piece.cardName}
                      </div>
                      <Badge>{piece.role}</Badge>
                    </div>
                    <div className="mt-1 text-[11px] text-amber-100/70">
                      {piece.typeLine ?? "Catalog card"}
                    </div>
                    {piece.text ? (
                      <p className="mt-2 line-clamp-4 text-xs text-amber-50/75">
                        {piece.text}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
