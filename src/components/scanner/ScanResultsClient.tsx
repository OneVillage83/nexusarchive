"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { buildGamePath } from "@/lib/games";
import type {
  ScannerCandidateView,
  ScannerResultsView,
} from "@/lib/scanner/types";

const PANEL =
  "rounded-3xl border border-white/25 bg-black/75 p-5 shadow-[0_0_45px_rgba(0,0,0,0.95)] sm:p-7";

function formatCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatPercentConfidence(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string" &&
    payload.error.trim()
  ) {
    return payload.error;
  }

  return fallback;
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new Error(readErrorMessage(payload, "Request failed."));
  }

  return payload as T;
}

export function ScanResultsClient({
  initialResults,
  signedIn,
}: {
  initialResults: ScannerResultsView;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [results, setResults] = useState(initialResults);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState("other");
  const [feedbackNote, setFeedbackNote] = useState("");

  async function refreshResults() {
    const next = await requestJson<ScannerResultsView>(
      `/api/scan/${encodeURIComponent(results.id)}/results`,
    );
    setResults(next);
    return next;
  }

  async function handleConfirm(detectionId: string, identificationId: string) {
    setBusyKey(`confirm:${detectionId}:${identificationId}`);
    setError(null);
    setNotice(null);

    try {
      const next = await requestJson<ScannerResultsView>(
        `/api/scan/${encodeURIComponent(results.id)}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ detectionId, identificationId }),
        },
      );
      setResults(next);
      setNotice("Scanner match updated.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to update match.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRetry() {
    setBusyKey("retry");
    setError(null);
    setNotice(null);

    try {
      const next = await requestJson<ScannerResultsView>(
        `/api/scan/${encodeURIComponent(results.id)}/retry`,
        {
          method: "POST",
        },
      );
      setResults(next);
      setNotice("Scan retried.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to retry scan.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleAddToCollection(candidate: ScannerCandidateView) {
    if (!candidate.financeProductId) {
      return;
    }

    setBusyKey(`collection:${candidate.identificationId}`);
    setError(null);
    setNotice(null);

    try {
      await requestJson("/api/finance/portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game: results.game,
          financeProductId: candidate.financeProductId,
          quantity: 1,
        }),
      });

      if (results.intent === "collection") {
        startTransition(() => {
          router.push(buildGamePath(results.game, "collection?fromScan=1"));
        });
        return;
      }

      setNotice("Added to collection.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to add the card to your collection.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleAddToWatchlist(candidate: ScannerCandidateView) {
    if (!candidate.financeProductId) {
      return;
    }

    setBusyKey(`watchlist:${candidate.identificationId}`);
    setError(null);
    setNotice(null);

    try {
      const watchlists = await requestJson<Array<{ id: string; name: string }>>(
        `/api/finance/watchlists?game=${encodeURIComponent(results.game)}`,
      );
      let watchlistId = watchlists[0]?.id ?? null;

      if (!watchlistId) {
        const created = await requestJson<{ id: string }>(
          "/api/finance/watchlists",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              game: results.game,
              name: "Scanner Finds",
            }),
          },
        );
        watchlistId = created.id;
      }

      await requestJson(`/api/finance/watchlists/${encodeURIComponent(watchlistId)}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game: results.game,
          financeProductId: candidate.financeProductId,
        }),
      });

      setNotice("Added to watchlist.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to add the card to a watchlist.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleSubmitFeedback() {
    setBusyKey("feedback");
    setError(null);
    setNotice(null);

    try {
      await requestJson(`/api/scan/${encodeURIComponent(results.id)}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackType,
          note: feedbackNote,
        }),
      });
      setFeedbackNote("");
      setNotice("Feedback saved.");
      await refreshResults();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Failed to save feedback.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <main className="safe-mobile-bottom py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">
                {results.mode === "grade" ? "Grade Scan" : "Quick Scan"}
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-amber-50 sm:text-4xl">
                Scan Results
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-amber-50/82">
                {results.statusMessage}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href={buildGamePath(results.game, "scan")}
                prefetch={false}
                className="w-full rounded-full border border-white/20 px-4 py-2 text-center text-sm text-amber-50 transition hover:bg-white/10 sm:w-auto"
              >
                New scan
              </Link>
              <button
                type="button"
                onClick={handleRetry}
                disabled={busyKey === "retry"}
                className="w-full rounded-full border border-sky-300/35 bg-sky-500/10 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-500/18 disabled:opacity-60 sm:w-auto"
              >
                {busyKey === "retry" ? "Retrying..." : "Retry scan"}
              </button>
            </div>
          </div>

          {!signedIn ? (
            <div className="mt-5 rounded-2xl border border-sky-200/35 bg-sky-950/55 px-4 py-3 text-xs text-sky-50/85">
              You can scan and browse results while signed out. Sign in when you want
              collection or watchlist actions to stick.
            </div>
          ) : null}

          {notice ? (
            <div className="mt-5 rounded-2xl border border-emerald-300/35 bg-emerald-950/55 px-4 py-3 text-sm text-emerald-100">
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-300/35 bg-red-950/55 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}
        </section>

        <section className={PANEL}>
          <h2 className="text-lg font-semibold text-amber-200">Captured Images</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {results.images.map((image) => (
              <article
                key={image.id}
                className="overflow-hidden rounded-[28px] border border-white/15 bg-black/45"
              >
                <img
                  src={image.overlayUrl ?? image.previewUrl}
                  alt={`${image.side} scan`}
                  className="aspect-[4/5] w-full object-cover"
                />
                <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-amber-100/75">
                  <span>{image.side.toUpperCase()}</span>
                  <span>
                    {image.width ?? "?"} × {image.height ?? "?"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {results.qualityReport ? (
          <section className={PANEL}>
            <h2 className="text-lg font-semibold text-amber-200">Quality Gate</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              <Metric label="Quality" value={String(results.qualityReport.qualityScore ?? "—")} />
              <Metric label="Sharpness" value={String(results.qualityReport.sharpnessScore ?? "—")} />
              <Metric label="Glare" value={String(results.qualityReport.glareScore ?? "—")} />
              <Metric label="Framing" value={String(results.qualityReport.framingScore ?? "—")} />
              <Metric label="Perspective" value={String(results.qualityReport.perspectiveScore ?? "—")} />
              <Metric label="Resolution" value={String(results.qualityReport.resolutionScore ?? "—")} />
            </div>

            <div className="mt-4 rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-sm text-amber-50/82">
              Decision: {results.qualityReport.decision ?? "unknown"}
              {results.qualityReport.recaptureMessage ? (
                <div className="mt-2 text-xs text-amber-100/72">
                  {results.qualityReport.recaptureMessage}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {results.pregrade ? (
          <section className={PANEL}>
            <h2 className="text-lg font-semibold text-amber-200">Nexus AI Pre-Grade</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              <Metric label="Centering" value={String(results.pregrade.centeringScore ?? "—")} />
              <Metric label="Corners" value={String(results.pregrade.cornersScore ?? "—")} />
              <Metric label="Edges" value={String(results.pregrade.edgesScore ?? "—")} />
              <Metric label="Surface" value={String(results.pregrade.surfaceScore ?? "—")} />
              <Metric label="Overall" value={String(results.pregrade.nexusPregradeScore ?? "—")} />
              <Metric label="Confidence" value={formatPercentConfidence(results.pregrade.confidence)} />
            </div>

            <div className="mt-4 rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-sm text-amber-50/82">
              Band: {results.pregrade.gradeBand ?? "Uncertain"}
              <div className="mt-2 text-xs text-amber-100/72">
                Internal estimate only. This is not an official PSA, BGS, or CGC grade.
              </div>
            </div>
          </section>
        ) : null}

        {results.recommendation ? (
          <section className={PANEL}>
            <h2 className="text-lg font-semibold text-amber-200">Recommendation</h2>
            <div className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-4">
              <div className="text-base font-semibold text-amber-50">
                {results.recommendation.title}
              </div>
              <div className="mt-2 text-sm text-amber-50/82">
                {results.recommendation.body}
              </div>
              {(results.recommendation.gradeFirstNetValue != null ||
                results.recommendation.rawBestNetValue != null) ? (
                <div className="mt-3 text-xs text-amber-100/72">
                  Grade-first: {formatCurrency(results.recommendation.gradeFirstNetValue)} ·
                  Best raw route
                  {results.recommendation.rawBestLabel
                    ? ` (${results.recommendation.rawBestLabel})`
                    : ""}
                  : {formatCurrency(results.recommendation.rawBestNetValue)}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          {results.detections.map((detection) => (
            <article key={detection.id} className={PANEL}>
              <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">
                    Detection {detection.detectionIndex + 1}
                  </div>
                  <div className="mt-4 overflow-hidden rounded-[28px] border border-white/15 bg-black/45">
                    {detection.cropUrl ? (
                      <img
                        src={detection.cropUrl}
                        alt={`Detection ${detection.detectionIndex + 1}`}
                        className="aspect-[4/5] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/5] items-center justify-center px-6 text-center text-sm text-amber-100/65">
                        No extracted crop was available for this detection.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-amber-50">
                        {detection.selectedCandidate?.finance?.name ??
                          detection.selectedCandidate?.matchedCardName ??
                          "No confident match yet"}
                      </h2>
                      <p className="mt-1 text-sm text-amber-100/72">
                        Confidence {formatPercentConfidence(detection.selectedCandidate?.confidence)}
                      </p>
                    </div>

                    {detection.selectedCandidate?.finance?.financeHref ? (
                      <Link
                        href={detection.selectedCandidate.finance.financeHref}
                        prefetch={false}
                        className="rounded-full border border-white/20 px-4 py-2 text-xs text-amber-200 transition hover:bg-white/10"
                      >
                        Open Finance Page
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3">
                    {detection.candidates.map((candidate) => (
                      <div
                        key={candidate.identificationId}
                        className={`rounded-2xl border px-4 py-4 ${
                          candidate.selected
                            ? "border-amber-300/35 bg-amber-400/10"
                            : "border-white/15 bg-black/45"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-amber-50">
                              {candidate.finance?.name ??
                                candidate.matchedCardName ??
                                "Unmatched scanner guess"}
                            </div>
                            <div className="mt-1 text-xs text-amber-100/72">
                              {candidate.finance?.subtitle ??
                                ([
                                  candidate.guessedMetadata.setGuess,
                                  candidate.guessedMetadata.numberGuess,
                                  candidate.guessedMetadata.rarityGuess,
                                ]
                                  .filter(Boolean)
                                  .join(" · ") ||
                                  "No finance product linked yet")}
                            </div>
                          </div>

                          <div className="text-xs text-amber-100/72">
                            Match {formatPercentConfidence(candidate.confidence)}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 text-xs text-amber-100/80 sm:grid-cols-2">
                          <div>Fair Value: {formatCurrency(candidate.finance?.fairValue)}</div>
                          <div>Market Price: {formatCurrency(candidate.finance?.marketPrice)}</div>
                          <div>Cash Now: {formatCurrency(candidate.finance?.cashNowValue)}</div>
                          <div>Fast Sell: {formatCurrency(candidate.finance?.fastSellValue)}</div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {!candidate.selected ? (
                            <button
                              type="button"
                              disabled={busyKey === `confirm:${detection.id}:${candidate.identificationId}`}
                              onClick={() =>
                                handleConfirm(detection.id, candidate.identificationId)
                              }
                              className="w-full rounded-full border border-sky-300/35 bg-sky-500/10 px-4 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-500/18 disabled:opacity-60 sm:w-auto"
                            >
                              Use this match
                            </button>
                          ) : null}

                          {signedIn && candidate.selected && candidate.financeProductId ? (
                            <>
                              <button
                                type="button"
                                disabled={busyKey === `collection:${candidate.identificationId}`}
                                onClick={() => handleAddToCollection(candidate)}
                                className="w-full rounded-full border border-amber-300/35 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-50 transition hover:bg-amber-400/18 disabled:opacity-60 sm:w-auto"
                              >
                                Add to Collection
                              </button>
                              <button
                                type="button"
                                disabled={busyKey === `watchlist:${candidate.identificationId}`}
                                onClick={() => handleAddToWatchlist(candidate)}
                                className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-amber-50 transition hover:bg-white/10 disabled:opacity-60 sm:w-auto"
                              >
                                Add to Watchlist
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className={PANEL}>
          <h2 className="text-lg font-semibold text-amber-200">Feedback</h2>
          <p className="mt-2 text-sm text-amber-50/78">
            Tell the archive when a crop or match looks wrong so future training and
            relabeling start from cleaner human signals.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <select
              value={feedbackType}
              onChange={(event) => setFeedbackType(event.target.value)}
              className="h-11 rounded-xl border border-white/20 bg-black/45 px-3 text-sm text-amber-50"
            >
              <option value="other">Other issue</option>
              <option value="wrong_card">Wrong card</option>
              <option value="wrong_finish">Wrong finish</option>
              <option value="wrong_grade">Wrong grade</option>
              <option value="bad_crop">Bad crop</option>
            </select>
            <textarea
              value={feedbackNote}
              onChange={(event) => setFeedbackNote(event.target.value)}
              rows={4}
              placeholder="What looked off in this result?"
              className="rounded-2xl border border-white/20 bg-black/45 px-4 py-3 text-sm text-amber-50 placeholder:text-amber-100/50"
            />
          </div>

          <button
            type="button"
            disabled={busyKey === "feedback"}
            onClick={handleSubmitFeedback}
            className="mt-4 w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-amber-50 transition hover:bg-white/10 disabled:opacity-60 sm:w-auto"
          >
            {busyKey === "feedback" ? "Saving..." : "Submit feedback"}
          </button>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/65">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-amber-50">{value}</div>
    </div>
  );
}
