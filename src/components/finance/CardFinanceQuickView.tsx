"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buildGamePath, type GameSlug } from "@/lib/games";

type FinanceQuickViewProps = {
  game: GameSlug;
  financeProductId: string | null;
  open: boolean;
  onClose: () => void;
};

type FinanceQuickViewData = {
  financeProductId: string;
  name: string;
  subtitle: string;
  sourceLabel: string;
  marketPrice: number | null;
  fairValue: number | null;
  delta24h: number | null;
  deltaPercent24h: number | null;
  liquidityScore: number | null;
  confidenceScore: number | null;
  cashNowValue: number | null;
  fastSellValue: number | null;
  maxValueValue: number | null;
  storeCreditValue: number | null;
  externalUrl: string | null;
};

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

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function CardFinanceQuickView({
  game,
  financeProductId,
  open,
  onClose,
}: FinanceQuickViewProps) {
  const [data, setData] = useState<FinanceQuickViewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !financeProductId) {
      return;
    }

    const currentFinanceProductId = financeProductId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/finance/product/${encodeURIComponent(currentFinanceProductId)}?game=${game}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const next = (await response.json()) as FinanceQuickViewData;
        if (!cancelled) {
          setData(next);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load finance detail.");
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [financeProductId, game, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  if (!open || !financeProductId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close finance quick view"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/20 bg-black/90 p-5 shadow-[0_0_55px_rgba(0,0,0,0.95)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">
              Quick Finance View
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-amber-50">
              {loading ? "Loading..." : data?.name ?? "Finance detail"}
            </h2>
            <p className="mt-2 text-sm text-amber-100/75">
              {loading
                ? "Pulling the latest finance snapshot..."
                : data?.subtitle ?? "Simple finance facts before the full deep dive."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-amber-100 hover:bg-white/5"
          >
            Close
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-300/30 bg-red-950/25 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Metric label="Market" value={formatCurrency(data?.marketPrice)} />
          <Metric label="Fair Value" value={formatCurrency(data?.fairValue)} />
          <Metric label="24h Move" value={formatCurrency(data?.delta24h)} />
          <Metric label="24h Percent" value={formatPercent(data?.deltaPercent24h)} />
          <Metric label="Liquidity" value={data?.liquidityScore != null ? String(data.liquidityScore) : "—"} />
          <Metric label="Confidence" value={data?.confidenceScore != null ? String(data.confidenceScore) : "—"} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CompactMetric label="Cash Now" value={formatCurrency(data?.cashNowValue)} />
          <CompactMetric label="Fast Sell" value={formatCurrency(data?.fastSellValue)} />
          <CompactMetric label="Max Value" value={formatCurrency(data?.maxValueValue)} />
          <CompactMetric label="Store Credit" value={formatCurrency(data?.storeCreditValue)} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={buildGamePath(game, `finance/product/${encodeURIComponent(financeProductId)}`)}
            prefetch={false}
            className="rounded-full bg-amber-400/95 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
          >
            Open full finance page
          </Link>
          {data?.externalUrl ? (
            <a
              href={data.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-amber-100 hover:bg-white/5"
            >
              Open source listing ↗
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/65">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-amber-50">{value}</div>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/65">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-amber-50">{value}</div>
    </div>
  );
}
