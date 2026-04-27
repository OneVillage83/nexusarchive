"use client";

import { CameraDirection, CameraResultType, CameraSource } from "@capacitor/camera";

import { isNativeAppShell } from "@/lib/mobile/capacitor";

import type { ScannerCaptureSource } from "./types";

type ScannerCaptureSide = "front" | "back" | "multi";

export type ScannerCaptureResult = {
  file: File | null;
  source: ScannerCaptureSource;
  canceled: boolean;
  error: string | null;
};

function normalizeMimeType(format: string | undefined, fallback: string) {
  const normalized = format?.trim().toLowerCase();

  if (normalized === "jpeg" || normalized === "jpg") {
    return "image/jpeg";
  }

  if (normalized === "png") {
    return "image/png";
  }

  if (normalized === "webp") {
    return "image/webp";
  }

  return fallback;
}

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function buildFriendlyCaptureError(
  source: ScannerCaptureSource,
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown camera error.";

  if (/cancel/i.test(message)) {
    return null;
  }

  if (/permission/i.test(message)) {
    return source === "camera"
      ? "Camera permission is blocked for NexusArchive. Enable it in your phone settings and try again."
      : "Photo library permission is blocked for NexusArchive. Enable it in your phone settings and try again.";
  }

  return source === "camera"
    ? "The camera could not capture a photo right now. Try again or choose a photo from your library."
    : "The selected photo could not be loaded. Try again or capture a new photo instead.";
}

export async function captureScannerImage(args: {
  side: ScannerCaptureSide;
  source: ScannerCaptureSource;
}): Promise<ScannerCaptureResult> {
  if (!isNativeAppShell()) {
    return {
      file: null,
      source: args.source,
      canceled: false,
      error: "Native scanner capture is only available inside the installed app shell.",
    };
  }

  try {
    const { Camera } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      source: args.source === "camera" ? CameraSource.Camera : CameraSource.Photos,
      resultType: CameraResultType.Uri,
      quality: 92,
      correctOrientation: true,
      direction: CameraDirection.Rear,
      promptLabelHeader: args.source === "camera" ? "Capture scan image" : "Choose scan image",
      promptLabelPhoto: "Photo library",
      promptLabelPicture: "Take photo",
      promptLabelCancel: "Cancel",
    });

    if (!photo.webPath) {
      return {
        file: null,
        source: args.source,
        canceled: false,
        error: "The selected image did not include a loadable path.",
      };
    }

    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const mimeType = normalizeMimeType(photo.format, blob.type || "image/jpeg");
    const file = new File(
      [blob],
      `scan-${args.side}-${Date.now()}.${extensionForMimeType(mimeType)}`,
      {
        type: mimeType,
        lastModified: Date.now(),
      },
    );

    return {
      file,
      source: args.source,
      canceled: false,
      error: null,
    };
  } catch (error) {
    const friendlyError = buildFriendlyCaptureError(args.source, error);
    return {
      file: null,
      source: args.source,
      canceled: friendlyError == null,
      error: friendlyError,
    };
  }
}
