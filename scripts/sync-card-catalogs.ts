import { createReadStream, createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

import { chain } from "stream-chain";
import { parser } from "stream-json";

import "./lib/load-env";
import type {
  CardCatalogMeta,
  CardCatalogSummary,
} from "../src/lib/cards/catalog";
import {
  buildCardSearchText,
  cardCatalogAllIdsKey,
  cardCatalogMetaKey,
  cardCatalogSummaryKey,
  cardCatalogTokenKey,
  cardCatalogTokenRegistryKey,
  coerceFloat,
  coerceInteger,
  compactText,
  tokenizeForIndex,
} from "../src/lib/cards/catalog";
import { warmCardGalleryCache } from "../src/lib/cards/query";
import type { GameSlug } from "../src/lib/games";
import { getRedis, isRedisConfigured } from "../src/lib/storage/redis";

import {
  archiveCardCatalogArtifacts,
  type ArchiveArtifact,
} from "./lib/card-catalog-archive";

const require = createRequire(import.meta.url);
type StreamArrayFactory = (options?: unknown) => unknown;
const streamArray = require(
  path.join(
    process.cwd(),
    "node_modules",
    "stream-json",
    "src",
    "streamers",
    "stream-array.js",
  ),
) as StreamArrayFactory;

type PreparedCardRecord = {
  id: string;
  summary: Omit<CardCatalogSummary, "searchText">;
  searchTerms?: Array<string | null | undefined>;
};

type SyncResult = {
  meta: CardCatalogMeta;
  records: PreparedCardRecord[];
  archiveArtifacts: ArchiveArtifact[];
};

type ScryfallBulkItem = {
  type: string;
  name: string;
  description: string;
  size: number;
  updated_at: string;
  download_uri: string;
};

type ScryfallBulkResponse = {
  data: ScryfallBulkItem[];
};

type ScryfallCard = Record<string, unknown> & {
  id?: string;
  name?: string;
  lang?: string;
  type_line?: string;
  mana_cost?: string;
  flavor_name?: string;
  color_identity?: string[];
  colors?: string[];
  cmc?: number;
  power?: string;
  toughness?: string;
  loyalty?: string;
  defense?: string;
  rarity?: string;
  layout?: string;
  set_type?: string;
  oracle_text?: string;
  printed_text?: string;
  keywords?: string[];
  flavor_text?: string;
  games?: string[];
  finishes?: string[];
  frame_effects?: string[];
  promo_types?: string[];
  produced_mana?: string[];
  set?: string;
  set_name?: string;
  collector_number?: string;
  oracle_id?: string;
  artist?: string;
  artist_ids?: string[];
  security_stamp?: string;
  prices?: {
    usd?: string;
    usd_foil?: string;
  };
  scryfall_uri?: string;
  image_uris?: {
    normal?: string;
    large?: string;
  };
  card_faces?: Array<{
    image_uris?: {
      normal?: string;
      large?: string;
    };
  }>;
};

type OptcgCard = Record<string, unknown> & {
  inventory_price?: number;
  market_price?: number;
  card_name?: string;
  set_name?: string;
  card_text?: string;
  set_id?: string;
  rarity?: string;
  card_set_id?: string;
  card_color?: string;
  card_type?: string;
  life?: number | string | null;
  card_cost?: string;
  card_power?: string;
  sub_types?: string;
  counter_amount?: number | string | null;
  attribute?: string;
  date_scraped?: string;
  card_image?: string;
};

type OnePieceOfficialSeriesBackfill = {
  seriesId: string;
  setCode: string;
  label: string;
};

type RiftCodexCard = {
  id: string;
  name: string;
  riftbound_id: string;
  collector_number?: number | null;
  attributes?: {
    energy?: number | null;
    might?: number | null;
    power?: number | null;
  } | null;
  classification?: {
    type?: string | null;
    supertype?: string | null;
    rarity?: string | null;
    domain?: string[] | null;
  } | null;
  text?: {
    rich?: string | null;
    plain?: string | null;
    flavour?: string | null;
  } | null;
  set?: {
    set_id?: string | null;
    label?: string | null;
  } | null;
  media?: {
    image_url?: string | null;
    artist?: string | null;
  } | null;
  tags?: string[] | null;
  metadata?: {
    clean_name?: string | null;
    updated_on?: string | null;
    alternate_art?: boolean | null;
    overnumbered?: boolean | null;
    signature?: boolean | null;
  } | null;
};

type RiftCodexCardsResponse = {
  items: RiftCodexCard[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

type OfficialRiftboundCard = {
  id: string;
  name: string;
  publicCode?: string | null;
  collectorNumber?: number | null;
  set?: {
    value?: {
      id?: string | null;
      label?: string | null;
    } | null;
  } | null;
  domain?: {
    values?: Array<{
      id?: string | null;
      label?: string | null;
    }> | null;
  } | null;
  rarity?: {
    value?: {
      id?: string | null;
      label?: string | null;
    } | null;
  } | null;
  cardType?: {
    type?: Array<{
      id?: string | null;
      label?: string | null;
    }> | null;
    superType?: Array<{
      id?: string | null;
      label?: string | null;
    }> | null;
  } | null;
  cardImage?: {
    url?: string | null;
  } | null;
  illustrator?: {
    values?: Array<{
      id?: string | null;
      label?: string | null;
    }> | null;
  } | null;
  tags?: {
    tags?: string[] | null;
  } | null;
  text?: {
    richText?: {
      body?: string | null;
    } | null;
  } | null;
  energy?: {
    value?: {
      id?: number | string | null;
      label?: string | null;
    } | null;
  } | null;
  might?: {
    value?: {
      id?: number | string | null;
      label?: string | null;
    } | null;
  } | null;
  power?: {
    value?: {
      id?: number | string | null;
      label?: string | null;
    } | null;
  } | null;
};

type SyncContext = {
  tempRoot: string;
  log: LogFn;
};

type LogFn = (message: string) => void;

type SyncLockInfo = {
  pid: number;
  cwd: string;
  games: GameSlug[];
  dryRun: boolean;
  startedAt: string;
};

type SyncLockHandle = {
  path: string;
  release: () => Promise<void>;
};

const COLOR_LABELS: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
};

const SCRYFALL_BULK_TYPE =
  process.env.SCRYFALL_BULK_TYPE === "all_cards"
    ? "all_cards"
    : "default_cards";

const DEFAULT_GAMES: GameSlug[] = [
  "magic-the-gathering",
  "one-piece",
  "riftbound",
];

const DOWNLOAD_PROGRESS_INTERVAL_BYTES = 25 * 1024 * 1024;
const SCRYFALL_PARSE_LOG_INTERVAL = 5_000;
const TOKEN_BUILD_LOG_INTERVAL = 5_000;
const REDIS_BATCH_LOG_INTERVAL = 50;
const REDIS_TOKEN_LOG_INTERVAL = 1_000;

function parseArgs(argv: string[]) {
  const games = new Set<GameSlug>();
  let dryRun = false;

  for (const arg of argv) {
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (!arg.startsWith("--game=")) {
      continue;
    }

    const raw = arg.slice("--game=".length).trim() as GameSlug;
    if (
      raw === "magic-the-gathering" ||
      raw === "one-piece" ||
      raw === "riftbound"
    ) {
      games.add(raw);
    }
  }

  return {
    dryRun,
    games: games.size > 0 ? [...games] : DEFAULT_GAMES,
    usedDefaultGames: games.size === 0,
  };
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDuration(milliseconds: number) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return "0s";
  }

  const totalSeconds = Math.round(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function createGameLogger(game: GameSlug): LogFn {
  return (message) => {
    console.log(`[${game}] ${message}`);
  };
}

function getSyncLockPath() {
  return path.join(process.cwd(), "data", ".sync-card-catalogs.lock.json");
}

function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "EPERM"
    ) {
      return true;
    }

    return false;
  }
}

