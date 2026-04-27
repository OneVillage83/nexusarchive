import { createReadStream, createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGzip, gunzipSync } from "node:zlib";

import { google } from "googleapis";

import { getRedis } from "@/lib/storage/redis";

import {
  listFinanceExternalSourceRefs,
  upsertFinanceExternalSourceRef,
  warmFinanceExternalSourceRefs,
  type FinanceExternalSourceRef,
} from "./source-mappings";

type LogFn = (message: string) => void;

type GoogleDriveAuthMode = "oauth" | "service-account";
type GoogleDriveAuthClient =
  | InstanceType<typeof google.auth.OAuth2>
  | InstanceType<typeof google.auth.JWT>;

export type FinanceSourceMappingBackupManifest = {
  version: 1;
  generatedAt: string;
  sourceCount: number;
  refs: FinanceExternalSourceRef[];
};

export type FinanceSourceMappingBackupResult = {
  ran: boolean;
  generatedAt: string | null;
  sourceCount: number;
  localDir: string | null;
  archivePath: string | null;
  driveFileId: string | null;
  driveWebViewLink: string | null;
  skippedReason: string | null;
};

const LAST_BACKUP_CACHE_KEY = "finance:source-mapping:backup:last-run";

type BackupRestoreDeps = {
  listSourceRefs?: typeof listFinanceExternalSourceRefs;
  upsertSourceRef?: typeof upsertFinanceExternalSourceRef;
  warmSourceRefs?: typeof warmFinanceExternalSourceRefs;
};

function hasValue(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function compactText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const compacted = value.replace(/\s+/g, " ").trim();
  return compacted || null;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function formatTimestamp(value: string) {
  return value.replace(/[:]/g, "-");
}

function getBackupRoot() {
  return process.env.FINANCE_SOURCE_MAPPING_ARCHIVE_DIR?.trim()
    ? path.resolve(process.env.FINANCE_SOURCE_MAPPING_ARCHIVE_DIR)
    : path.join(process.cwd(), "data", "finance-source-mapping-archives");
}

function getBackupIntervalHours() {
  return parsePositiveInteger(
    process.env.FINANCE_SOURCE_MAPPING_BACKUP_INTERVAL_HOURS,
    24 * 7,
  );
}

function isGoogleDriveFolderConfigured() {
  return hasValue(process.env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID);
}

function isGoogleDriveOAuthConfigured() {
  return (
    isGoogleDriveFolderConfigured() &&
    hasValue(process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID) &&
    hasValue(process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET) &&
    hasValue(process.env.GOOGLE_DRIVE_REFRESH_TOKEN)
  );
}

function isGoogleDriveServiceAccountConfigured() {
  return (
    isGoogleDriveFolderConfigured() &&
    hasValue(process.env.GOOGLE_DRIVE_CLIENT_EMAIL) &&
    hasValue(process.env.GOOGLE_DRIVE_PRIVATE_KEY)
  );
}

function getGoogleDrivePrivateKey() {
  return process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "";
}

function getGoogleDriveRedirectUri() {
  return (
    process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI?.trim() ||
    "http://127.0.0.1:8787/oauth2callback"
  );
}

function getGoogleDriveAuthMode(): GoogleDriveAuthMode | null {
  if (isGoogleDriveOAuthConfigured()) {
    return "oauth";
  }

  if (isGoogleDriveServiceAccountConfigured()) {
    return "service-account";
  }

  return null;
}

function createGoogleDriveAuthClient(): {
  auth: GoogleDriveAuthClient;
  mode: GoogleDriveAuthMode;
} | null {
  const mode = getGoogleDriveAuthMode();
  if (mode === "oauth") {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET,
      getGoogleDriveRedirectUri(),
    );
    auth.setCredentials({
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    });

    return { auth, mode };
  }

  if (mode === "service-account") {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      key: getGoogleDrivePrivateKey(),
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    return { auth, mode };
  }

  return null;
}

async function uploadFileToGoogleDrive(
  localPath: string,
  name: string,
  mimeType: string,
  log?: LogFn,
) {
  const authConfig = createGoogleDriveAuthClient();
  if (!authConfig) {
    return {
      id: null,
      webViewLink: null,
    };
  }

  log?.(`Uploading ${name} to Google Drive via ${authConfig.mode} auth...`);
  const drive = google.drive({ version: "v3", auth: authConfig.auth });
  const response = await drive.files.create({
    fields: "id, webViewLink",
    media: {
      mimeType,
      body: createReadStream(localPath),
    },
    requestBody: {
      name,
      parents: [process.env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID!],
    },
  });

  return {
    id: response.data.id ?? null,
    webViewLink: response.data.webViewLink ?? null,
  };
}

async function writeGzipJson(
  filePath: string,
  payload: unknown,
) {
  const jsonPath = filePath.replace(/\.gz$/i, "");
  await fs.writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
  await pipeline(
    createReadStream(jsonPath),
    createGzip({ level: 9 }),
    createWriteStream(filePath),
  );
  await fs.rm(jsonPath, { force: true });
}

