import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { get as getBlob, put as putBlob } from "@vercel/blob";
import sharp from "sharp";

import type { ScannerDetectionBox, ScannerImageSide } from "./types";

function sanitizeSegment(value: string) {
  return value.replace(/[^a-z0-9.-]+/gi, "-").replace(/^-+|-+$/g, "");
}

function ensureSafeStorageKey(storageKey: string) {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) {
    throw new Error("Invalid scanner storage key.");
  }

  return normalized;
}

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || null;
}

function isVercelRuntime() {
  return Boolean(process.env.VERCEL);
}

export function getScannerStorageBackend() {
  return getBlobToken() ? "blob" : "filesystem";
}

function ensureWritableStorageBackend() {
  if (!getBlobToken() && isVercelRuntime()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required for scanner storage on Vercel.");
  }
}

function toBlobPath(storageKey: string) {
  return `scanner/${ensureSafeStorageKey(storageKey)}`;
}

function getExtensionForMimeType(
  mimeType: string,
  fileName: string,
) {
  const normalized = mimeType.trim().toLowerCase();
  if (normalized === "image/jpeg" || normalized === "image/jpg") {
    return "jpg";
  }

  if (normalized === "image/png") {
    return "png";
  }

  if (normalized === "image/webp") {
    return "webp";
  }

  const extension = path.extname(fileName).replace(/^\./, "").toLowerCase();
  return extension || "bin";
}

export function getScannerArchiveRoot() {
  const configured = process.env.CARD_ARCHIVE_DIR?.trim();
  return configured
    ? path.resolve(configured, "scanner")
    : path.join(process.cwd(), "data", "scanner");
}

export function resolveScannerStoragePath(storageKey: string) {
  const safeKey = ensureSafeStorageKey(storageKey);
  const root = getScannerArchiveRoot();
  const resolved = path.resolve(root, safeKey);

  if (!resolved.startsWith(path.resolve(root))) {
    throw new Error("Scanner storage path escaped root.");
  }

  return resolved;
}

async function writeScannerBuffer(
  storageKey: string,
  bytes: Buffer,
  contentType: string,
) {
  const token = getBlobToken();
  if (token) {
    await putBlob(toBlobPath(storageKey), bytes, {
      access: "private",
      contentType,
      token,
    });
    return;
  }

  ensureWritableStorageBackend();
  const targetPath = resolveScannerStoragePath(storageKey);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, bytes);
}

export function getScannerAssetMimeType(storageKey: string) {
  const extension = path.extname(storageKey).toLowerCase();
  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export async function readScannerAsset(storageKey: string) {
  const token = getBlobToken();
  if (token) {
    const blob = await getBlob(toBlobPath(storageKey), {
      access: "private",
      token,
    });

    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      throw new Error("Scanner asset not found.");
    }

    const bytes = Buffer.from(await new Response(blob.stream).arrayBuffer());
    return {
      bytes,
      mimeType: blob.blob.contentType || getScannerAssetMimeType(storageKey),
    };
  }

  ensureWritableStorageBackend();
  const targetPath = resolveScannerStoragePath(storageKey);
  const bytes = await fs.readFile(targetPath);
  return {
    bytes,
    mimeType: getScannerAssetMimeType(storageKey),
  };
}

export async function storeUploadedScanImage(input: {
  scanId: string;
  side: ScannerImageSide;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}) {
  const fileExtension = getExtensionForMimeType(input.mimeType, input.fileName);
  const side = sanitizeSegment(input.side);
  const rawStorageKey = `raw/${sanitizeSegment(input.scanId)}/${side}-${randomUUID()}.${fileExtension}`;
  await writeScannerBuffer(rawStorageKey, input.bytes, input.mimeType);

  const normalizedImage = await sharp(input.bytes)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 88 })
    .toBuffer({ resolveWithObject: true });

  const normalizedStorageKey = `derived/${sanitizeSegment(input.scanId)}/normalized/${side}-${randomUUID()}.jpg`;
  await writeScannerBuffer(normalizedStorageKey, normalizedImage.data, "image/jpeg");

  return {
    rawStorageKey,
    normalizedStorageKey,
    width: normalizedImage.info.width ?? null,
    height: normalizedImage.info.height ?? null,
  };
}

