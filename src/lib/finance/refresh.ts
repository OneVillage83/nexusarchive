import { getRedis } from "@/lib/storage/redis";
import { GAME_ORDER, type GameSlug } from "@/lib/games";
import {
  getSourceRefLastScrapedAt,
  isMarketSnapshotFresh,
  type MarketRefreshTier,
} from "@/lib/finance/google-market";
import { getFinanceHome, getFinanceProductDetail } from "@/lib/finance/query";
import { maybeBackupFinanceSourceMappings } from "@/lib/finance/source-mapping-backup";
import { resolveFinanceExternalSourceRefForCard } from "@/lib/finance/source-mappings";

const LAST_RUN_CACHE_KEY = "finance:cron:market-refresh:last-run";
const LAST_RUN_TTL_SECONDS = 60 * 60 * 24 * 7;

export const EBAY_BROWSE_DEFAULT_DAILY_LIMIT = 5_000;
export const EBAY_TAXONOMY_DEFAULT_DAILY_LIMIT = 5_000;

const DEFAULT_REFRESH_INTERVAL_MINUTES = 20;
const DEFAULT_MAX_PRODUCTS_PER_RUN = 10;
const DEFAULT_RESERVED_BROWSE_CALLS = 1_400;
const DEFAULT_ASSUMED_BROWSE_CALLS_PER_PRODUCT = 5;

type FinanceRefreshCandidate = {
  financeProductId: string;
  name: string;
  collectorNo: string | null;
  tier: MarketRefreshTier;
};

type FinanceRefreshGamePlan = {
  game: GameSlug;
  candidatePoolSize: number;
  selected: FinanceRefreshCandidate[];
};

export type FinanceMarketRefreshConfig = {
  environment: "sandbox" | "production";
  refreshIntervalMinutes: number;
  maxProductsPerRun: number;
  reservedBrowseCallsPerDay: number;
  assumedBrowseCallsPerProduct: number;
  browseDailyLimit: number;
  taxonomyDailyLimit: number;
  taxonomyPollingEnabled: boolean;
};

export type FinanceMarketRefreshSummary = {
  status: "ok" | "dry-run" | "skipped";
  environment: "sandbox" | "production";
  startedAt: string;
  finishedAt: string;
  browseDailyLimit: number;
  taxonomyDailyLimit: number;
  taxonomyPollingEnabled: boolean;
  refreshIntervalMinutes: number;
  runsPerDay: number;
  reservedBrowseCallsPerDay: number;
  availableBrowseCallsPerDay: number;
  assumedBrowseCallsPerProduct: number;
  browseCallsBudgetPerRun: number;
  maxProductsPerRun: number;
  plannedProductsPerRun: number;
  warmedProducts: Array<{
    game: GameSlug;
    financeProductId: string;
    name: string;
  }>;
  gamePlans: FinanceRefreshGamePlan[];
  notes: string[];
};

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getEnvironment() {
  return process.env.EBAY_ENVIRONMENT?.trim().toLowerCase() === "sandbox"
    ? "sandbox"
    : "production";
}

function hasEbayCredentials() {
  return Boolean(
    process.env.EBAY_BROWSE_OAUTH_TOKEN ||
      process.env.EBAY_OAUTH_TOKEN ||
      process.env.EBAY_ACCESS_TOKEN ||
      ((process.env.EBAY_APP_ID || process.env.EBAY_CLIENT_ID || process.env.EBAY_BROWSE_CLIENT_ID) &&
        (process.env.EBAY_CERT_ID ||
          process.env.EBAY_CLIENT_SECRET ||
          process.env.EBAY_BROWSE_CLIENT_SECRET)),
  );
}

export function getFinanceMarketRefreshConfig(): FinanceMarketRefreshConfig {
  return {
    environment: getEnvironment(),
    refreshIntervalMinutes: parsePositiveInteger(
      process.env.EBAY_REFRESH_INTERVAL_MINUTES,
      DEFAULT_REFRESH_INTERVAL_MINUTES,
    ),
    maxProductsPerRun: parsePositiveInteger(
      process.env.EBAY_WARM_MAX_PRODUCTS_PER_RUN,
      DEFAULT_MAX_PRODUCTS_PER_RUN,
    ),
    reservedBrowseCallsPerDay: parsePositiveInteger(
      process.env.EBAY_WARM_RESERVED_BROWSE_CALLS,
      DEFAULT_RESERVED_BROWSE_CALLS,
    ),
    assumedBrowseCallsPerProduct: parsePositiveInteger(
      process.env.EBAY_WARM_ASSUMED_CALLS_PER_PRODUCT,
      DEFAULT_ASSUMED_BROWSE_CALLS_PER_PRODUCT,
    ),
    browseDailyLimit: EBAY_BROWSE_DEFAULT_DAILY_LIMIT,
    taxonomyDailyLimit: EBAY_TAXONOMY_DEFAULT_DAILY_LIMIT,
    taxonomyPollingEnabled: false,
  };
}

