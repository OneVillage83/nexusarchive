import Link from "next/link";

import {
  formatFinanceCurrency,
  formatFinanceDelta,
  formatFinancePercent,
  type FinanceCollectionSnapshot,
} from "@/lib/finance/query";
import { buildGamePath, getGameBySlug, type GameSlug } from "@/lib/games";

const PANEL =
  "rounded-3xl border border-white/25 bg-black/75 p-5 shadow-[0_0_45px_rgba(0,0,0,0.95)] sm:p-7";

export function CollectionFinancePage({
  game,
  snapshot,
  signedIn,
}: {
  game: GameSlug;
  snapshot: FinanceCollectionSnapshot;
  signedIn: boolean;
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
            {config?.shortName ?? "Collection"}
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-amber-50 sm:text-4xl">
            Collection
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-amber-50/82">
            Public preview by design. Browse value, movers, and finance links now;
            sign in only when you want the archive to remember what you actually own.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <MetricTile
              label="Fair Value"
              value={formatFinanceCurrency(snapshot.totalFairValue)}
              hint="Weighted collection estimate"
            />
            <MetricTile
              label="Realizable Value"
              value={formatFinanceCurrency(snapshot.totalRealizableValue)}
              hint="If you had to turn cardboard into money"
            />
            <MetricTile
              label="Top Mover"
              value={snapshot.topMover?.name ?? "—"}
              hint={
                snapshot.topMover
                  ? formatFinancePercent(snapshot.topMover.deltaPercent24h)
                  : "No mover yet"
              }
            />
            <MetricTile
              label="Biggest Sinker"
              value={snapshot.biggestSinker?.name ?? "—"}
              hint={
                snapshot.biggestSinker
                  ? formatFinancePercent(snapshot.biggestSinker.deltaPercent24h)
                  : "No sinker yet"
              }
            />
          </div>

          {!signedIn ? (
            <div className="mt-5 rounded-2xl border border-sky-200/35 bg-sky-950/55 px-4 py-3 text-xs text-sky-50/85">
              Sign in when you want real persistence for collection positions, portfolio math, or future grader workflows.
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={buildGamePath(game, "scan/quick?intent=collection")}
              prefetch={false}
              className="rounded-full border border-amber-300/35 bg-amber-400/12 px-4 py-2 text-sm font-medium text-amber-50 transition hover:bg-amber-400/18"
            >
              Add Cards by Scanning
            </Link>
            <Link
              href={buildGamePath(game, "scan")}
              prefetch={false}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-white/8"
            >
              Open scanner workspace
            </Link>
          </div>
        </section>

        <section className={PANEL}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-amber-200">Tracked Positions</h2>
              <p className="mt-1 text-sm text-amber-50/75">
                Position preview tied directly into the finance layer.
              </p>
            </div>
            <Link
              href={buildGamePath(game, "finance/portfolio")}
              prefetch={false}
              className="text-xs font-medium text-amber-200 hover:text-white"
            >
              Open finance portfolio →
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {snapshot.positions.map((position) => (
              <article
                key={position.financeProductId}
                className="rounded-2xl border border-white/20 bg-black/55 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-amber-50">{position.name}</h3>
                    <p className="mt-1 text-xs text-amber-100/70">
                      {position.setName ?? "Set still being cataloged"} · Qty {position.quantity}
                    </p>
                  </div>
                  <Link
                    href={buildGamePath(game, `finance/product/${encodeURIComponent(position.financeProductId)}`)}
                    prefetch={false}
                    className="rounded-full border border-white/20 px-3 py-1 text-[11px] text-amber-200 hover:bg-white/5"
                  >
                    Finance
                  </Link>
                </div>

                <div className="mt-4 grid gap-2 text-xs text-amber-100/80 sm:grid-cols-2">
                  <div>Market: {formatFinanceCurrency(position.marketPrice)}</div>
                  <div>Fair: {formatFinanceCurrency(position.fairValue)}</div>
                  <div>Total: {formatFinanceCurrency(position.totalValue)}</div>
                  <div>Avg cost: {formatFinanceCurrency(position.averageCost)}</div>
                  <div>24h: {formatFinanceDelta(position.delta24h)}</div>
                  <div>Move: {formatFinancePercent(position.deltaPercent24h)}</div>
                </div>

                <div className="mt-3 rounded-2xl border border-white/15 bg-black/45 px-3 py-2 text-xs text-amber-50/85">
                  Unrealized gain/loss: {formatFinanceCurrency(position.unrealizedGain)}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricTile({
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
