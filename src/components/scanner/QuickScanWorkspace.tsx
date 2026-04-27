"use client";

import { startTransition, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { isNativeAppShell } from "@/lib/mobile/capacitor";
import { buildGamePath, getGameBySlug, type GameSlug } from "@/lib/games";
import { captureScannerImage } from "@/lib/scanner/client-capture";
import type { ScannerCaptureSource, ScannerIntent } from "@/lib/scanner/types";

const PANEL =
  "rounded-3xl border border-white/25 bg-black/75 p-5 shadow-[0_0_45px_rgba(0,0,0,0.95)] sm:p-7";

function subscribeToNativeShell() {
  return () => {};
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string" &&
    payload.error.trim()
  ) {
    return payload.error;
  }

  return fallback;
}

function formatFileSize(file: File | null) {
  if (!file) {
    return null;
  }

  const megabytes = file.size / (1024 * 1024);
  return `${megabytes >= 10 ? megabytes.toFixed(0) : megabytes.toFixed(1)} MB`;
}

function getSubmissionLabel(stage: "idle" | "creating" | "uploading") {
  if (stage === "creating") {
    return "Preparing scan...";
  }

  if (stage === "uploading") {
    return "Uploading image and analyzing...";
  }

  return "Start Quick Scan";
}

function getFriendlySubmitError(caughtError: unknown, fallback: string) {
  const message = caughtError instanceof Error ? caughtError.message : fallback;

  if (/Failed to fetch/i.test(message)) {
    return "NexusArchive could not be reached. Check your connection and try again.";
  }

  return message;
}

