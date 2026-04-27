import { createReadStream, createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

import { google } from "googleapis";

import type { CardCatalogMeta } from "../../src/lib/cards/catalog";

type LogFn = (message: string) => void;

export type ArchiveArtifact = {
  fileName: string;
  contentType: string;
  sourceUrl: string;
  tempFilePath: string;
};

type ArchiveArtifactResult = {
  fileName: string;
  sizeBytes: number;
  localPath: string;
  driveFileId: string | null;
  driveWebViewLink: string | null;
};

type GoogleDriveUploadResult = {
  id: string | null;
  webViewLink: string | null;
  mode: GoogleDriveAuthMode | null;
  errorMessage: string | null;
};

type GoogleDriveAuthMode = "oauth" | "service-account";
type GoogleDriveAuthClient =
  | InstanceType<typeof google.auth.OAuth2>
  | InstanceType<typeof google.auth.JWT>;

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

function hasValue(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-z0-9.-]+/gi, "-").replace(/^-+|-+$/g, "");
}

function formatTimestamp(value: string) {
  return sanitizeSegment(value.replace(/[:]/g, "-"));
}

function getArchiveRoot() {
  return process.env.CARD_ARCHIVE_DIR?.trim()
    ? path.resolve(process.env.CARD_ARCHIVE_DIR)
    : path.join(process.cwd(), "data", "card-catalog-archives");
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

    return {
      auth,
      mode,
    };
  }

  if (mode === "service-account") {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      key: getGoogleDrivePrivateKey(),
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    return {
      auth,
      mode,
    };
  }

  return null;
}

async function gzipFile(sourcePath: string, targetPath: string, log?: LogFn) {
  const startedAt = Date.now();
  const sourceStats = await fs.stat(sourcePath);
  log?.(
    `Compressing ${path.basename(sourcePath)} (${formatBytes(sourceStats.size)})...`,
  );

  await pipeline(
    createReadStream(sourcePath),
    createGzip({ level: 9 }),
    createWriteStream(targetPath),
  );

  const targetStats = await fs.stat(targetPath);
  log?.(
    `Created ${path.basename(targetPath)} (${formatBytes(targetStats.size)}) in ${formatDuration(Date.now() - startedAt)}.`,
  );
}

async function uploadFileToGoogleDrive(
  localPath: string,
  name: string,
  mimeType: string,
  log?: LogFn,
): Promise<GoogleDriveUploadResult> {
  const authConfig = createGoogleDriveAuthClient();
  if (!authConfig) {
    return {
      id: null,
      webViewLink: null,
      mode: null,
      errorMessage: null,
    };
  }

  try {
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
      mode: authConfig.mode,
      errorMessage: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log?.(`Google Drive upload failed for ${name}: ${message}`);
    console.error(`Google Drive upload failed for ${name}:`, error);
    return {
      id: null,
      webViewLink: null,
      mode: authConfig.mode,
      errorMessage: message,
    };
  }
}

async function archiveArtifact(
  destinationDir: string,
  archivePrefix: string,
  artifact: ArchiveArtifact,
  log?: LogFn,
) {
  const compressedFileName = `${sanitizeSegment(artifact.fileName)}.gz`;
  const localPath = path.join(destinationDir, compressedFileName);
  await gzipFile(artifact.tempFilePath, localPath, log);

  const stats = await fs.stat(localPath);
  const driveResult = await uploadFileToGoogleDrive(
    localPath,
    `${archivePrefix}-${compressedFileName}`,
    "application/gzip",
    log,
  );

  log?.(
    driveResult.id
      ? `Archived ${compressedFileName} locally and mirrored it to Google Drive.`
      : `Archived ${compressedFileName} locally${driveResult.errorMessage ? ", but the Drive mirror failed." : "."}`,
  );

  return {
    fileName: compressedFileName,
    sizeBytes: stats.size,
    localPath,
    driveFileId: driveResult.id,
    driveWebViewLink: driveResult.webViewLink,
  } satisfies ArchiveArtifactResult;
}

export async function archiveCardCatalogArtifacts(
  meta: CardCatalogMeta,
  artifacts: ArchiveArtifact[],
  log?: LogFn,
) {
  if (artifacts.length === 0) {
    return [];
  }

  const archivePrefix = [
    meta.game,
    sanitizeSegment(meta.source),
    formatTimestamp(meta.importedAt),
  ].join("-");

  const destinationDir = path.join(
    getArchiveRoot(),
    meta.game,
    formatTimestamp(meta.importedAt),
  );

  await fs.mkdir(destinationDir, { recursive: true });
  log?.(
    `Saving ${artifacts.length} raw archive file${artifacts.length === 1 ? "" : "s"} under ${destinationDir}...`,
  );

  const archivedArtifacts: ArchiveArtifactResult[] = [];
  let driveErrorMessage: string | null = null;
  for (const [index, artifact] of artifacts.entries()) {
    log?.(
      `Archiving raw source ${index + 1}/${artifacts.length}: ${artifact.fileName}.`,
    );
    const archivedArtifact = await archiveArtifact(
      destinationDir,
      archivePrefix,
      artifact,
      log,
    );
    archivedArtifacts.push(archivedArtifact);
  }

  const manifestPath = path.join(destinationDir, "manifest.json");
  const manifest = {
    meta,
    archivedArtifacts,
  };

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  log?.("Writing archive manifest and mirroring it to Google Drive...");

  const manifestDriveResult = await uploadFileToGoogleDrive(
    manifestPath,
    `${archivePrefix}-manifest.json`,
    "application/json",
    log,
  );

  const notes = [`Raw source archive saved under ${destinationDir}.`];

  if (manifestDriveResult.id) {
    if (manifestDriveResult.mode === "oauth") {
      notes.push(
        `Raw source archive mirrored to your personal Google Drive folder ${process.env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID} using OAuth.`,
      );
    } else {
      notes.push(
        `Raw source archive mirrored to Google Drive folder ${process.env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID} using a service account.`,
      );
    }
  } else if (manifestDriveResult.errorMessage) {
    driveErrorMessage = manifestDriveResult.errorMessage;
    notes.push(
      `Google Drive upload failed, so the raw snapshot stayed local only. Reason: ${manifestDriveResult.errorMessage}`,
    );
  } else {
    notes.push(
      "Google Drive archive sync is not configured, so the raw snapshot is staying local for now.",
    );
  }

  if (driveErrorMessage && !notes.some((note) => note.includes("stayed local only"))) {
    notes.push(
      `Google Drive upload failed, so the raw snapshot stayed local only. Reason: ${driveErrorMessage}`,
    );
  }

  return notes;
}
