"use client";

import { startTransition, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { isNativeAppShell } from "@/lib/mobile/capacitor";
import { buildGamePath, getGameBySlug, type GameSlug } from "@/lib/games";
import { captureScannerImage } from "@/lib/scanner/client-capture";
import type { ScannerCaptureSource } from "@/lib/scanner/types";

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

function useObjectPreview(file: File | null) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return previewUrl;
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
    return "Preparing grade scan...";
  }

  if (stage === "uploading") {
    return "Uploading images and analyzing...";
  }

  return "Start Grade Scan";
}

function getFriendlySubmitError(caughtError: unknown, fallback: string) {
  const message = caughtError instanceof Error ? caughtError.message : fallback;

  if (/Failed to fetch/i.test(message)) {
    return "NexusArchive could not be reached. Check your connection and try again.";
  }

  return message;
}

type CaptureSide = "front" | "back";
type CaptureBusyState = `${CaptureSide}:${ScannerCaptureSource}` | null;

export function GradeScanWorkspace({ game }: { game: GameSlug }) {
  const router = useRouter();
  const config = getGameBySlug(game);
  const frontCameraRef = useRef<HTMLInputElement | null>(null);
  const frontUploadRef = useRef<HTMLInputElement | null>(null);
  const backCameraRef = useRef<HTMLInputElement | null>(null);
  const backUploadRef = useRef<HTMLInputElement | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontSource, setFrontSource] = useState<ScannerCaptureSource>("camera");
  const [backSource, setBackSource] = useState<ScannerCaptureSource>("camera");
  const [captureBusy, setCaptureBusy] = useState<CaptureBusyState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<"idle" | "creating" | "uploading">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const frontPreview = useObjectPreview(frontFile);
  const backPreview = useObjectPreview(backFile);
  const nativeShell = useSyncExternalStore(
    subscribeToNativeShell,
    isNativeAppShell,
    () => false,
  );

  function setSelectedFile(
    side: CaptureSide,
    file: File | null,
    nextSource: ScannerCaptureSource,
  ) {
    setError(null);
    if (side === "front") {
      setFrontFile(file);
      setFrontSource(nextSource);
      return;
    }

    setBackFile(file);
    setBackSource(nextSource);
  }

  function clearSelection(side: CaptureSide) {
    setError(null);
    if (side === "front") {
      setFrontFile(null);
      if (frontCameraRef.current) {
        frontCameraRef.current.value = "";
      }
      if (frontUploadRef.current) {
        frontUploadRef.current.value = "";
      }
      return;
    }

    setBackFile(null);
    if (backCameraRef.current) {
      backCameraRef.current.value = "";
    }
    if (backUploadRef.current) {
      backUploadRef.current.value = "";
    }
  }

  async function handleCapture(side: CaptureSide, source: ScannerCaptureSource) {
    if (!nativeShell) {
      if (side === "front") {
        if (source === "camera") {
          frontCameraRef.current?.click();
        } else {
          frontUploadRef.current?.click();
        }
      } else if (source === "camera") {
        backCameraRef.current?.click();
      } else {
        backUploadRef.current?.click();
      }
      return;
    }

    setCaptureBusy(`${side}:${source}`);
    setError(null);

    const result = await captureScannerImage({
      side,
      source,
    });

    setCaptureBusy(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (!result.canceled) {
      setSelectedFile(side, result.file, result.source);
    }
  }

  async function handleSubmit() {
    if (!frontFile || !backFile || submitting) {
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
          mode: "grade",
          intent: "general",
        }),
      });
      const createPayload = (await createResponse.json().catch(() => null)) as unknown;

      if (!createResponse.ok) {
        throw new Error(readErrorMessage(createPayload, "Failed to create grade scan."));
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
      const aggregateSource =
        frontSource === "camera" || backSource === "camera" ? "camera" : "upload";
      formData.set("source", aggregateSource);
      formData.append("front", frontFile);
      formData.append("back", backFile);

      const uploadResponse = await fetch(`/api/scan/${encodeURIComponent(scanId)}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadPayload = (await uploadResponse.json().catch(() => null)) as unknown;

      if (!uploadResponse.ok) {
        throw new Error(readErrorMessage(uploadPayload, "Failed to upload grade scan."));
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
      setError(getFriendlySubmitError(caughtError, "Grade Scan failed."));
      setSubmitting(false);
      setSubmissionStage("idle");
    }
  }

  const actionDisabled = !frontFile || !backFile || submitting;

  return (
    <main className="safe-mobile-bottom py-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8">
        <section className={PANEL}>
          <div
            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-950"
            style={{ backgroundColor: config?.accentColor ?? "#facc15" }}
          >
            {config?.shortName ?? "Grade Scan"}
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-amber-50 sm:text-4xl">
            Grade Scan
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-amber-50/82">
            Capture one raw card front and back for stricter quality checks and a
            Nexus AI Pre-Grade estimate. This is an internal signal, not an
            official grading-company grade.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-amber-100/78">
            <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1">
              {nativeShell ? "Installed app capture ready" : "Browser upload mode"}
            </span>
            <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1">
              Front {frontFile ? "captured" : "needed"}
            </span>
            <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1">
              Back {backFile ? "captured" : "needed"}
            </span>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.92fr)]">
          <CaptureCard
            title="Front image"
            previewUrl={frontPreview}
            file={frontFile}
            source={frontSource}
            busyKey={captureBusy}
            side="front"
            submitting={submitting}
            nativeShell={nativeShell}
            onCamera={() => void handleCapture("front", "camera")}
            onUpload={() => void handleCapture("front", "upload")}
            onRemove={() => clearSelection("front")}
          />
          <CaptureCard
            title="Back image"
            previewUrl={backPreview}
            file={backFile}
            source={backSource}
            busyKey={captureBusy}
            side="back"
            submitting={submitting}
            nativeShell={nativeShell}
            onCamera={() => void handleCapture("back", "camera")}
            onUpload={() => void handleCapture("back", "upload")}
            onRemove={() => clearSelection("back")}
          />

          <section className={PANEL}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">
              Capture Checklist
            </div>
            <ul className="mt-4 space-y-2 text-sm text-amber-50/80">
              <li>One raw card only</li>
              <li>No sleeve and no slab</li>
              <li>All four corners visible</li>
              <li>Neutral background</li>
              <li>Diffuse lighting with minimal glare</li>
              <li>Front and back both required</li>
            </ul>

            <div className="mt-5 rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-xs text-amber-100/78">
              <div>Front source: {frontSource === "camera" ? "Camera" : "Upload"}</div>
              <div className="mt-2">Back source: {backSource === "camera" ? "Camera" : "Upload"}</div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-300/35 bg-red-950/50 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {submitting ? (
              <div className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-50/88">
                {getSubmissionLabel(submissionStage)}
              </div>
            ) : null}

            <button
              type="button"
              disabled={actionDisabled}
              onClick={handleSubmit}
              className="mt-5 hidden w-full rounded-2xl border border-amber-300/35 bg-amber-400/15 px-4 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-55 lg:block"
            >
              {getSubmissionLabel(submissionStage)}
            </button>
          </section>
        </section>

        <input
          ref={frontCameraRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          capture="environment"
          className="hidden"
          onChange={(event) => setSelectedFile("front", event.target.files?.[0] ?? null, "camera")}
        />
        <input
          ref={frontUploadRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => setSelectedFile("front", event.target.files?.[0] ?? null, "upload")}
        />
        <input
          ref={backCameraRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          capture="environment"
          className="hidden"
          onChange={(event) => setSelectedFile("back", event.target.files?.[0] ?? null, "camera")}
        />
        <input
          ref={backUploadRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => setSelectedFile("back", event.target.files?.[0] ?? null, "upload")}
        />

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

function CaptureCard({
  title,
  previewUrl,
  file,
  source,
  busyKey,
  side,
  submitting,
  nativeShell,
  onCamera,
  onUpload,
  onRemove,
}: {
  title: string;
  previewUrl: string | null;
  file: File | null;
  source: ScannerCaptureSource;
  busyKey: CaptureBusyState;
  side: CaptureSide;
  submitting: boolean;
  nativeShell: boolean;
  onCamera: () => void;
  onUpload: () => void;
  onRemove: () => void;
}) {
  const cameraBusy = busyKey === `${side}:camera`;
  const uploadBusy = busyKey === `${side}:upload`;

  return (
    <section className={PANEL}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">
          {title}
        </div>
        <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] text-amber-100/75">
          {file ? "Ready" : "Needed"}
        </span>
      </div>
      <div className="mt-4 overflow-hidden rounded-[28px] border border-white/15 bg-black/45">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={title}
            className="aspect-[4/5] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center px-8 text-center text-sm text-amber-100/65">
            Capture or upload the {title.toLowerCase()} here.
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-xs text-amber-100/78">
        <div>Source: {source === "camera" ? "Camera" : "Upload"}</div>
        {file ? (
          <div className="mt-2 text-amber-50/82">
            {file.name}
            {formatFileSize(file) ? ` · ${formatFileSize(file)}` : ""}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCamera}
          disabled={busyKey != null || submitting}
          className="min-h-12 rounded-2xl border border-sky-300/35 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-500/18 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cameraBusy
            ? "Opening camera..."
            : file && source === "camera"
              ? "Retake with camera"
              : "Use camera"}
        </button>
        <button
          type="button"
          onClick={onUpload}
          disabled={busyKey != null || submitting}
          className="min-h-12 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-amber-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploadBusy
            ? "Opening library..."
            : nativeShell
              ? "Choose from library"
              : "Upload photo"}
        </button>
      </div>

      {file ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={submitting}
          className="mt-3 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-amber-50 transition hover:bg-white/10 disabled:opacity-60"
        >
          Remove image
        </button>
      ) : null}
    </section>
  );
}