export function QuickScanWorkspace({
  game,
  intent,
}: {
  game: GameSlug;
  intent: ScannerIntent;
}) {
  const router = useRouter();
  const config = getGameBySlug(game);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [captureSource, setCaptureSource] = useState<ScannerCaptureSource>("upload");
  const [captureBusySource, setCaptureBusySource] = useState<ScannerCaptureSource | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<"idle" | "creating" | "uploading">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const nativeShell = useSyncExternalStore(
    subscribeToNativeShell,
    isNativeAppShell,
    () => false,
  );
  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleSubmit() {
    if (!selectedFile || submitting) {
      return;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setError("You appear to be offline. Reconnect and try the scan again.");
      return;
    }

    setSubmitting(true);
    setSubmissionStage("creating");
    setError(null);

    try {
      const createResponse = await fetch("/api/scan/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game,
          mode: "quick",
          intent,
        }),
      });
      const createPayload = (await createResponse.json().catch(() => null)) as unknown;

      if (!createResponse.ok) {
        throw new Error(readErrorMessage(createPayload, "Failed to create scan."));
      }

      const scanId =
        createPayload &&
        typeof createPayload === "object" &&
        "scanId" in createPayload &&
        typeof createPayload.scanId === "string"
          ? createPayload.scanId
          : null;

      if (!scanId) {
        throw new Error("Scanner create response did not include a scan id.");
      }

      setSubmissionStage("uploading");

      const formData = new FormData();
      formData.set("source", captureSource);
      formData.append("image", selectedFile);

      const uploadResponse = await fetch(`/api/scan/${encodeURIComponent(scanId)}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadPayload = (await uploadResponse.json().catch(() => null)) as unknown;

      if (!uploadResponse.ok) {
        throw new Error(readErrorMessage(uploadPayload, "Failed to upload scan image."));
      }

      const redirectTo =
        uploadPayload &&
        typeof uploadPayload === "object" &&
        "redirectTo" in uploadPayload &&
        typeof uploadPayload.redirectTo === "string"
          ? uploadPayload.redirectTo
          : buildGamePath(game, `scan/results/${encodeURIComponent(scanId)}`);

      startTransition(() => {
        router.push(redirectTo);
      });
    } catch (caughtError) {
      setError(getFriendlySubmitError(caughtError, "Quick Scan failed."));
      setSubmitting(false);
      setSubmissionStage("idle");
    }
  }

  function handleFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
    source: ScannerCaptureSource,
  ) {
    const file = event.target.files?.[0] ?? null;
    setCaptureSource(source);
    setSelectedFile(file);
    setError(null);
  }

  async function handleCapture(source: ScannerCaptureSource) {
    if (!nativeShell) {
      if (source === "camera") {
        cameraInputRef.current?.click();
      } else {
        uploadInputRef.current?.click();
      }
      return;
    }

    setCaptureBusySource(source);
    setError(null);

    const result = await captureScannerImage({
      side: "multi",
      source,
    });

    setCaptureBusySource(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (!result.canceled) {
      setCaptureSource(result.source);
      setSelectedFile(result.file);
    }
  }

  function clearSelection() {
    setSelectedFile(null);
    setError(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }

  const actionDisabled = !selectedFile || submitting;

  return (
    <main className="safe-mobile-bottom py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <div
            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-950"
            style={{ backgroundColor: config?.accentColor ?? "#facc15" }}
          >
            {config?.shortName ?? "Quick Scan"}
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-amber-50 sm:text-4xl">
            Quick Scan
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-amber-50/82">
            Use a phone photo or upload to identify one card or a whole spread.
            The scanner keeps the raw image, extracts card crops, and returns
            finance-linked matches.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-amber-100/78">
            <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1">
              {nativeShell ? "Installed app capture ready" : "Browser upload mode"}
            </span>
            <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1">
              {selectedFile ? "Image selected" : "Waiting for image"}
            </span>
          </div>

          {intent === "collection" ? (
            <div className="mt-5 rounded-2xl border border-sky-200/35 bg-sky-950/55 px-4 py-3 text-xs text-sky-50/85">
              Collection intent is active. When the result lands, adding the
              detected cards into your collection becomes the main action.
            </div>
          ) : null}
        </section>

        <section className={`${PANEL} grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]`}>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">
              Capture Guidance
            </div>
            <div className="mt-4 rounded-[28px] border border-dashed border-sky-300/45 bg-slate-950/45 p-4">
              <div className="aspect-[4/5] rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_34%),linear-gradient(180deg,rgba(2,6,23,0.7),rgba(2,6,23,0.95))] p-5">
                <div className="flex h-full items-center justify-center rounded-[20px] border-2 border-amber-200/45">
                  <div className="text-center text-sm text-amber-50/80">
                    Frame the cards clearly.
                    <div className="mt-2 text-xs text-amber-100/65">
                      Binder pages, table shots, and single-card photos all work here.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleCapture("camera")}
                disabled={captureBusySource != null || submitting}
                className="min-h-12 rounded-2xl border border-sky-300/35 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-500/18 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {captureBusySource === "camera"
                  ? "Opening camera..."
                  : selectedFile && captureSource === "camera"
                    ? "Retake with camera"
                    : "Use camera"}
              </button>
              <button
                type="button"
                onClick={() => void handleCapture("upload")}
                disabled={captureBusySource != null || submitting}
                className="min-h-12 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-amber-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {captureBusySource === "upload"
                  ? "Opening library..."
                  : nativeShell
                    ? "Choose from library"
                    : "Upload photo"}
              </button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              className="hidden"
              onChange={(event) => handleFileSelection(event, "camera")}
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => handleFileSelection(event, "upload")}
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">
                Selected Image
              </div>
              {selectedFile ? (
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={submitting}
                  className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-amber-50 transition hover:bg-white/10 disabled:opacity-60"
                >
                  Remove image
                </button>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/15 bg-black/45">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Quick scan preview"
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center px-8 text-center text-sm text-amber-100/65">
                  Your selected image preview will appear here before the scan starts.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-xs text-amber-100/78">
              <div>
                Source: {captureSource === "camera" ? "Camera capture" : "Uploaded photo"}
              </div>
              {selectedFile ? (
                <div className="mt-2 text-amber-50/82">
                  {selectedFile.name}
                  {formatFileSize(selectedFile) ? ` · ${formatFileSize(selectedFile)}` : ""}
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-300/35 bg-red-950/50 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {submitting ? (
              <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-50/88">
                {getSubmissionLabel(submissionStage)}
              </div>
            ) : null}

            <button
              type="button"
              disabled={actionDisabled}
              onClick={handleSubmit}
              className="hidden w-full rounded-2xl border border-amber-300/35 bg-amber-400/15 px-4 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-55 lg:block"
            >
              {getSubmissionLabel(submissionStage)}
            </button>
          </div>
        </section>

        <div className="sticky safe-mobile-bottom-offset z-20 rounded-[28px] border border-white/15 bg-slate-950/92 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur lg:hidden">
          <button
            type="button"
            disabled={actionDisabled}
            onClick={handleSubmit}
            className="min-h-12 w-full rounded-2xl border border-amber-300/35 bg-amber-400/15 px-4 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {getSubmissionLabel(submissionStage)}
          </button>
        </div>
      </div>
    </main>
  );
}
