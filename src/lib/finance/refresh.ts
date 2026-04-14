import { getRedis } from "@/lib/storage/redis";
import { GAME_ORDER, type GameSlug } from "@/lib/games";
import { getFinanceHome, getFinanceProductDetail } from "@/lib/finance/query";

const LAST_RUN_CACHE_KEY = "finance:cron:ebay-refresh:last-run";
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

function buildCandidatePool(gamePlan: Awaited<ReturnType<typeof getFinanceHome>>) {
  const seen = new Set<string>();
  const ordered = [
    ...gamePlan.hottestMovers,
    ...gamePlan.mostLiquid,
    ...gamePlan.rawVsGraded,
    ...gamePlan.buylistSpreadLeaders,
    ...gamePlan.biggestReversals,
  ];

  return ordered
    .filter((product) => {
      if (seen.has(product.financeProductId)) {
        return false;
      }

      seen.add(product.financeProductId);
      return true;
    })
    .map((product) => ({
      financeProductId: product.financeProductId,
      name: product.name,
    }));
}

function getRunIndex(now: Date, refreshIntervalMinutes: number) {
  const totalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return Math.floor(totalMinutes / Math.max(refreshIntervalMinutes, 1));
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
  const startedAt = new Date().toISOString();
  const notes: string[] = [
    "Browse polling is scheduled around eBay's default 5,000 calls/day limit.",
    "Taxonomy also defaults to 5,000 calls/day, but it is not being polled yet because NexusArchive is not using Taxonomy in the live finance runtime path.",
  ];

  if (!hasEbayCredentials()) {
    return {
      status: "skipped",
      environment: config.environment,
      startedAt,
      finishedAt: new Date().toISOString(),
      browseDailyLimit: config.browseDailyLimit,
      taxonomyDailyLimit: config.taxonomyDailyLimit,
      taxonomyPollingEnabled: config.taxonomyPollingEnabled,
      refreshIntervalMinutes: config.refreshIntervalMinutes,
      runsPerDay: getRunsPerDay(config.refreshIntervalMinutes),
      reservedBrowseCallsPerDay: config.reservedBrowseCallsPerDay,
      availableBrowseCallsPerDay: 0,
      assumedBrowseCallsPerProduct: config.assumedBrowseCallsPerProduct,
      browseCallsBudgetPerRun: 0,
      maxProductsPerRun: config.maxProductsPerRun,
      plannedProductsPerRun: 0,
      warmedProducts: [],
      gamePlans: GAME_ORDER.map((game) => ({
        game,
        candidatePoolSize: 0,
        selected: [],
      })),
      notes: [...notes, "No eBay credentials were available, so the refresh run was skipped."],
    };
  }

  const {
    availableBrowseCallsPerDay,
    runsPerDay,
    browseCallsBudgetPerRun,
  } = getBrowseCallsBudgetPerRun(config);
  const plannedProductsPerRun = Math.max(
    1,
    Math.min(
      config.maxProductsPerRun,
      Math.floor(browseCallsBudgetPerRun / config.assumedBrowseCallsPerProduct),
    ),
  );
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
      `Worst-case browse usage is capped at ${plannedProductsPerRun * config.assumedBrowseCallsPerProduct} calls per run.`,
      `At ${runsPerDay} runs/day, that caps scheduled browse traffic at ${plannedProductsPerRun * config.assumedBrowseCallsPerProduct * runsPerDay} calls/day before live user traffic.`,
    ],
  };

  if (!dryRun) {
    await persistLastRun(summary);
  }

  return summary;
}