function normalizedBoxToPixels(
  bbox: ScannerDetectionBox,
  width: number,
  height: number,
) {
  const x = Math.round((bbox.x / 1000) * width);
  const y = Math.round((bbox.y / 1000) * height);
  const bboxWidth = Math.round((bbox.width / 1000) * width);
  const bboxHeight = Math.round((bbox.height / 1000) * height);

  const safeLeft = Math.min(Math.max(x, 0), Math.max(width - 1, 0));
  const safeTop = Math.min(Math.max(y, 0), Math.max(height - 1, 0));
  const safeWidth = Math.max(
    1,
    Math.min(bboxWidth || width, Math.max(width - safeLeft, 1)),
  );
  const safeHeight = Math.max(
    1,
    Math.min(bboxHeight || height, Math.max(height - safeTop, 1)),
  );

  return {
    left: safeLeft,
    top: safeTop,
    width: safeWidth,
    height: safeHeight,
  };
}

export async function createScannerDetectionCrop(input: {
  scanId: string;
  detectionId: string;
  normalizedStorageKey: string;
  bbox: ScannerDetectionBox;
}) {
  const normalizedAsset = await readScannerAsset(input.normalizedStorageKey);
  const metadata = await sharp(normalizedAsset.bytes).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (width <= 0 || height <= 0) {
    throw new Error("Unable to read normalized scanner image dimensions.");
  }

  const extractRegion = normalizedBoxToPixels(input.bbox, width, height);
  const cropBuffer = await sharp(normalizedAsset.bytes)
    .extract(extractRegion)
    .png()
    .toBuffer();

  const cropStorageKey = `derived/${sanitizeSegment(input.scanId)}/crops/${sanitizeSegment(
    input.detectionId,
  )}.png`;
  await writeScannerBuffer(cropStorageKey, cropBuffer, "image/png");
  return cropStorageKey;
}

function createOverlaySvg(
  width: number,
  height: number,
  boxes: ScannerDetectionBox[],
) {
  const rectangles = boxes
    .map((bbox) => {
      const box = normalizedBoxToPixels(bbox, width, height);
      return `<rect x="${box.left}" y="${box.top}" width="${box.width}" height="${box.height}" rx="12" ry="12" fill="none" stroke="#38bdf8" stroke-width="8" />
<rect x="${box.left + 10}" y="${box.top + 10}" width="${Math.max(box.width - 20, 1)}" height="${Math.max(box.height - 20, 1)}" rx="10" ry="10" fill="none" stroke="#facc15" stroke-width="3" />`;
    })
    .join("");

  return Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="rgba(0,0,0,0.04)" />
      ${rectangles}
    </svg>`,
  );
}

export async function createScannerOverlay(input: {
  scanId: string;
  imageId: string;
  normalizedStorageKey: string;
  boxes: ScannerDetectionBox[];
}) {
  const normalizedAsset = await readScannerAsset(input.normalizedStorageKey);
  const metadata = await sharp(normalizedAsset.bytes).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (width <= 0 || height <= 0 || input.boxes.length === 0) {
    return null;
  }

  const overlayBuffer = await sharp(normalizedAsset.bytes)
    .composite([
      {
        input: createOverlaySvg(width, height, input.boxes),
      },
    ])
    .png()
    .toBuffer();

  const overlayStorageKey = `derived/${sanitizeSegment(input.scanId)}/debug/${sanitizeSegment(
    input.imageId,
  )}-overlay.png`;
  await writeScannerBuffer(overlayStorageKey, overlayBuffer, "image/png");
  return overlayStorageKey;
}