function getRunsPerDay(refreshIntervalMinutes: number) {
  return Math.max(1, Math.ceil(1_440 / Math.max(refreshIntervalMinutes, 1)));
}

function getBrowseCallsBudgetPerRun(config: FinanceMarketRefreshConfig) {
  const availableBrowseCallsPerDay = Math.max(
    config.browseDailyLimit - config.reservedBrowseCallsPerDay,
    config.assumedBrowseCallsPerProduct,
  );
  const runsPerDay = getRunsPerDay(config.refreshIntervalMinutes);
  const browseCallsBudgetPerRun = Math.max(
    config.assumedBrowseCallsPerProduct,
    Math.floor(availableBrowseCallsPerDay / runsPerDay),
  );

  return {
    availableBrowseCallsPerDay,
    runsPerDay,
    browseCallsBudgetPerRun,
  };
}

function allocatePerGame(total: number) {
  const allocations = new Map<GameSlug, number>();
  const base = Math.floor(total / GAME_ORDER.length);
  let remainder = total % GAME_ORDER.length;

  for (const game of GAME_ORDER) {
    allocations.set(game, base + (remainder > 0 ? 1 : 0));
    if (remainder > 0) {
      remainder -= 1;
    }
  }

  return allocations;
}

function rotateTake<T>(items: T[], count: number, seed: number) {
  if (!items.length || count <= 0) {
    return [];
  }

  const startIndex = Math.abs(seed) % items.length;
  const rotated = [...items.slice(startIndex), ...items.slice(0, startIndex)];
  return rotated.slice(0, Math.min(count, rotated.length));
}

function tierPriority(tier: MarketRefreshTier) {
  switch (tier) {
    case "tier1":
      return 3;
    case "tier2":
      return 2;
    case "tier3":
    default:
      return 1;
  }
}

export function getCandidateTier(
  product: Awaited<ReturnType<typeof getFinanceHome>>["hottestMovers"][number],
  lane:
    | "hottestMovers"
    | "mostLiquid"
    | "rawVsGraded"
    | "buylistSpreadLeaders"
    | "biggestReversals",
): MarketRefreshTier {
  if (
    lane === "hottestMovers" ||
    lane === "mostLiquid" ||
    lane === "biggestReversals"
  ) {
    return "tier1";
  }

  if (
    (product.marketPrice ?? 0) >= 10 &&
    (product.marketPrice ?? 0) <= 50 &&
    (product.liquidityScore ?? 0) >= 55
  ) {
    return "tier2";
  }

  return "tier3";
}

function buildCandidatePool(gamePlan: Awaited<ReturnType<typeof getFinanceHome>>) {
  const candidates = new Map<string, FinanceRefreshCandidate>();
  const lanes = [
    ["hottestMovers", gamePlan.hottestMovers],
    ["mostLiquid", gamePlan.mostLiquid],
    ["rawVsGraded", gamePlan.rawVsGraded],
    ["buylistSpreadLeaders", gamePlan.buylistSpreadLeaders],
    ["biggestReversals", gamePlan.biggestReversals],
  ] as const;

  for (const [lane, products] of lanes) {
    for (const product of products) {
      const nextCandidate: FinanceRefreshCandidate = {
        financeProductId: product.financeProductId,
        name: product.name,
        collectorNo: product.collectorNo,
        tier: getCandidateTier(product, lane),
      };
      const existing = candidates.get(product.financeProductId);

      if (!existing || tierPriority(nextCandidate.tier) > tierPriority(existing.tier)) {
        candidates.set(product.financeProductId, nextCandidate);
      }
    }
  }

  return [...candidates.values()];
}

function getRunIndex(now: Date, refreshIntervalMinutes: number) {
  const totalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return Math.floor(totalMinutes / Math.max(refreshIntervalMinutes, 1));
}

async function isCandidateRefreshFresh(
  game: GameSlug,
  candidate: FinanceRefreshCandidate,
  now: Date,
) {
  const sourceRef = await resolveFinanceExternalSourceRefForCard(
    {
      game,
      id: candidate.financeProductId,
      collectorNo: candidate.collectorNo,
    },
    "google-shopping",
  );

  return isMarketSnapshotFresh(
    getSourceRefLastScrapedAt(sourceRef),
    candidate.tier,
    now,
  );
}

async function persistLastRun(summary: FinanceMarketRefreshSummary) {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  await redis.set(LAST_RUN_CACHE_KEY, summary, { ex: LAST_RUN_TTL_SECONDS });
}