async function readSyncLockInfo(lockPath: string) {
  try {
    const raw = await fs.readFile(lockPath, "utf8");
    return JSON.parse(raw) as SyncLockInfo;
  } catch {
    return null;
  }
}

async function acquireSyncLock(
  games: GameSlug[],
  dryRun: boolean,
): Promise<SyncLockHandle> {
  const lockPath = getSyncLockPath();
  await fs.mkdir(path.dirname(lockPath), { recursive: true });

  const lockInfo: SyncLockInfo = {
    pid: process.pid,
    cwd: process.cwd(),
    games,
    dryRun,
    startedAt: new Date().toISOString(),
  };

  while (true) {
    try {
      const handle = await fs.open(lockPath, "wx");
      await handle.writeFile(`${JSON.stringify(lockInfo, null, 2)}\n`, "utf8");
      await handle.close();
      break;
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? (error as NodeJS.ErrnoException).code
          : undefined;

      if (code !== "EEXIST") {
        throw error;
      }

      const existingLock = await readSyncLockInfo(lockPath);
      if (existingLock && isProcessAlive(existingLock.pid)) {
        throw new Error(
          [
            "Another sync-card-catalogs run is already active.",
            `PID: ${existingLock.pid}`,
            `Started: ${existingLock.startedAt}`,
            `Games: ${existingLock.games.join(", ")}`,
            "Wait for that run to finish, or stop it before starting a new import.",
          ].join(" "),
        );
      }

      console.log(
        `Found a stale sync lock at ${lockPath}; clearing it and continuing.`,
      );
      await fs.rm(lockPath, { force: true });
    }
  }

  return {
    path: lockPath,
    async release() {
      const existingLock = await readSyncLockInfo(lockPath);
      if (!existingLock || existingLock.pid === process.pid) {
        await fs.rm(lockPath, { force: true });
      }
    },
  };
}

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  return (await response.json()) as T;
}

async function fetchText(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  return response.text();
}

async function writeTempFile(
  tempRoot: string,
  fileName: string,
  content: string,
) {
  const filePath = path.join(tempRoot, fileName);
  await fs.writeFile(filePath, content, "utf8");
  return filePath;
}

async function writeTempJsonFile(
  tempRoot: string,
  fileName: string,
  content: unknown,
) {
  return writeTempFile(tempRoot, fileName, JSON.stringify(content, null, 2));
}

async function downloadToFile(
  url: string,
  filePath: string,
  init?: RequestInit,
  options?: {
    label?: string;
    log?: LogFn;
    expectedBytes?: number | null;
  },
) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  if (!response.body) {
    throw new Error(`Response body was empty for ${url}`);
  }

  const startedAt = Date.now();
  const headerLength = Number(response.headers.get("content-length"));
  const totalBytes =
    options?.expectedBytes && options.expectedBytes > 0
      ? options.expectedBytes
      : Number.isFinite(headerLength) && headerLength > 0
        ? headerLength
        : null;
  const label = options?.label ?? path.basename(filePath);
  let receivedBytes = 0;
  let nextByteCheckpoint = DOWNLOAD_PROGRESS_INTERVAL_BYTES;
  let nextPercentCheckpoint = 10;

  options?.log?.(
    `Downloading ${label}${totalBytes ? ` (${formatBytes(totalBytes)})` : ""}...`,
  );

  const progressTap = new Transform({
    transform(chunk, _encoding, callback) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      receivedBytes += buffer.length;

      if (options?.log) {
        if (totalBytes) {
          const percent = Math.floor((receivedBytes / totalBytes) * 100);
          while (percent >= nextPercentCheckpoint && nextPercentCheckpoint < 100) {
            options.log(
              `Downloaded ${label}: ${formatBytes(receivedBytes)} / ${formatBytes(totalBytes)} (${nextPercentCheckpoint}%)`,
            );
            nextPercentCheckpoint += 10;
          }
        } else if (receivedBytes >= nextByteCheckpoint) {
          options.log(`Downloaded ${label}: ${formatBytes(receivedBytes)} so far...`);
          nextByteCheckpoint += DOWNLOAD_PROGRESS_INTERVAL_BYTES;
        }
      }

      callback(null, buffer);
    },
  });

  await pipeline(
    Readable.fromWeb(response.body as unknown as NodeReadableStream),
    progressTap,
    createWriteStream(filePath),
  );

  options?.log?.(
    `Downloaded ${label}: ${formatBytes(receivedBytes)} in ${formatDuration(Date.now() - startedAt)}.`,
  );
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

function normalizeMagicColors(card: ScryfallCard) {
  const colors =
    Array.isArray(card.color_identity) && card.color_identity.length > 0
      ? card.color_identity
      : Array.isArray(card.colors) && card.colors.length > 0
        ? card.colors
        : ["C"];

  return colors.map((color) => COLOR_LABELS[color] ?? color);
}

