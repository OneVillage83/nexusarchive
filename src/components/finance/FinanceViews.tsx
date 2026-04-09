import Link from "next/link";

import { buildGamePath, getGameBySlug, type GameSlug } from "@/lib/games";
import {
  formatFinanceCurrency,
  formatFinanceDelta,
  formatFinancePercent,
  type FinanceAlertFeedItem,
  type FinanceHomeData,
  type FinanceProductDetail,
  type FinanceProductSummary,
  type FinanceSealedDetail,
  type FinanceSealedSummary,
} from "@/lib/finance/query";
import type {
  FinanceAlertPreferenceSummary,
  FinancePortfolioSummary,
  FinanceWatchlistSummary,
} from "@/lib/finance/user-data";

const PANEL =
  "rounded-3xl border border-white/25 bg-black/75 p-5 shadow-[0_0_45px_rgba(0,0,0,0.95)] sm:p-7";

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/65">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-amber-50">{value}</div>
      <div className="mt-1 text-xs text-amber-100/70">{hint}</div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-amber-200">{title}</h2>
        <p className="mt-1 text-sm text-amber-50/75">{description}</p>
      </div>
      {href && linkLabel ? (
        <Link href={href} prefetch={false} className="text-xs font-medium text-amber-200 hover:text-white">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

function FinanceProductCard({
  game,
  product,
}: {
  game: GameSlug;
  product: FinanceProductSummary;
}) {
  return (
    <Link
      href={buildGamePath(game, `finance/product/${encodeURIComponent(product.financeProductId)}`)}
      prefetch={false}
      className="rounded-2xl border border-white/20 bg-black/55 p-4 transition hover:-translate-y-0.5 hover:border-amber-300/45 hover:shadow-[0_0_28px_rgba(245,158,11,0.25)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-amber-50">{product.name}</div>
          <div className="mt-1 text-xs text-amber-100/70">{product.subtitle}</div>
        </div>
        <div className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-wide text-amber-200/80">
          {product.sourceLabel}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-amber-100/80 sm:grid-cols-2">
        <div>Market: {formatFinanceCurrency(product.marketPrice)}</div>
        <div>Fair: {formatFinanceCurrency(product.fairValue)}</div>
        <div>24h: {formatFinanceDelta(product.delta24h)}</div>
        <div>Liquidity: {product.liquidityScore ?? "—"}</div>
      </div>
    </Link>
  );
}

function FinanceAlertCard({ alert }: { alert: FinanceAlertFeedItem }) {
  const severityStyles =
    alert.severity === "high"
      ? "border-red-300/40 bg-red-950/25 text-red-100"
      : alert.severity === "medium"
        ? "border-amber-300/30 bg-amber-950/20 text-amber-100"
        : "border-sky-300/30 bg-sky-950/20 text-sky-100";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${severityStyles}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">{alert.title}</div>
        <div className="text-[10px] uppercase tracking-[0.24em] opacity-80">
          {alert.severity}
        </div>
      </div>
      <p className="mt-2 text-xs opacity-90">{alert.summary}</p>
      <Link href={alert.href} prefetch={false} className="mt-3 inline-flex text-xs font-medium hover:text-white">
        Open product finance →
      </Link>
    </div>
  );
}

function SealedCard({
  game,
  sealed,
}: {
  game: GameSlug;
  sealed: FinanceSealedSummary;
}) {
  return (
    <Link
      href={buildGamePath(game, `finance/sealed/${encodeURIComponent(sealed.id)}`)}
      prefetch={false}
      className="rounded-2xl border border-white/20 bg-black/55 p-4 transition hover:-translate-y-0.5 hover:border-amber-300/45 hover:shadow-[0_0_28px_rgba(245,158,11,0.22)]"
    >
      <div className="text-sm font-semibold text-amber-50">{sealed.name}</div>
      <div className="mt-1 text-xs text-amber-100/70">{sealed.setName ?? "Sealed finance"}</div>
      <div className="mt-4 grid gap-2 text-xs text-amber-100/80 sm:grid-cols-2">
        <div>Current: {formatFinanceCurrency(sealed.currentPrice)}</div>
        <div>Fair: {formatFinanceCurrency(sealed.fairValue)}</div>
        <div>Rip EV: {formatFinanceCurrency(sealed.ripEv)}</div>
        <div>Liquidity: {sealed.liquidityScore}</div>
      </div>
      <p className="mt-3 text-xs text-amber-50/75">{sealed.recommendation}</p>
    </Link>
  );
}

function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-5 text-sm text-amber-100/80">
      <div className="font-semibold text-amber-200">{title}</div>
      <p className="mt-2">{body}</p>
    </div>
  );
}

