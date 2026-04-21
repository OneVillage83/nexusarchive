"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CardCatalogSummary } from "@/lib/cards/catalog";
import { buildGamePath, type GameSlug } from "@/lib/games";

type FinanceQuickViewProps = {
  game: GameSlug;
  card: CardCatalogSummary | null;
  financeProductId: string | null;
  open: boolean;
  onClose: () => void;
};

type QuickViewTab = "overview" | "rulings" | "synergy" | "art";

type FinanceQuickViewData = {
  financeProductId: string;
  name: string;
  baseCardName: string;
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
  imageUrl: string | null;
  marketProvenance: {
    primarySource: "google-shopping" | "ebay" | "tcgplayer" | "reference";
    primaryLabel: string;
    lookupMode: "saved-product-id" | "discovery-search" | "fallback-only";
    googleStatus: "active" | "discovered" | "missing-mapping" | "disabled" | "error";
    cacheTier: "tier1" | "tier2" | "tier3" | null;
    freshnessLabel: string;
    supplementalSources: Array<"google-shopping" | "ebay" | "tcgplayer" | "reference">;
    isFallback: boolean;
    fallbackMessage: string | null;
  };
  selectedVariantName: string;
  selectedVariantLabel: string;
  artVariants: Array<{
    financeProductId: string;
    name: string;
    imageUrl: string | null;
    versionLabel: string;
    setName: string | null;
    setCode: string | null;
    rarity: string | null;
    marketPrice: number | null;
    fairValue: number | null;
    isBaseVersion: boolean;
    isSelected: boolean;
  }>;
  rulingNotes: Array<{
    title: string;
    body: string;
  }>;
  synergyCards: Array<{
    financeProductId: string;
    name: string;
    subtitle: string;
    imageUrl: string | null;
    reason: string;
    fairValue: number | null;
  }>;
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

function getTabLabel(tab: QuickViewTab) {
  switch (tab) {
    case "rulings":
      return "Rulings";
    case "synergy":
      return "Synergy";
    case "art":
      return "Art";
    case "overview":
    default:
      return "Overview";
  }
}

function formatSourceCtaLabel(data: FinanceQuickViewData | null) {
  switch (data?.marketProvenance.primarySource) {
    case "google-shopping":
      return "Open Google price source ↗";
    case "tcgplayer":
      return "Open TCGplayer source ↗";
    case "ebay":
      return "Open eBay source ↗";
    case "reference":
    default:
      return "Open source record ↗";
  }
}

function formatLookupModeLabel(data: FinanceQuickViewData | null) {
  if (data?.marketProvenance.lookupMode === "saved-product-id") {
    return "Saved Google mapping";
  }

  if (data?.marketProvenance.lookupMode === "discovery-search") {
    return "Discovered during refresh";
  }

  switch (data?.marketProvenance.googleStatus) {
    case "disabled":
      return "Google lane disabled";
    case "missing-mapping":
      return "Google mapping missing";
    case "error":
      return "Google lane fallback";
    default:
      return "Fallback-only lane";
  }
}

function buildFinanceProductHref(
  game: GameSlug,
  financeProductId: string,
  fromGallery = true,
) {
  const href = buildGamePath(
    game,
    `finance/product/${encodeURIComponent(financeProductId)}`,
  );

  return fromGallery ? `${href}?fromGallery=1` : href;
}

function CardImage({
  imageUrl,
  alt,
  className,
}: {
  imageUrl: string | null | undefined;
  alt: string;
  className: string;
}) {
  if (!imageUrl) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-3xl border border-white/15 bg-slate-950/85 px-6 text-center text-sm text-amber-100/60`}
      >
        No card art in the archive yet
      </div>
    );
  }

  return (
    <div
      aria-label={alt}
      className={`${className} rounded-3xl border border-white/15 bg-black/65 shadow-[0_0_35px_rgba(0,0,0,0.8)]`}
      style={{
        backgroundImage: `url("${imageUrl}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    />
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/65">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-amber-50">{value}</div>
    </div>
  );
}

export function CardFinanceQuickView({
  game,
  card,
  financeProductId,
  open,
  onClose,
}: FinanceQuickViewProps) {
  const [data, setData] = useState<FinanceQuickViewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<QuickViewTab>("overview");
  const [activeFinanceProductId, setActiveFinanceProductId] = useState<string | null>(null);
  const [previewVariantId, setPreviewVariantId] = useState<string | null>(null);
  const backdropScrollRef = useRef<HTMLDivElement | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !financeProductId) {
      return;
    }

    setActiveFinanceProductId(financeProductId);
    setPreviewVariantId(financeProductId);
  }, [financeProductId, open]);

  useEffect(() => {
    if (!open || !activeFinanceProductId) {
      return;
    }

    const currentFinanceProductId = activeFinanceProductId;
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
          setPreviewVariantId(
            next.artVariants.find((variant) => variant.isSelected)?.financeProductId ??
              next.financeProductId,
          );
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load finance detail.",
          );
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
  }, [activeFinanceProductId, game, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const scrollY = window.scrollY;
    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const previousHtmlOverflow = htmlStyle.overflow;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousBodyPosition = bodyStyle.position;
    const previousBodyTop = bodyStyle.top;
    const previousBodyLeft = bodyStyle.left;
    const previousBodyRight = bodyStyle.right;
    const previousBodyWidth = bodyStyle.width;

    htmlStyle.overflow = "hidden";
    bodyStyle.overflow = "hidden";
    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.left = "0";
    bodyStyle.right = "0";
    bodyStyle.width = "100%";

    requestAnimationFrame(() => {
      backdropScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      contentScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      htmlStyle.overflow = previousHtmlOverflow;
      bodyStyle.overflow = previousBodyOverflow;
      bodyStyle.position = previousBodyPosition;
      bodyStyle.top = previousBodyTop;
      bodyStyle.left = previousBodyLeft;
      bodyStyle.right = previousBodyRight;
      bodyStyle.width = previousBodyWidth;
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeFinanceProductId, onClose, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    requestAnimationFrame(() => {
      backdropScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      contentScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [activeFinanceProductId, open]);

  useEffect(() => {
    if (!open) {
      setActiveTab("overview");
      setActiveFinanceProductId(null);
      setPreviewVariantId(null);
      setData(null);
      setError(null);
    }
  }, [open]);

  const selectedVariant = useMemo(() => {
    if (data?.artVariants?.length) {
      return (
        data.artVariants.find((variant) => variant.financeProductId === previewVariantId) ??
        data.artVariants.find((variant) => variant.isSelected) ??
        data.artVariants[0]
      );
    }

    if (!card) {
      return null;
    }

    return {
      financeProductId: card.financeProductId ?? card.id,
      name: card.representativeName ?? card.name,
      imageUrl: card.imageUrl,
      versionLabel: card.versionLabel ?? "Featured version",
      setName: card.setName ?? null,
      setCode: card.setCode ?? null,
      rarity: card.rarity ?? null,
      marketPrice: card.marketPrice ?? null,
      fairValue: card.fairValue ?? null,
      isBaseVersion: card.isBaseVersion ?? true,
      isSelected: true,
    };
  }, [card, data?.artVariants, previewVariantId]);

  if (!open || !financeProductId) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={backdropScrollRef}
      className="fixed inset-0 z-50 overflow-hidden bg-black/80 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-start justify-center">
        <div className="relative z-10 flex h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-black/92 p-5 shadow-[0_0_60px_rgba(0,0,0,0.96)] sm:h-[calc(100dvh-3rem)] sm:p-6 lg:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">
                Card Detail View
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-amber-50 sm:text-3xl">
                {loading ? card?.name ?? "Loading..." : data?.baseCardName ?? card?.name ?? "Card detail"}
              </h2>
              <p className="mt-2 text-sm text-amber-100/72">
                {loading
                  ? "Pulling the current art stack, finance signal, and quick archive notes..."
                  : data?.subtitle ?? "Finance, rulings, synergy, and art variants in one place."}
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

          <div ref={contentScrollRef} className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                <div className="space-y-4">
              <CardImage
                imageUrl={selectedVariant?.imageUrl ?? data?.imageUrl ?? card?.imageUrl}
                alt={selectedVariant?.name ?? data?.baseCardName ?? card?.name ?? "Card art"}
                className="mx-auto aspect-[3/4] w-full max-w-[18rem] lg:max-w-none"
              />

                <div className="rounded-3xl border border-white/15 bg-black/45 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/65">
                    Showing version
                  </div>
                  <div className="mt-2 text-lg font-semibold text-amber-50">
                  {selectedVariant?.versionLabel ?? data?.selectedVariantLabel ?? card?.versionLabel ?? "Featured print"}
                </div>
                <div className="mt-1 text-xs text-amber-100/72">
                  {selectedVariant?.setName ?? selectedVariant?.setCode ?? card?.setName ?? card?.setCode ?? "Archive set info pending"}
                  {selectedVariant?.rarity ? ` · ${selectedVariant.rarity}` : ""}
                </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-amber-200/85">
                    <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1">
                      {(data?.artVariants?.length ?? card?.versionCount ?? 1)} version
                      {(data?.artVariants?.length ?? card?.versionCount ?? 1) === 1 ? "" : "s"}
                    </span>
                  <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1">
                      Fair {formatCurrency(selectedVariant?.fairValue ?? data?.fairValue ?? card?.fairValue)}
                    </span>
                  </div>
                  {data?.artVariants && data.artVariants.length > 1 ? (
                    <div className="mt-4 space-y-2">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100/60">
                        Switch version
                      </div>
                      <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                        {data.artVariants.map((variant) => {
                          const selected =
                            variant.financeProductId ===
                            (activeFinanceProductId ?? previewVariantId ?? financeProductId);

                          return (
                            <button
                              key={variant.financeProductId}
                              type="button"
                              onClick={() => {
                                setPreviewVariantId(variant.financeProductId);
                                setActiveFinanceProductId(variant.financeProductId);
                              }}
                              className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                                selected
                                  ? "border-amber-300/70 bg-amber-400/10"
                                  : "border-white/10 bg-black/25 hover:border-amber-300/35 hover:bg-black/45"
                              }`}
                            >
                              <CardImage
                                imageUrl={variant.imageUrl}
                                alt={variant.name}
                                className="h-14 w-10 shrink-0 rounded-xl"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-semibold text-amber-50">
                                  {variant.versionLabel}
                                </div>
                                <div className="truncate text-[11px] text-amber-100/68">
                                  {variant.setName ?? variant.setCode ?? "Archive set"}
                                  {variant.rarity ? ` · ${variant.rarity}` : ""}
                                </div>
                              </div>
                              <div className="text-right text-[11px] text-amber-200">
                                {formatCurrency(variant.fairValue ?? variant.marketPrice)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                {(["overview", "rulings", "synergy", "art"] as QuickViewTab[]).map((tab) => {
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        active
                          ? "border-amber-300/80 bg-amber-400 text-slate-950"
                          : "border-white/20 bg-black/45 text-amber-100 hover:bg-white/5"
                      }`}
                    >
                      {getTabLabel(tab)}
                    </button>
                  );
                })}
                  </div>

                  <div className="mt-4 rounded-3xl border border-white/15 bg-black/45 p-4 sm:p-5">
                {activeTab === "overview" ? (
                  <div className="space-y-5">
                    <div>
                      <div className="text-sm font-semibold text-amber-50">
                        {loading ? card?.name ?? "Loading..." : data?.selectedVariantName ?? selectedVariant?.name ?? card?.name ?? "Card"}
                      </div>
                      <div className="mt-1 text-sm text-amber-100/72">
                        {loading
                          ? "Loading current selected version..."
                          : `${data?.selectedVariantLabel ?? selectedVariant?.versionLabel ?? "Featured print"} · ${data?.sourceLabel ?? "Finance preview"}`}
                      </div>
                    </div>

                    {!loading && data?.marketProvenance ? (
                      <div className="rounded-2xl border border-white/15 bg-black/35 px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/60">
                            Pricing Source
                          </div>
                          <div
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                              data.marketProvenance.isFallback
                                ? "border-red-300/35 bg-red-500/10 text-red-100"
                                : "border-amber-300/35 bg-amber-400/10 text-amber-100"
                            }`}
                          >
                            {data.marketProvenance.isFallback ? "Fallback" : "Primary"}
                          </div>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-amber-50">
                          {data.marketProvenance.primaryLabel}
                        </div>
                        <div className="mt-1 text-xs text-amber-100/70">
                          {formatLookupModeLabel(data)} · {data.marketProvenance.freshnessLabel}
                        </div>
                        {data.marketProvenance.fallbackMessage ? (
                          <div className="mt-2 text-xs text-red-100/90">
                            {data.marketProvenance.fallbackMessage}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <Metric label="Market" value={formatCurrency(data?.marketPrice ?? card?.marketPrice)} />
                      <Metric label="Fair Value" value={formatCurrency(data?.fairValue ?? card?.fairValue)} />
                      <Metric label="24h Move" value={formatCurrency(data?.delta24h ?? card?.delta24h)} />
                      <Metric label="24h Percent" value={formatPercent(data?.deltaPercent24h ?? card?.deltaPercent24h)} />
                      <Metric
                        label="Liquidity"
                        value={
                          data?.liquidityScore != null
                            ? String(data.liquidityScore)
                            : card?.liquidityScore != null
                              ? String(card.liquidityScore)
                              : "—"
                        }
                      />
                      <Metric
                        label="Confidence"
                        value={
                          data?.confidenceScore != null
                            ? String(data.confidenceScore)
                            : card?.confidenceScore != null
                              ? String(card.confidenceScore)
                              : "—"
                        }
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <Metric label="Cash Now" value={formatCurrency(data?.cashNowValue ?? card?.cashNowValue)} />
                      <Metric label="Fast Sell" value={formatCurrency(data?.fastSellValue ?? card?.fastSellValue)} />
                      <Metric label="Max Value" value={formatCurrency(data?.maxValueValue ?? card?.maxValueValue)} />
                      <Metric label="Store Credit" value={formatCurrency(data?.storeCreditValue ?? card?.storeCreditValue)} />
                    </div>
                  </div>
                ) : null}

                {activeTab === "rulings" ? (
                  <div className="space-y-3">
                    {(data?.rulingNotes?.length ? data.rulingNotes : []).map((note) => (
                      <div
                        key={note.title}
                        className="rounded-2xl border border-white/15 bg-black/35 px-4 py-3"
                      >
                        <div className="text-sm font-semibold text-amber-200">{note.title}</div>
                        <p className="mt-2 text-sm text-amber-100/78">{note.body}</p>
                      </div>
                    ))}
                    {!data?.rulingNotes?.length && !loading ? (
                      <div className="rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-sm text-amber-100/70">
                        No quick ruling notes are cataloged yet. The archive can still dig deeper through the dedicated rules desk.
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {activeTab === "synergy" ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    {(data?.synergyCards ?? []).map((synergy) => (
                      <Link
                        key={synergy.financeProductId}
                        href={buildFinanceProductHref(
                          game,
                          synergy.financeProductId,
                        )}
                        prefetch={false}
                        className="rounded-2xl border border-white/15 bg-black/35 p-3 transition hover:border-amber-300/45 hover:bg-black/45"
                      >
                        <CardImage
                          imageUrl={synergy.imageUrl}
                          alt={synergy.name}
                          className="aspect-[3/4] w-full"
                        />
                        <div className="mt-3 text-sm font-semibold text-amber-50">
                          {synergy.name}
                        </div>
                        <div className="mt-1 text-[11px] text-amber-100/68">
                          {synergy.subtitle}
                        </div>
                        <p className="mt-2 text-xs text-amber-100/78">{synergy.reason}</p>
                        <div className="mt-3 text-xs text-amber-200">
                          Fair {formatCurrency(synergy.fairValue)}
                        </div>
                      </Link>
                    ))}
                    {!data?.synergyCards?.length && !loading ? (
                      <div className="rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-sm text-amber-100/70 md:col-span-3">
                        No synergy notes are cataloged yet for this card family.
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {activeTab === "art" ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {(data?.artVariants ?? []).map((variant) => (
                      <button
                        key={variant.financeProductId}
                        type="button"
                        onClick={() => {
                          setPreviewVariantId(variant.financeProductId);
                          setActiveFinanceProductId(variant.financeProductId);
                        }}
                        className={`rounded-2xl border p-3 text-left transition ${
                          variant.financeProductId === selectedVariant?.financeProductId
                            ? "border-amber-300/80 bg-amber-400/10 shadow-[0_0_24px_rgba(245,158,11,0.22)]"
                            : "border-white/15 bg-black/35 hover:border-amber-300/35 hover:bg-black/45"
                        }`}
                      >
                        <CardImage
                          imageUrl={variant.imageUrl}
                          alt={variant.name}
                          className="aspect-[3/4] w-full"
                        />
                        <div className="mt-3 text-sm font-semibold text-amber-50">
                          {variant.versionLabel}
                        </div>
                        <div className="mt-1 text-[11px] text-amber-100/68">
                          {variant.setName ?? variant.setCode ?? "Archive set"}
                          {variant.rarity ? ` · ${variant.rarity}` : ""}
                        </div>
                        <div className="mt-2 text-xs text-amber-200">
                          Fair {formatCurrency(variant.fairValue)}
                        </div>
                      </button>
                    ))}
                    {!data?.artVariants?.length && !loading ? (
                      <div className="rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-sm text-amber-100/70 sm:col-span-2 xl:col-span-3">
                        No alternate art or reprint variants are cataloged for this card yet.
                      </div>
                    ) : null}
                  </div>
                ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={buildFinanceProductHref(
                    game,
                    activeFinanceProductId ??
                      selectedVariant?.financeProductId ??
                      financeProductId,
                  )}
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
                    {formatSourceCtaLabel(data)}
                  </a>
                ) : null}
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