function getScryfallImage(card: ScryfallCard) {
  if (card.image_uris?.large) {
    return card.image_uris.large;
  }

  if (card.image_uris?.normal) {
    return card.image_uris.normal;
  }

  if (Array.isArray(card.card_faces)) {
    for (const face of card.card_faces) {
      if (face.image_uris?.large) {
        return face.image_uris.large;
      }

      if (face.image_uris?.normal) {
        return face.image_uris.normal;
      }
    }
  }

  return null;
}

function mapScryfallCard(card: ScryfallCard): PreparedCardRecord | null {
  if (!card.id || !card.name) {
    return null;
  }

  return {
    id: card.id,
    summary: {
      id: card.id,
      game: "magic-the-gathering",
      name: card.name,
      familyKey: compactText(card.oracle_id) ?? undefined,
      language: card.lang ?? null,
      type: card.type_line ?? null,
      domains: normalizeMagicColors(card),
      tags: [],
      energyCost: coerceInteger(card.cmc),
      power: coerceInteger(card.power),
      might: coerceInteger(card.toughness),
      hp: coerceInteger(card.loyalty) ?? coerceInteger(card.defense),
      rarity: card.rarity ?? null,
      text: compactText(card.oracle_text ?? card.printed_text),
      flavor: compactText(card.flavor_text),
      setCode: card.set ?? null,
      setName: card.set_name ?? null,
      collectorNo: card.collector_number ?? null,
      imageUrl: getScryfallImage(card),
      artist: card.artist ?? null,
      marketPrice: coerceFloat(card.prices?.usd ?? card.prices?.usd_foil),
      source:
        SCRYFALL_BULK_TYPE === "all_cards"
          ? "scryfall-all-cards"
          : "scryfall-default-cards",
      externalUrl: card.scryfall_uri ?? null,
    },
    searchTerms: [
      card.lang,
      card.mana_cost,
      card.flavor_name,
      card.layout,
      card.set_type,
      card.oracle_id,
      card.security_stamp,
      ...(card.keywords ?? []),
      ...(card.games ?? []),
      ...(card.finishes ?? []),
      ...(card.frame_effects ?? []),
      ...(card.promo_types ?? []),
      ...(card.produced_mana ?? []),
      ...(card.artist_ids ?? []),
    ],
  };
}

async function parseScryfallCards(filePath: string, log?: LogFn) {
  const records: PreparedCardRecord[] = [];
  const startedAt = Date.now();
  let processedCount = 0;
  let nextLogAt = SCRYFALL_PARSE_LOG_INTERVAL;
  const runChain = chain as unknown as (steps: unknown[]) => AsyncIterable<{
    value: unknown;
  }>;
  const stream = runChain([
    createReadStream(filePath),
    parser(),
    streamArray(),
  ]);

  for await (const entry of stream) {
    processedCount += 1;
    const mapped = mapScryfallCard(entry.value as ScryfallCard);
    if (mapped) {
      records.push(mapped);
    }

    if (log && processedCount >= nextLogAt) {
      log(`Parsed ${processedCount.toLocaleString()} Scryfall records so far...`);
      nextLogAt += SCRYFALL_PARSE_LOG_INTERVAL;
    }
  }

  log?.(
    `Finished parsing Scryfall dump: ${records.length.toLocaleString()} cards in ${formatDuration(Date.now() - startedAt)}.`,
  );
  return records;
}

async function fetchMagicCards(context: SyncContext): Promise<SyncResult> {
  const headers = {
    "User-Agent": "NexusArchive/0.1 (+https://nexusarchive.lol)",
    Accept: "application/json;q=0.9,*/*;q=0.8",
  };

  const bulk = await fetchJson<ScryfallBulkResponse>(
    "https://api.scryfall.com/bulk-data",
    { headers },
  );

  const selected = bulk.data.find((item) => item.type === SCRYFALL_BULK_TYPE);
  if (!selected) {
    throw new Error(`Unable to find Scryfall bulk type: ${SCRYFALL_BULK_TYPE}`);
  }

  const bulkFileName =
    SCRYFALL_BULK_TYPE === "all_cards"
      ? "scryfall-all-cards.json"
      : "scryfall-default-cards.json";
  const bulkFilePath = path.join(context.tempRoot, bulkFileName);

  context.log(
    `Fetching ${selected.name} from Scryfall (${selected.size.toLocaleString()} bytes)...`,
  );

  await downloadToFile(selected.download_uri, bulkFilePath, { headers }, {
    label: selected.name,
    log: context.log,
    expectedBytes: selected.size,
  });
  context.log("Parsing Scryfall bulk file into normalized card records...");
  const records = await parseScryfallCards(bulkFilePath, context.log);
  const bulkMetadataPath = await writeTempJsonFile(
    context.tempRoot,
    "scryfall-bulk-metadata.json",
    selected,
  );

  return {
    meta: {
      game: "magic-the-gathering",
      source:
        SCRYFALL_BULK_TYPE === "all_cards"
          ? "scryfall-all-cards"
          : "scryfall-default-cards",
      sourceLabel: `Scryfall ${selected.name}`,
      sourceUrl: selected.download_uri,
      cardCount: records.length,
      importedAt: new Date().toISOString(),
      upstreamUpdatedAt: selected.updated_at,
      notes: [
        selected.description,
        SCRYFALL_BULK_TYPE === "all_cards"
          ? "This import keeps every language Scryfall publishes, so expect a large Redis footprint."
          : "This import uses Scryfall's English-first default card dump to keep the first pass saner on Redis.",
      ],
    },
    records,
    archiveArtifacts: [
      {
        fileName: bulkFileName,
        contentType: "application/json",
        sourceUrl: selected.download_uri,
        tempFilePath: bulkFilePath,
      },
      {
        fileName: "scryfall-bulk-metadata.json",
        contentType: "application/json",
        sourceUrl: "https://api.scryfall.com/bulk-data",
        tempFilePath: bulkMetadataPath,
      },
    ],
  };
}