async function getLastLocalBackupTimestamp() {
  const root = getBackupRoot();
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  const latest = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .at(-1);

  if (!latest) {
    return null;
  }

  const stats = await fs.stat(path.join(root, latest)).catch(() => null);
  return stats ? new Date(stats.mtimeMs) : null;
}

export function buildFinanceSourceMappingBackupManifest(
  refs: FinanceExternalSourceRef[],
  generatedAt = new Date().toISOString(),
): FinanceSourceMappingBackupManifest {
  return {
    version: 1,
    generatedAt,
    sourceCount: refs.length,
    refs,
  };
}

export async function backupFinanceSourceMappings(
  log?: LogFn,
  deps?: BackupRestoreDeps,
) {
  const listSourceRefs = deps?.listSourceRefs ?? listFinanceExternalSourceRefs;
  const refs = await listSourceRefs();
  const generatedAt = new Date().toISOString();
  const manifest = buildFinanceSourceMappingBackupManifest(refs, generatedAt);
  const localDir = path.join(getBackupRoot(), formatTimestamp(generatedAt));
  const archivePath = path.join(localDir, "finance-external-source-refs.json.gz");
  const manifestPath = path.join(localDir, "manifest.json");

  await fs.mkdir(localDir, { recursive: true });
  log?.(`Writing ${refs.length} finance source mappings to ${localDir}...`);
  await writeGzipJson(archivePath, manifest);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  const driveResult = await uploadFileToGoogleDrive(
    archivePath,
    `finance-source-mappings-${formatTimestamp(generatedAt)}.json.gz`,
    "application/gzip",
    log,
  ).catch((error: unknown) => {
    log?.(
      `Google Drive upload failed for finance source mappings: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {
      id: null,
      webViewLink: null,
    };
  });

  const redis = getRedis();
  if (redis) {
    await redis.set(LAST_BACKUP_CACHE_KEY, generatedAt, {
      ex: getBackupIntervalHours() * 60 * 60 * 2,
    });
  }

  return {
    ran: true,
    generatedAt,
    sourceCount: refs.length,
    localDir,
    archivePath,
    driveFileId: driveResult.id,
    driveWebViewLink: driveResult.webViewLink,
    skippedReason: null,
  } satisfies FinanceSourceMappingBackupResult;
}

export async function maybeBackupFinanceSourceMappings(log?: LogFn) {
  const now = new Date();
  const redis = getRedis();
  const lastRunValue = redis
    ? await redis.get<string>(LAST_BACKUP_CACHE_KEY)
    : null;
  const lastRun =
    compactText(lastRunValue) != null
      ? new Date(lastRunValue!)
      : await getLastLocalBackupTimestamp();

  if (
    lastRun &&
    !Number.isNaN(lastRun.getTime()) &&
    now.getTime() - lastRun.getTime() < getBackupIntervalHours() * 60 * 60 * 1000
  ) {
    return {
      ran: false,
      generatedAt: null,
      sourceCount: 0,
      localDir: null,
      archivePath: null,
      driveFileId: null,
      driveWebViewLink: null,
      skippedReason: "Weekly source-mapping backup is still fresh.",
    } satisfies FinanceSourceMappingBackupResult;
  }

  return backupFinanceSourceMappings(log);
}

function parseBackupPayload(payload: Buffer, filePath: string) {
  const raw = filePath.endsWith(".gz")
    ? gunzipSync(payload).toString("utf8")
    : payload.toString("utf8");
  const parsed = JSON.parse(raw) as
    | FinanceSourceMappingBackupManifest
    | FinanceExternalSourceRef[];

  if (Array.isArray(parsed)) {
    return buildFinanceSourceMappingBackupManifest(parsed);
  }

  return parsed;
}

export async function restoreFinanceSourceMappingsFromFile(
  filePath: string,
  log?: LogFn,
  deps?: BackupRestoreDeps,
) {
  const buffer = await fs.readFile(filePath);
  const manifest = parseBackupPayload(buffer, filePath);
  const restored: FinanceExternalSourceRef[] = [];
  const upsertSourceRef = deps?.upsertSourceRef ?? upsertFinanceExternalSourceRef;
  const warmSourceRefs = deps?.warmSourceRefs ?? warmFinanceExternalSourceRefs;

  for (const ref of manifest.refs) {
    const upserted = await upsertSourceRef({
      game: ref.game,
      internalCardId: ref.internalCardId,
      cardCatalogId: ref.cardCatalogId,
      source: ref.source,
      versionKey: ref.versionKey,
      externalProductId: ref.externalProductId,
      externalUrl: ref.externalUrl,
      matchedTitle: ref.matchedTitle,
      searchQuery: ref.searchQuery,
      metadata: ref.metadata ?? undefined,
      lastDiscoveredAt: new Date(ref.lastDiscoveredAt),
      lastVerifiedAt: ref.lastVerifiedAt ? new Date(ref.lastVerifiedAt) : null,
      lastScrapedAt: ref.lastScrapedAt ? new Date(ref.lastScrapedAt) : null,
    });
    restored.push(upserted);
  }

  await warmSourceRefs(restored);
  log?.(`Restored ${restored.length} finance source mappings from ${filePath}.`);
  return restored;
}