export function FinanceHubView({
  game,
  data,
}: {
  game: GameSlug;
  data: FinanceHomeData;
}) {
  const config = getGameBySlug(game);

  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <div
            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-950"
            style={{ backgroundColor: config?.accentColor ?? "#facc15" }}
          >
            {config?.shortName ?? "Finance"}
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-amber-50 sm:text-4xl">
            Finance Hub
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-amber-50/82">
            Market command center, route math, movers, sealed pressure, and enough
            cardboard finance drama to make your spreadsheet feel seen.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <MetricCard
              label="Market Status"
              value={data.status.headline}
              hint={data.status.summary}
            />
            <MetricCard
              label="Coverage"
              value={data.status.coverageLabel}
              hint="MTG is allowed to be richer first; the rest will fill in."
            />
            <MetricCard
              label="Avg Liquidity"
              value={`${data.status.averageLiquidity}`}
              hint="Higher means easier exits and less cardboard hostage-taking."
            />
            <MetricCard
              label="Avg Confidence"
              value={`${data.status.averageConfidence}`}
              hint="How much the archive trusts the current market signal."
            />
          </div>
        </section>

        <section className={PANEL}>
          <SectionHeader
            title="Hottest Movers"
            description="Cards currently making the biggest upward noise."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.hottestMovers.map((product) => (
              <FinanceProductCard key={`mover-${product.financeProductId}`} game={game} product={product} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className={PANEL}>
            <SectionHeader
              title="Biggest Reversals"
              description="Where the market just caught a boot to the shins."
            />
            <div className="space-y-3">
              {data.biggestReversals.map((product) => (
                <FinanceProductCard key={`reversal-${product.financeProductId}`} game={game} product={product} />
              ))}
            </div>
          </div>

          <div className={PANEL}>
            <SectionHeader
              title="Most Liquid Cards"
              description="The easiest exits in the current finance sample."
            />
            <div className="space-y-3">
              {data.mostLiquid.map((product) => (
                <FinanceProductCard key={`liquid-${product.financeProductId}`} game={game} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className={PANEL}>
            <SectionHeader
              title="Raw vs Graded Opportunities"
              description="Cards where the current math says grading might actually deserve oxygen."
            />
            <div className="space-y-3">
              {data.rawVsGraded.map((product) => (
                <FinanceProductCard key={`graded-${product.financeProductId}`} game={game} product={product} />
              ))}
            </div>
          </div>

          <div className={PANEL}>
            <SectionHeader
              title="Buylist Spread Leaders"
              description="Largest gap between fair value and fast-cash floor."
            />
            <div className="space-y-3">
              {data.buylistSpreadLeaders.map((product) => (
                <FinanceProductCard key={`spread-${product.financeProductId}`} game={game} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className={PANEL}>
          <SectionHeader
            title="Sealed Opportunity Board"
            description="Sealed product snapshots, rip pressure, and whether cracking this box is strategy or just a cry for help."
            href={buildGamePath(game, "finance/sealed")}
            linkLabel="Open sealed finance →"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.sealedOpportunities.map((sealed) => (
              <SealedCard key={sealed.id} game={game} sealed={sealed} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className={PANEL}>
            <SectionHeader
              title="Structural Alerts"
              description="Signals worth eyeballing before you make a move and call it conviction."
            />
            <div className="grid gap-3 md:grid-cols-2">
              {data.alerts.map((alert) => (
                <FinanceAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>

          <div className={PANEL}>
            <SectionHeader
              title="Indexes"
              description="Where the finance sample is clustering by set."
            />
            <div className="space-y-2">
              {data.indexes.map((entry) => (
                <div
                  key={entry.label}
                  className="flex items-center justify-between rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-sm text-amber-50"
                >
                  <span>{entry.label}</span>
                  <span className="text-amber-200">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function FinanceProductView({
  game,
  detail,
}: {
  game: GameSlug;
  detail: FinanceProductDetail;
}) {
  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">
                {detail.sourceLabel}
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-amber-50 sm:text-4xl">
                {detail.name}
              </h1>
              <p className="mt-2 text-sm text-amber-100/75">{detail.subtitle}</p>
              <p className="mt-4 max-w-2xl text-sm text-amber-50/82">
                {detail.recommendation.body}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={buildGamePath(game, "finance")}
                  prefetch={false}
                  className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-amber-100 hover:bg-white/5"
                >
                  ← Back to finance hub
                </Link>
                {detail.externalUrl ? (
                  <a
                    href={detail.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-amber-400/95 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-300"
                  >
                    Open source listing ↗
                  </a>
                ) : null}
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[27rem]">
              <MetricCard label="Market" value={formatFinanceCurrency(detail.marketPrice)} hint="Visible reference market." />
              <MetricCard label="Fair Value" value={formatFinanceCurrency(detail.fairValue)} hint="Weighted Nexus estimate." />
              <MetricCard label="Cash Now" value={formatFinanceCurrency(detail.cashNowValue)} hint="Immediate exit math." />
              <MetricCard label="Liquidity" value={`${detail.liquidityScore ?? "—"}`} hint="Ease of exit." />
              <MetricCard label="24h Move" value={formatFinanceDelta(detail.delta24h)} hint={formatFinancePercent(detail.deltaPercent24h)} />
              <MetricCard label="Confidence" value={`${detail.confidenceScore ?? "—"}`} hint={detail.dataQualityNote} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className={PANEL}>
            <SectionHeader
              title="Source-by-Source Prices"
              description="The raw ingredients behind the finance story."
            />
            <div className="space-y-3">
              {detail.priceSources.map((source) => (
                <div
                  key={source.key}
                  className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-amber-50">{source.label}</div>
                    <div className="text-sm text-amber-200">{formatFinanceCurrency(source.value)}</div>
                  </div>
                  <p className="mt-2 text-xs text-amber-100/70">{source.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={PANEL}>
            <SectionHeader
              title="Net Value by Route"
              description="What each exit path looks like after fees, speed, and basic realism."
            />
            <div className="space-y-3">
              {detail.routeEstimates.map((route) => (
                <div
                  key={route.key}
                  className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-amber-50">{route.label}</div>
                      <div className="mt-1 text-xs text-amber-100/65">{route.etaLabel}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-amber-200">{formatFinanceCurrency(route.netValue)}</div>
                      <div className="mt-1 text-[11px] text-amber-100/60">
                        {route.confidenceScore} confidence
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-amber-100/70">{route.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className={PANEL}>
            <SectionHeader
              title="Price History"
              description="Short-form trend view for the current finance pass."
            />
            <div className="space-y-3">
              {detail.history.map((point) => (
                <div key={point.date} className="grid grid-cols-[7rem_minmax(0,1fr)_5rem] items-center gap-3">
                  <div className="text-xs text-amber-100/70">{point.date}</div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-amber-400/85"
                      style={{ width: `${Math.min(100, Math.max(8, (point.value / Math.max(detail.fairValue ?? 1, 1)) * 100))}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-amber-50">
                    {formatFinanceCurrency(point.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={PANEL}>
            <SectionHeader
              title="Recent Sold Comps"
              description="Quick comp strip for recent sale behavior."
            />
            <div className="space-y-3">
              {detail.recentComps.map((comp) => (
                <div key={comp.id} className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-sm text-amber-50">
                  <div className="flex items-center justify-between gap-3">
                    <span>{comp.marketplace}</span>
                    <span className="text-amber-200">{formatFinanceCurrency(comp.price)}</span>
                  </div>
                  <div className="mt-1 text-xs text-amber-100/70">
                    {comp.soldAt} · {comp.condition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className={PANEL}>
            <SectionHeader
              title="Alerts"
              description="The warnings and nudges attached to this product right now."
            />
            <div className="space-y-3">
              {detail.alerts.map((alert) => (
                <div key={alert} className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-sm text-amber-100/80">
                  {alert}
                </div>
              ))}
            </div>
          </div>

          <div className={PANEL}>
            <SectionHeader
              title="Data Quality"
              description="How much trust this product currently deserves."
            />
            <div className="space-y-3 text-sm text-amber-50/85">
              <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">
                <div className="font-semibold text-amber-200">Freshness</div>
                <div className="mt-2">{detail.freshnessLabel}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">
                <div className="font-semibold text-amber-200">Source Count</div>
                <div className="mt-2">{detail.sourceCount}</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">
                <div className="font-semibold text-amber-200">Recommendation</div>
                <div className="mt-2">{detail.recommendation.title}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function FinanceSealedListView({
  game,
  summaries,
}: {
  game: GameSlug;
  summaries: FinanceSealedSummary[];
}) {
  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <h1 className="text-3xl font-semibold text-amber-50">Sealed Finance</h1>
          <p className="mt-3 max-w-3xl text-sm text-amber-50/82">
            Booster boxes, sealed pressure, rip EV, chase concentration, and the
            age-old question of whether opening this product is alpha or just a
            little theatrical.
          </p>
        </section>

        <section className={PANEL}>
          <SectionHeader
            title="Sealed Opportunity Board"
            description="Current sealed snapshots for this game."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summaries.map((sealed) => (
              <SealedCard key={sealed.id} game={game} sealed={sealed} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export function FinanceSealedDetailView({
  detail,
}: {
  detail: FinanceSealedDetail;
}) {
  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <h1 className="text-3xl font-semibold text-amber-50">{detail.name}</h1>
          <p className="mt-3 max-w-3xl text-sm text-amber-50/82">{detail.recommendation}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <MetricCard label="Current Price" value={formatFinanceCurrency(detail.currentPrice)} hint="Current sealed mark." />
            <MetricCard label="Fair Value" value={formatFinanceCurrency(detail.fairValue)} hint="Weighted sealed estimate." />
            <MetricCard label="Rip EV" value={formatFinanceCurrency(detail.ripEv)} hint="Singles expectation." />
            <MetricCard label="Chase Concentration" value={`${detail.chaseConcentration}%`} hint="How much the box leans on top hits." />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className={PANEL}>
            <SectionHeader
              title="Singles EV Trend"
              description="Short trend strip for the sealed finance pass."
            />
            <div className="space-y-3">
              {detail.singlesEvTrend.map((point) => (
                <div key={point.date} className="grid grid-cols-[7rem_minmax(0,1fr)_5rem] items-center gap-3">
                  <div className="text-xs text-amber-100/70">{point.date}</div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-amber-400/85"
                      style={{ width: `${Math.min(100, Math.max(8, (point.value / Math.max(detail.fairValue, 1)) * 100))}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-amber-50">{formatFinanceCurrency(point.value)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={PANEL}>
            <SectionHeader
              title="Pressure Notes"
              description="The short version of why this box is acting the way it is."
            />
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-sm text-amber-50/85">
                Rip variance: {detail.ripVariance} / 100
              </div>
              {detail.notes.map((note) => (
                <div key={note} className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-sm text-amber-100/80">
                  {note}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function FinanceWatchlistsView({
  watchlists,
  signedIn,
}: {
  watchlists: FinanceWatchlistSummary[];
  signedIn: boolean;
}) {
  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <h1 className="text-3xl font-semibold text-amber-50">Watchlists</h1>
          <p className="mt-3 max-w-3xl text-sm text-amber-50/82">
            Watchlists are public to understand, but only signed-in users get to save
            and curate their own cardboard obsessions.
          </p>
        </section>

        {!signedIn ? (
          <section className={PANEL}>
            <EmptyState
              title="Sign in to save watchlists"
              body="The public finance data is open, but personal watchlists need an account so the archive remembers what you are stalking."
            />
          </section>
        ) : null}

        <section className={PANEL}>
          <SectionHeader
            title="Saved Watchlists"
            description="Current user-owned watchlists in the finance layer."
          />
          {watchlists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {watchlists.map((watchlist) => (
                <Link
                  key={watchlist.id}
                  href={`./watchlists/${watchlist.id}`}
                  prefetch={false}
                  className="rounded-2xl border border-white/20 bg-black/55 p-4 transition hover:border-amber-300/45 hover:bg-black/65"
                >
                  <div className="text-base font-semibold text-amber-50">{watchlist.name}</div>
                  <div className="mt-2 text-xs text-amber-100/70">
                    {watchlist.itemCount} tracked item{watchlist.itemCount === 1 ? "" : "s"}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No saved watchlists yet"
              body="The route is live and the persistence API is ready. Once you start saving products, they will show up here."
            />
          )}
        </section>
      </div>
    </main>
  );
}

export function FinanceWatchlistDetailView({
  watchlist,
}: {
  watchlist: FinanceWatchlistSummary;
}) {
  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <h1 className="text-3xl font-semibold text-amber-50">{watchlist.name}</h1>
          <p className="mt-3 text-sm text-amber-50/82">
            Watchlist detail is intentionally simple in v1: the priority is wiring
            product identity, persistence, and finance links without hiding the signal behind ceremony.
          </p>
        </section>

        <section className={PANEL}>
          <SectionHeader
            title="Tracked Products"
            description="Items currently attached to this watchlist."
          />
          {watchlist.items.length > 0 ? (
            <div className="space-y-3">
              {watchlist.items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/20 bg-black/55 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-amber-50">{item.name}</div>
                      <div className="mt-1 text-xs text-amber-100/70">{item.note ?? "No note yet."}</div>
                    </div>
                    <div className="text-sm text-amber-200">{item.fairValueLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="This watchlist is empty"
              body="The shell is wired; the next card you save through the finance APIs can land here."
            />
          )}
        </section>
      </div>
    </main>
  );
}

export function FinancePortfolioView({
  portfolio,
  signedIn,
}: {
  portfolio: FinancePortfolioSummary;
  signedIn: boolean;
}) {
  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <h1 className="text-3xl font-semibold text-amber-50">Portfolio</h1>
          <p className="mt-3 max-w-3xl text-sm text-amber-50/82">
            This is the finance-first lens on owned positions: total value, gain/loss, and the pile of cards you keep pretending are “for trade.”
          </p>
        </section>

        {!signedIn ? (
          <section className={PANEL}>
            <EmptyState
              title="Sign in to save real positions"
              body="Finance browsing stays public. Portfolio positions need a user account because the archive cannot read your binder telepathically."
            />
          </section>
        ) : null}

        <section className={PANEL}>
          <SectionHeader
            title="Positions"
            description={`Current total value: ${portfolio.totalValueLabel}`}
          />
          {portfolio.positions.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-black/55">
              <table className="min-w-full text-sm">
                <thead className="bg-black/70 text-xs uppercase text-amber-100/70">
                  <tr>
                    <th className="px-4 py-3 text-left">Card</th>
                    <th className="px-4 py-3 text-left">Qty</th>
                    <th className="px-4 py-3 text-left">Avg Cost</th>
                    <th className="px-4 py-3 text-left">Fair Value</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.positions.map((position) => (
                    <tr key={position.id} className="border-t border-white/10 text-amber-50/88">
                      <td className="px-4 py-3">{position.name}</td>
                      <td className="px-4 py-3">{position.quantity}</td>
                      <td className="px-4 py-3">{position.averageCostLabel}</td>
                      <td className="px-4 py-3">{position.fairValueLabel}</td>
                      <td className="px-4 py-3">{position.totalValueLabel}</td>
                      <td className="px-4 py-3">{position.unrealizedLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No saved positions yet"
              body="The API path is ready; once positions are posted, the finance portfolio view will populate here."
            />
          )}
        </section>
      </div>
    </main>
  );
}

export function FinanceAlertsView({
  alerts,
  signedIn,
  preferences,
}: {
  alerts: FinanceAlertFeedItem[];
  signedIn: boolean;
  preferences: FinanceAlertPreferenceSummary;
}) {
  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <h1 className="text-3xl font-semibold text-amber-50">Alerts</h1>
          <p className="mt-3 max-w-3xl text-sm text-amber-50/82">
            Structural alerts stay public to browse. Saving personal preferences still belongs to signed-in users only.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className={PANEL}>
            <SectionHeader
              title="Public Alert Feed"
              description="The current market sirens for this game."
            />
            <div className="grid gap-3">
              {alerts.map((alert) => (
                <FinanceAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>

          <div className={PANEL}>
            <SectionHeader
              title="Preference Snapshot"
              description={signedIn ? "Current user-level alert settings." : "Sign in to save preference changes."}
            />
            <div className="space-y-3 text-sm text-amber-50/85">
              <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">Email alerts: {preferences.emailEnabled ? "On" : "Off"}</div>
              <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">Mover alerts: {preferences.moversEnabled ? "On" : "Off"}</div>
              <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">Reversal alerts: {preferences.reversalsEnabled ? "On" : "Off"}</div>
              <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">Watchlist alerts: {preferences.watchlistEnabled ? "On" : "Off"}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