function splitOptcgColors(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(/[\/,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

const ONE_PIECE_OFFICIAL_CARDLIST_BASE_URL =
  "https://en.onepiece-cardgame.com";
const ONE_PIECE_OFFICIAL_BACKFILL_SERIES: OnePieceOfficialSeriesBackfill[] = [
  {
    seriesId: "569005",
    setCode: "ST-05",
    label: "ONE PIECE FILM edition [ST-05]",
  },
];

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function extractOnePieceOfficialField(
  block: string,
  className: string,
) {
  const match = block.match(
    new RegExp(`<div class="${className}">([\\s\\S]*?)</div>`, "i"),
  );
  if (!match?.[1]) {
    return null;
  }

  return htmlToPlainText(match[1].replace(/<h3>[\s\S]*?<\/h3>/i, ""));
}

function extractOnePieceOfficialStat(
  block: string,
  className: string,
) {
  const match = block.match(
    new RegExp(
      `<div class="${className}">\\s*<h3>([\\s\\S]*?)<\\/h3>([\\s\\S]*?)<\\/div>`,
      "i",
    ),
  );
  if (!match?.[1]) {
    return null;
  }

  return {
    label: htmlToPlainText(match[1]),
    value: htmlToPlainText(match[2]),
  };
}

function normalizeOnePieceOfficialSetCode(
  collectorNo: string,
  setInfo: string | null,
  fallbackSetCode: string,
) {
  const fromSetInfo = compactText(
    setInfo?.match(/\[([A-Z0-9-]+)\]\s*$/i)?.[1] ?? null,
  );
  if (fromSetInfo) {
    return fromSetInfo.toUpperCase();
  }

  const fromCollector = compactText(
    collectorNo.match(/^(ST\d{2}|OP\d{2}|P-\d{3}|EB\d{2})/i)?.[1] ?? null,
  );
  if (fromCollector?.startsWith("ST") && fromCollector.length === 4) {
    return `${fromCollector.slice(0, 2)}-${fromCollector.slice(2)}`.toUpperCase();
  }

  return fallbackSetCode;
}

function mapOnePieceOfficialCardBlock(
  block: string,
  sourceUrl: string,
  fallbackSetCode: string,
  fallbackSetLabel: string,
): PreparedCardRecord | null {
  const collectorNo = compactText(
    block.match(/<dl class="modalCol" id="([^"]+)"/i)?.[1] ?? null,
  );
  const name = compactText(
    htmlToPlainText(block.match(/<div class="cardName">([\s\S]*?)<\/div>/i)?.[1]),
  );

  if (!collectorNo || !name) {
    return null;
  }

  const spanValues = [...block.matchAll(/<span>([\s\S]*?)<\/span>/gi)]
    .map((match) => compactText(htmlToPlainText(match[1])))
    .filter((value): value is string => Boolean(value));
  const rarity = compactText(spanValues[1] ?? null);
  const type = compactText(
    spanValues[2] ? toTitleCase(spanValues[2]) : null,
  );

  const imageRelativePath = compactText(
    block.match(/data-src="([^"]+)"/i)?.[1] ?? null,
  );
  const imageUrl = imageRelativePath
    ? new URL(
        imageRelativePath,
        `${ONE_PIECE_OFFICIAL_CARDLIST_BASE_URL}/cardlist/`,
      ).href
    : null;

  const costField = extractOnePieceOfficialStat(block, "cost");
  const powerField = extractOnePieceOfficialStat(block, "power");
  const counterField = extractOnePieceOfficialStat(block, "counter");
  const color = extractOnePieceOfficialField(block, "color");
  const attribute = extractOnePieceOfficialField(block, "attribute");
  const feature = extractOnePieceOfficialField(block, "feature");
  const effect = extractOnePieceOfficialField(block, "text");
  const setInfo =
    extractOnePieceOfficialField(block, "getInfo") ?? fallbackSetLabel;

  const energyCost =
    costField?.label?.toLowerCase() === "cost"
      ? coerceInteger(costField.value)
      : null;
  const life =
    costField?.label?.toLowerCase() === "life"
      ? coerceInteger(costField.value)
      : null;

  return {
    id: collectorNo,
    summary: {
      id: collectorNo,
      game: "one-piece",
      name,
      language: "en",
      type,
      domains: splitOptcgColors(color ?? undefined),
      tags: [],
      energyCost,
      power: coerceInteger(powerField?.value),
      might: life,
      hp:
        counterField?.value && counterField.value !== "-"
          ? coerceInteger(counterField.value)
          : null,
      rarity,
      text: compactText(effect),
      flavor: compactText(feature),
      setCode: normalizeOnePieceOfficialSetCode(
        collectorNo,
        setInfo,
        fallbackSetCode,
      ),
      setName: compactText(setInfo),
      collectorNo,
      imageUrl,
      artist: null,
      marketPrice: null,
      source: "one-piece-official-cardlist",
      externalUrl: sourceUrl,
    },
    searchTerms: [
      attribute,
      feature,
      setInfo,
      collectorNo,
      rarity,
      color,
      type,
      costField?.label,
      costField?.value,
      powerField?.value,
      counterField?.value,
    ],
  };
}

function parseOnePieceOfficialCardlistPage(
  html: string,
  sourceUrl: string,
  fallbackSetCode: string,
  fallbackSetLabel: string,
) {
  const records: PreparedCardRecord[] = [];
  const blockRegex = /<dl class="modalCol" id="[^"]+">[\s\S]*?<\/dl>/gi;

  for (const match of html.matchAll(blockRegex)) {
    const mapped = mapOnePieceOfficialCardBlock(
      match[0],
      sourceUrl,
      fallbackSetCode,
      fallbackSetLabel,
    );
    if (mapped) {
      records.push(mapped);
    }
  }

  return records;
}