export async function runFinanceMarketRefresh(options?: {
  dryRun?: boolean;
  now?: Date;
}): Promise<FinanceMarketRefreshSummary> {
  const now = options?.now ?? new Date();
  const dryRun = Boolean(options?.dryRun);
  const config = getFinanceMarketRefreshConfig();
  const hasSupplementalEbay = hasEbayCredentials();
  const startedAt = new Date().toISOString();
  const notes: string[] = [
    "Google Shopping via Serper is the primary refresh lane; discovery search only runs when a card does not already have a saved Google product mapping.",
    "eBay is now supplemental. Its default browse budget is tracked for optional coverage, but missing eBay credentials no longer block scheduled refreshes.",
    "Taxonomy also defaults to 5,000 calls/day, but it is not being polled yet because NexusArchive is not using Taxonomy in the live finance runtime path.",
  ];

  const {
    availableBrowseCallsPerDay,
    runsPerDay,
    browseCallsBudgetPerRun,
  } = hasSupplementalEbay
    ? getBrowseCallsBudgetPerRun(config)
    : {
        availableBrowseCallsPerDay: 0,
        runsPerDay: getRunsPerDay(config.refreshIntervalMinutes),
        browseCallsBudgetPerRun: 0,
      };
  const plannedProductsPerRun = Math.max(1, config.maxProductsPerRun);
  const allocations = allocatePerGame(plannedProductsPerRun);
  const runIndex = getRunIndex(now, config.refreshIntervalMinutes);
  const gamePlans: FinanceRefreshGamePlan[] = [];

  for (const [gameIndex, game] of GAME_ORDER.entries()) {
    try {
      const home = await getFinanceHome(game);
      const candidates = buildCandidatePool(home);
      const selected = rotateTake(
        candidates,
        allocations.get(game) ?? 0,
        runIndex + gameIndex * 7,
      );

      gamePlans.push({
        game,
        candidatePoolSize: candidates.length,
        selected,
      });
    } catch (error) {
      console.error(`Finance refresh failed while planning ${game}:`, error);
      notes.push(
        `Skipped ${game} during this run because its finance home snapshot could not be built.`,
      );
      gamePlans.push({
        game,
        candidatePoolSize: 0,
        selected: [],
      });
    }
  }

  const warmedProducts: FinanceMarketRefreshSummary["warmedProducts"] = [];
  if (!dryRun) {
    for (const gamePlan of gamePlans) {
      for (const candidate of gamePlan.selected) {
        try {
          const snapshotIsFresh = await isCandidateRefreshFresh(
            gamePlan.game,
            candidate,
            now,
          );
          if (snapshotIsFresh) {
            notes.push(
              `Skipped ${candidate.name} in ${gamePlan.game} because its saved Google product snapshot is still fresh for ${candidate.tier}.`,
            );
            continue;
          }

          const detail = await getFinanceProductDetail(
            gamePlan.game,
            candidate.financeProductId,
            { refresh: true },
          );
          if (!detail) {
            continue;
          }

          warmedProducts.push({
            game: gamePlan.game,
            financeProductId: candidate.financeProductId,
            name: detail.name,
          });
        } catch (error) {
          console.error(
            `Finance refresh failed while warming ${gamePlan.game}:${candidate.financeProductId}:`,
            error,
          );
          notes.push(
            `Skipped ${candidate.name} in ${gamePlan.game} because its finance detail warm failed.`,
          );
        }
      }
    }

    const backupResult = await maybeBackupFinanceSourceMappings((message) => {
      notes.push(message);
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      notes.push(`Weekly source-mapping backup failed: ${message}`);
      return null;
    });
    if (backupResult?.ran) {
      notes.push(
        `Archived ${backupResult.sourceCount} saved Google product mappings to cold storage${backupResult.driveFileId ? " and mirrored them to Google Drive" : ""}.`,
      );
    } else if (backupResult?.skippedReason) {
      notes.push(backupResult.skippedReason);
    }
  }

  const summary: FinanceMarketRefreshSummary = {
    status: dryRun ? "dry-run" : "ok",
    environment: config.environment,
    startedAt,
    finishedAt: new Date().toISOString(),
    browseDailyLimit: config.browseDailyLimit,
    taxonomyDailyLimit: config.taxonomyDailyLimit,
    taxonomyPollingEnabled: config.taxonomyPollingEnabled,
    refreshIntervalMinutes: config.refreshIntervalMinutes,
    runsPerDay,
    reservedBrowseCallsPerDay: config.reservedBrowseCallsPerDay,
    availableBrowseCallsPerDay,
    assumedBrowseCallsPerProduct: config.assumedBrowseCallsPerProduct,
    browseCallsBudgetPerRun,
    maxProductsPerRun: config.maxProductsPerRun,
    plannedProductsPerRun,
    warmedProducts,
    gamePlans,
    notes: [
      ...notes,
      hasSupplementalEbay
        ? `Worst-case supplemental eBay browse usage is capped at ${plannedProductsPerRun * config.assumedBrowseCallsPerProduct} calls per run.`
        : "No eBay credentials were configured, so supplemental eBay browse traffic stayed at zero for this run.",
      `At ${runsPerDay} runs/day, scheduled refresh touches at most ${plannedProductsPerRun * runsPerDay} product detail caches per day before live user traffic.`,
    ],
  };

  if (!dryRun) {
    await persistLastRun(summary);
  }

  return summary;
}