function mapOptcgCard(card: OptcgCard): PreparedCardRecord | null {
  if (!card.card_set_id || !card.card_name) {
    return null;
  }

  return {
    id: card.card_set_id,
    summary: {
      id: card.card_set_id,
      game: "one-piece",
      name: card.card_name,
      language: "en",
      type: card.card_type ?? null,
      domains: splitOptcgColors(card.card_color),
      tags: [],
      energyCost: coerceInteger(card.card_cost),
      power: coerceInteger(card.card_power),
      might: coerceInteger(card.life),
      hp: coerceInteger(card.counter_amount),
      rarity: card.rarity ?? null,
      text: compactText(card.card_text),
      flavor: compactText(card.sub_types),
      setCode: card.set_id ?? null,
      setName: card.set_name ?? null,
      collectorNo: card.card_set_id ?? null,
      imageUrl: typeof card.card_image === "string" ? card.card_image : null,
      artist: null,
      marketPrice: coerceFloat(card.market_price ?? card.inventory_price),
      source: "optcgapi-all-set-cards",
      externalUrl: null,
    },
    searchTerms: [
      card.attribute,
      card.sub_types,
      card.card_set_id,
      card.set_id,
      card.rarity,
      card.card_color,
      card.card_type,
      card.card_cost,
      card.card_power,
      card.life != null ? String(card.life) : null,
      card.counter_amount != null ? String(card.counter_amount) : null,
    ],
  };
}

async function fetchOnePieceCards(context: SyncContext): Promise<SyncResult> {
  context.log("Fetching all-set card data from OPTCG API...");
  const response = await fetch("https://optcgapi.com/api/allSetCards/");
  if (!response.ok) {
    throw new Error(
      `Failed to fetch https://optcgapi.com/api/allSetCards/ (${response.status})`,
    );
  }

  const rawText = await response.text();
  context.log(
    `Downloaded OPTCG payload (${formatBytes(Buffer.byteLength(rawText, "utf8"))}). Parsing JSON...`,
  );
  const rawFilePath = await writeTempFile(
    context.tempRoot,
    "optcgapi-all-set-cards.json",
    rawText,
  );
  const cards = JSON.parse(rawText) as OptcgCard[];
  context.log(`Normalizing ${cards.length.toLocaleString()} One Piece cards...`);
  const recordsById = new Map<string, PreparedCardRecord>();

  for (const card of cards) {
    const mapped = mapOptcgCard(card);
    if (mapped) {
      recordsById.set(mapped.id, mapped);
    }
  }

  const archiveArtifacts: ArchiveArtifact[] = [
    {
      fileName: "optcgapi-all-set-cards.json",
      contentType: "application/json",
      sourceUrl: "https://optcgapi.com/api/allSetCards/",
      tempFilePath: rawFilePath,
    },
  ];
  let officialBackfillCount = 0;

  for (const series of ONE_PIECE_OFFICIAL_BACKFILL_SERIES) {
    const seriesUrl = `${ONE_PIECE_OFFICIAL_CARDLIST_BASE_URL}/cardlist/?series=${series.seriesId}`;
    context.log(`Checking official One Piece cardlist backfill for ${series.label}...`);
    const html = await fetchText(seriesUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NexusArchive/0.1; +https://nexusarchive.lol)",
        Accept: "text/html;q=0.9,*/*;q=0.8",
      },
    });
    const fileName = `one-piece-official-${series.setCode.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    const tempFilePath = await writeTempFile(context.tempRoot, fileName, html);
    archiveArtifacts.push({
      fileName,
      contentType: "text/html",
      sourceUrl: seriesUrl,
      tempFilePath,
    });

    const officialRecords = parseOnePieceOfficialCardlistPage(
      html,
      seriesUrl,
      series.setCode,
      series.label,
    );
    for (const record of officialRecords) {
      if (!recordsById.has(record.id)) {
        recordsById.set(record.id, record);
        officialBackfillCount += 1;
      }
    }
  }

  const records = [...recordsById.values()];
  const upstreamUpdatedAt = compactText(
    cards
      .map((card) =>
        typeof card.date_scraped === "string" ? card.date_scraped : "",
      )
      .filter(Boolean)
      .sort()
      .at(-1),
  );

  return {
    meta: {
      game: "one-piece",
      source: "optcgapi-all-set-cards",
      sourceLabel: "OPTCG API all set cards",
      sourceUrl: "https://optcgapi.com/api/allSetCards/",
      cardCount: records.length,
      importedAt: new Date().toISOString(),
      upstreamUpdatedAt,
      notes: [
        "Pulled from optcgapi.com's all-set card endpoint.",
        `Backfilled ${officialBackfillCount} missing One Piece cards from Bandai's official card list.`,
        "Current pricing fields use the upstream market and inventory values when present.",
      ],
    },
    records,
    archiveArtifacts,
  };
}

const RIFTCODEX_API_URL = "https://api.riftcodex.com/cards";
const RIFTBOUND_OFFICIAL_GALLERY_URL =
  "https://riftbound.leagueoflegends.com/en-us/card-gallery/";
const RIFTBOUND_BASE_SET_CODES = new Set(["OGN", "OGS", "SFD", "UNL"]);

function slugifyIdPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function htmlToPlainText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return compactText(
    decodeHtmlEntities(value)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  );
}

function getLatestTimestamp(values: Array<string | null | undefined>) {
  return [...values]
    .map((value) => compactText(value))
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
}

function formatRiftboundPublicCode(code: string | null | undefined) {
  if (!code) {
    return null;
  }

  const parts = code.toUpperCase().split("-");
  if (parts.length === 3) {
    const [setCode, collector, total] = parts;
    return `${setCode}-${collector}/${total}`;
  }

  if (parts.length === 2) {
    const [setCode, collector] = parts;
    return `${setCode}-${collector}`;
  }

  return code.toUpperCase();
}

function normalizeRiftboundId(code: string | null | undefined) {
  if (!code) {
    return null;
  }

  return code.toLowerCase().replace(/-star-/g, "*-");
}

function formatRiftboundType(
  type: string | null | undefined,
  supertype: string | null | undefined,
) {
  const parts = [compactText(supertype), compactText(type)].filter(
    (value): value is string => Boolean(value),
  );

  return parts.length > 0 ? parts.join(" ") : null;
}

function getRiftboundVariantKey(card: RiftCodexCard) {
  const variantFlags = [
    card.metadata?.signature ? "signature" : null,
    card.metadata?.alternate_art ? "alternate-art" : null,
    card.metadata?.overnumbered ? "overnumbered" : null,
  ].filter((value): value is string => Boolean(value));

  const parenthetical =
    compactText(card.name.match(/\(([^)]+)\)\s*$/)?.[1]) ??
    compactText(card.metadata?.clean_name?.replace(card.name, ""));

  const base = parenthetical ? slugifyIdPart(parenthetical) : null;
  const primary =
    base ??
    variantFlags[0] ??
    compactText(card.metadata?.clean_name)
      ?.replace(card.name, "")
      ?.trim();

  return (
    (primary ? slugifyIdPart(primary) : null) ??
    variantFlags.map(slugifyIdPart).find(Boolean) ??
    card.id.toLowerCase()
  );
}

function buildRiftCodexStableIds(cards: RiftCodexCard[]) {
  const grouped = new Map<string, RiftCodexCard[]>();

  for (const card of cards) {
    if (!card.riftbound_id) {
      continue;
    }

    const key = card.riftbound_id.toLowerCase();
    const group = grouped.get(key) ?? [];
    group.push(card);
    grouped.set(key, group);
  }

  const idMap = new Map<string, string>();
  const usedIds = new Set<string>();

  for (const [baseId, group] of grouped.entries()) {
    const sortedGroup = [...group].sort((left, right) => {
      const leftVariant = getRiftboundVariantKey(left);
      const rightVariant = getRiftboundVariantKey(right);
      const leftHasVariant = leftVariant !== left.id.toLowerCase();
      const rightHasVariant = rightVariant !== right.id.toLowerCase();

      if (leftHasVariant !== rightHasVariant) {
        return Number(leftHasVariant) - Number(rightHasVariant);
      }

      return left.name.localeCompare(right.name, undefined, {
        sensitivity: "base",
      });
    });

    for (const [index, card] of sortedGroup.entries()) {
      let resolvedId = baseId;
      if (index > 0 || usedIds.has(baseId)) {
        resolvedId = `${baseId}::${getRiftboundVariantKey(card)}`;
      }
      while (usedIds.has(resolvedId)) {
        resolvedId = `${resolvedId}::${card.id.toLowerCase()}`;
      }

      idMap.set(card.id, resolvedId);
      usedIds.add(resolvedId);
    }
  }

  return idMap;
}

function mapRiftCodexCard(
  card: RiftCodexCard,
  stableId: string,
): PreparedCardRecord | null {
  if (!card.name || !card.riftbound_id) {
    return null;
  }

  const domains = [
    ...new Set(
      (card.classification?.domain ?? [])
        .map((value) => compactText(value))
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const tags = [
    ...new Set(
      (card.tags ?? [])
        .map((value) => compactText(value))
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  return {
    id: stableId,
    summary: {
      id: stableId,
      game: "riftbound",
      name: card.name,
      language: "en",
      type: formatRiftboundType(
        card.classification?.type,
        card.classification?.supertype,
      ),
      domains,
      tags,
      energyCost: coerceInteger(card.attributes?.energy),
      power: coerceInteger(card.attributes?.power),
      might: coerceInteger(card.attributes?.might),
      hp: null,
      rarity: compactText(card.classification?.rarity),
      text: compactText(card.text?.plain) ?? htmlToPlainText(card.text?.rich),
      flavor: compactText(card.text?.flavour),
      setCode: compactText(card.set?.set_id),
      setName: compactText(card.set?.label),
      collectorNo: formatRiftboundPublicCode(card.riftbound_id),
      imageUrl: compactText(card.media?.image_url),
      artist: compactText(card.media?.artist),
      marketPrice: null,
      source: "riftcodex-cards",
      externalUrl: null,
    },
    searchTerms: [
      card.riftbound_id,
      card.metadata?.clean_name,
      card.metadata?.alternate_art ? "alternate art" : null,
      card.metadata?.overnumbered ? "overnumbered" : null,
      card.metadata?.signature ? "signature" : null,
      card.collector_number != null ? String(card.collector_number) : null,
    ],
  };
}

async function fetchOfficialRiftboundGalleryCards() {
  const html = await fetchText(RIFTBOUND_OFFICIAL_GALLERY_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; NexusArchive/0.1; +https://nexusarchive.lol)",
      Accept: "text/html;q=0.9,*/*;q=0.8",
    },
  });

  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match?.[1]) {
    throw new Error("Unable to locate official Riftbound gallery payload.");
  }

  const data = JSON.parse(match[1]) as {
    props?: {
      pageProps?: {
        page?: {
          blades?: Array<{
            type?: string;
            cards?: {
              items?: OfficialRiftboundCard[];
            };
          }>;
        };
      };
    };
  };

  const galleryBlade = data.props?.pageProps?.page?.blades?.find(
    (blade) => blade.type === "riftboundCardGallery",
  );

  return galleryBlade?.cards?.items ?? [];
}

function mapOfficialRiftboundCard(card: OfficialRiftboundCard) {
  if (!card.id || !card.name) {
    return null;
  }

  const domains = [
    ...new Set(
      (card.domain?.values ?? [])
        .map((value) => compactText(value.label))
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const tags = [
    ...new Set(
      (card.tags?.tags ?? [])
        .map((value) => compactText(value))
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  const typeLabel = compactText(card.cardType?.type?.[0]?.label);
  const superTypeLabel = compactText(card.cardType?.superType?.[0]?.label);

  return {
    id: normalizeRiftboundId(card.id) ?? card.id.toLowerCase(),
    summary: {
      id: normalizeRiftboundId(card.id) ?? card.id.toLowerCase(),
      game: "riftbound",
      name: card.name,
      language: "en",
      type: formatRiftboundType(typeLabel, superTypeLabel),
      domains,
      tags,
      energyCost: coerceInteger(card.energy?.value?.id),
      power: coerceInteger(card.power?.value?.id),
      might: coerceInteger(card.might?.value?.id),
      hp: null,
      rarity: compactText(card.rarity?.value?.label),
      text: htmlToPlainText(card.text?.richText?.body),
      flavor: null,
      setCode: compactText(card.set?.value?.id),
      setName: compactText(card.set?.value?.label),
      collectorNo:
        compactText(card.publicCode) ??
        formatRiftboundPublicCode(normalizeRiftboundId(card.id)),
      imageUrl: compactText(card.cardImage?.url),
      artist: compactText(card.illustrator?.values?.[0]?.label),
      marketPrice: null,
      source: "riftbound-official-gallery",
      externalUrl: null,
    },
    searchTerms: [
      card.id,
      compactText(card.publicCode),
      compactText(card.rarity?.value?.id),
      compactText(card.cardType?.type?.[0]?.id),
      compactText(card.cardType?.superType?.[0]?.id),
    ],
  } satisfies PreparedCardRecord;
}

async function fetchRiftboundCards(context: SyncContext): Promise<SyncResult> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (compatible; NexusArchive/0.1; +https://nexusarchive.lol)",
    Accept: "application/json;q=0.9,*/*;q=0.8",
  };

  const firstPage = await fetchJson<RiftCodexCardsResponse>(
    `${RIFTCODEX_API_URL}?limit=100&page=1`,
    { headers },
  );
  context.log(
    `Fetched RiftCodex page 1/${firstPage.pages} with ${firstPage.items.length.toLocaleString()} cards.`,
  );
  const apiPages: RiftCodexCardsResponse[] = [firstPage];

  for (let page = 2; page <= firstPage.pages; page += 1) {
    const pageResult = await fetchJson<RiftCodexCardsResponse>(
      `${RIFTCODEX_API_URL}?limit=100&page=${page}`,
      { headers },
    );
    apiPages.push(pageResult);
    context.log(
      `Fetched RiftCodex page ${page}/${firstPage.pages} (${pageResult.items.length.toLocaleString()} cards on this page).`,
    );
  }

  const riftCodexCards = apiPages.flatMap((page) => page.items);
  context.log(
    `Normalizing ${riftCodexCards.length.toLocaleString()} RiftCodex cards into stable IDs...`,
  );
  const stableIds = buildRiftCodexStableIds(riftCodexCards);
  const recordsById = new Map<string, PreparedCardRecord>();

  for (const card of riftCodexCards) {
    const stableId = stableIds.get(card.id);
    if (!stableId) {
      continue;
    }

    const mapped = mapRiftCodexCard(card, stableId);
    if (mapped) {
      recordsById.set(mapped.id, mapped);
    }
  }

  context.log("Fetching official Riftbound gallery for missing-card backfill...");
  const officialCards = await fetchOfficialRiftboundGalleryCards();
  context.log(
    `Loaded ${officialCards.length.toLocaleString()} official gallery cards for backfill checks.`,
  );
  let officialBackfillCount = 0;

  for (const card of officialCards) {
    const setCode = compactText(card.set?.value?.id);
    const normalizedId = normalizeRiftboundId(card.id);

    if (
      !normalizedId ||
      !setCode ||
      !RIFTBOUND_BASE_SET_CODES.has(setCode) ||
      recordsById.has(normalizedId)
    ) {
      continue;
    }

    const mapped = mapOfficialRiftboundCard(card);
    if (mapped) {
      recordsById.set(mapped.id, mapped);
      officialBackfillCount += 1;
    }
  }

  const rawApiFilePath = await writeTempJsonFile(
    context.tempRoot,
    "riftcodex-cards-pages.json",
    apiPages,
  );
  const officialGalleryFilePath = await writeTempJsonFile(
    context.tempRoot,
    "riftbound-official-gallery-cards.json",
    officialCards,
  );

  return {
    meta: {
      game: "riftbound",
      source: "riftcodex-cards",
      sourceLabel: "RiftCodex cards API",
      sourceUrl: RIFTCODEX_API_URL,
      cardCount: recordsById.size,
      importedAt: new Date().toISOString(),
      upstreamUpdatedAt: getLatestTimestamp(
        riftCodexCards.map((card) => card.metadata?.updated_on),
      ),
      notes: [
        "Primary sync now uses the fan-maintained RiftCodex API for structured Riftbound card data.",
        `Backfilled ${officialBackfillCount} official gallery cards that RiftCodex does not currently expose.`,
        "RiftCodex includes additional promos and judge cards beyond Riot's public gallery, so the final catalog is broader than the official base gallery alone.",
      ],
    },
    records: [...recordsById.values()],
    archiveArtifacts: [
      {
        fileName: "riftcodex-cards-pages.json",
        contentType: "application/json",
        sourceUrl: RIFTCODEX_API_URL,
        tempFilePath: rawApiFilePath,
      },
      {
        fileName: "riftbound-official-gallery-cards.json",
        contentType: "application/json",
        sourceUrl: RIFTBOUND_OFFICIAL_GALLERY_URL,
        tempFilePath: officialGalleryFilePath,
      },
    ],
  };
}

async function clearExistingCatalog(game: GameSlug, log?: LogFn) {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis is not configured.");
  }

  const existingIds =
    ((await redis.lrange(cardCatalogAllIdsKey(game), 0, -1)) as string[] | null) ??
    [];
  const tokenKeys =
    ((await redis.smembers(cardCatalogTokenRegistryKey(game))) as string[] | null) ??
    [];
  const keysToDelete = [
    cardCatalogMetaKey(game),
    cardCatalogAllIdsKey(game),
    cardCatalogTokenRegistryKey(game),
    ...tokenKeys,
    ...existingIds.map((id) => cardCatalogSummaryKey(game, id)),
  ];

  if (keysToDelete.length === 0) {
    log?.("No previous Redis catalog keys found to clear.");
    return;
  }

  log?.(
    `Clearing ${keysToDelete.length.toLocaleString()} existing Redis keys before import...`,
  );

  const groups = chunk(keysToDelete, 250);
  for (const [index, group] of groups.entries()) {
    if (group.length === 0) {
      continue;
    }

    const pipeline = redis.pipeline();
    for (const key of group) {
      pipeline.del(key);
    }
    await pipeline.exec();

    if (
      log &&
      (index === 0 ||
        (index + 1) % 10 === 0 ||
        index === groups.length - 1)
    ) {
      log(
        `Cleared ${Math.min((index + 1) * 250, keysToDelete.length).toLocaleString()} / ${keysToDelete.length.toLocaleString()} Redis keys (${index + 1}/${groups.length} batches).`,
      );
    }
  }
}

function buildTokenMap(
  records: Array<PreparedCardRecord & { summary: CardCatalogSummary }>,
  log?: LogFn,
) {
  const tokenMap = new Map<string, string[]>();
  let nextLogAt = TOKEN_BUILD_LOG_INTERVAL;

  for (const [index, card] of records.entries()) {
    const tokens = tokenizeForIndex([card.summary.searchText]);

    for (const token of tokens) {
      const ids = tokenMap.get(token) ?? [];
      ids.push(card.id);
      tokenMap.set(token, ids);
    }

    if (log && index + 1 >= nextLogAt) {
      log(`Tokenized ${index + 1} / ${records.length} cards for search indexing...`);
      nextLogAt += TOKEN_BUILD_LOG_INTERVAL;
    }
  }

  log?.(`Built ${tokenMap.size.toLocaleString()} token buckets for search.`);
  return tokenMap;
}

async function writeCatalog(result: SyncResult, dryRun: boolean, log: LogFn) {
  const startedAt = Date.now();
  const records = result.records
    .map((record) => ({
      ...record,
      summary: {
        ...record.summary,
        searchText: buildCardSearchText(record.summary, record.searchTerms),
      },
    }))
    .sort((left, right) =>
      left.summary.name.localeCompare(right.summary.name, undefined, {
        sensitivity: "base",
      }),
    );

  result.meta.cardCount = records.length;

  if (dryRun) {
    log(
      `[dry-run] Prepared ${records.length.toLocaleString()} cards from ${result.meta.sourceLabel}.`,
    );
    console.log(
      JSON.stringify(
        {
          meta: result.meta,
          archiveArtifacts: result.archiveArtifacts.map(
            (artifact) => artifact.fileName,
          ),
          sample: records.slice(0, 2).map((record) => record.summary),
        },
        null,
        2,
      ),
    );
    return;
  }

  const redis = getRedis();
  if (!redis) {
    throw new Error(
      "Redis is not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN first.",
    );
  }

  log(`Preparing ${records.length.toLocaleString()} normalized cards for Redis...`);
  await clearExistingCatalog(result.meta.game, log);
  log("Building search token index...");
  const tokenMap = buildTokenMap(records, log);

  log("Writing catalog metadata to Redis...");
  await redis.set(cardCatalogMetaKey(result.meta.game), result.meta);

  const recordGroups = chunk(records, 100);
  for (const [index, group] of recordGroups.entries()) {
    const pipeline = redis.pipeline();
    const ids = group.map((record) => record.id);

    if (ids.length > 0) {
      pipeline.rpush(cardCatalogAllIdsKey(result.meta.game), ...ids);
    }

    for (const record of group) {
      pipeline.set(cardCatalogSummaryKey(result.meta.game, record.id), record.summary);
    }

    await pipeline.exec();

    if (
      index === 0 ||
      (index + 1) % REDIS_BATCH_LOG_INTERVAL === 0 ||
      index === recordGroups.length - 1
    ) {
      log(
        `Wrote ${Math.min((index + 1) * 100, records.length).toLocaleString()} / ${records.length.toLocaleString()} card summaries to Redis (${index + 1}/${recordGroups.length} batches).`,
      );
    }
  }

  const tokenEntries = [...tokenMap.entries()];
  for (const [index, [token, ids]] of tokenEntries.entries()) {
    const tokenKey = cardCatalogTokenKey(result.meta.game, token);
    const pipeline = redis.pipeline();
    pipeline.sadd(cardCatalogTokenRegistryKey(result.meta.game), tokenKey);

    for (const group of chunk(ids, 500)) {
      pipeline.sadd(tokenKey, ...(group as [string, ...string[]]));
    }

    await pipeline.exec();

    if (
      index === 0 ||
      (index + 1) % REDIS_TOKEN_LOG_INTERVAL === 0 ||
      index === tokenEntries.length - 1
    ) {
      log(
        `Wrote ${index + 1} / ${tokenEntries.length.toLocaleString()} token buckets to Redis.`,
      );
    }
  }

  log("Warming grouped gallery caches...");
  const galleryWarmup = await warmCardGalleryCache({
    game: result.meta.game,
  });
  if (galleryWarmup.warmed) {
    for (const gallery of galleryWarmup.galleries) {
      log(
        `Warmed ${gallery.versionMode} gallery cache with ${gallery.cards.toLocaleString()} cards in ${formatDuration(gallery.elapsedMs)}.`,
      );
    }
  } else {
    log(`Skipped gallery cache warmup: ${galleryWarmup.reason}.`);
  }

  log(`Redis catalog write finished in ${formatDuration(Date.now() - startedAt)}.`);
}

async function syncGame(
  game: GameSlug,
  dryRun: boolean,
  context: SyncContext,
) {
  const startedAt = Date.now();
  console.log(`\n=== Syncing ${game} ===`);
  context.log("Stage 1/3: fetching and normalizing upstream data...");

  const result =
    game === "magic-the-gathering"
      ? await fetchMagicCards(context)
      : game === "one-piece"
        ? await fetchOnePieceCards(context)
        : await fetchRiftboundCards(context);

  if (!dryRun) {
    context.log("Stage 2/3: archiving raw source snapshots...");
    const archiveNotes = await archiveCardCatalogArtifacts(
      result.meta,
      result.archiveArtifacts,
      context.log,
    );
    result.meta.notes = [...(result.meta.notes ?? []), ...archiveNotes];
  } else {
    context.log("Stage 2/3: skipping archive upload because this is a dry run.");
  }

  context.log("Stage 3/3: writing searchable catalog to Redis...");
  await writeCatalog(result, dryRun, context.log);
  context.log(
    `Finished ${game}: ${result.records.length.toLocaleString()} cards in ${formatDuration(Date.now() - startedAt)}.`,
  );
}

async function main() {
  const startedAt = Date.now();
  const { dryRun, games, usedDefaultGames } = parseArgs(process.argv.slice(2));

  if (!dryRun && !isRedisConfigured()) {
    throw new Error(
      "Redis is not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN before syncing.",
    );
  }

  console.log(
    `Starting sync-card-catalogs in ${dryRun ? "dry-run" : "live"} mode.`,
  );
  if (usedDefaultGames) {
    console.log(
      `No --game flag was provided, so this run will sync all games in order: ${games.join(" -> ")}.`,
    );
  } else {
    console.log(`Syncing requested games: ${games.join(", ")}.`);
  }

  const lock = await acquireSyncLock(games, dryRun);
  console.log(`Acquired sync lock at ${lock.path}.`);
  let tempRoot: string | null = null;

  try {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "nexusarchive-cards-"));

    for (const game of games) {
      await syncGame(game, dryRun, {
        tempRoot,
        log: createGameLogger(game),
      });
    }
  } finally {
    if (tempRoot) {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
    await lock.release();
  }

  console.log(`All requested syncs finished in ${formatDuration(Date.now() - startedAt)}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
