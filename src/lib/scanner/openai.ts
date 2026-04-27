import OpenAI from "openai";

import { getGameBySlug, type GameSlug } from "@/lib/games";

import {
  clampScannerScore,
  computeScannerQualityScore,
  normalizePercentScore,
} from "./quality";
import type {
  ScannerCornerPoint,
  ScannerDetectionBox,
  ScannerGradeVisionResult,
  ScannerQuickVisionDetection,
  ScannerQuickVisionResult,
} from "./types";

const SCANNER_MODEL = "gpt-4o-mini";

type AnalysisImage = {
  bytes: Buffer;
  mimeType: string;
};

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return apiKey ? new OpenAI({ apiKey }) : null;
}

export function isScannerAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function buildImageDataUrl(image: AnalysisImage) {
  return `data:${image.mimeType};base64,${image.bytes.toString("base64")}`;
}

function readJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === "object" && parsed ? parsed : null;
  } catch {
    return null;
  }
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => readString(entry)).filter((entry): entry is string => Boolean(entry))
    : [];
}

function normalizeConfidence(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return 0;
  }

  return clampScannerScore(value, 0, 1);
}

function parseBBox(value: unknown): ScannerDetectionBox | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const x = readNumber(raw.x);
  const y = readNumber(raw.y);
  const width = readNumber(raw.width);
  const height = readNumber(raw.height);

  if (x == null || y == null || width == null || height == null) {
    return null;
  }

  return {
    x: clampScannerScore(x, 0, 1000),
    y: clampScannerScore(y, 0, 1000),
    width: clampScannerScore(width, 1, 1000),
    height: clampScannerScore(height, 1, 1000),
  };
}

function parseCornerPoints(value: unknown): ScannerCornerPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const raw = entry as Record<string, unknown>;
      const x = readNumber(raw.x);
      const y = readNumber(raw.y);
      if (x == null || y == null) {
        return null;
      }

      return {
        x: clampScannerScore(x, 0, 1000),
        y: clampScannerScore(y, 0, 1000),
      };
    })
    .filter((entry): entry is ScannerCornerPoint => Boolean(entry));
}

async function createScannerJsonCompletion(
  content: OpenAI.Chat.Completions.ChatCompletionContentPart[],
) {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error("Scanner AI is unavailable because OPENAI_API_KEY is missing.");
  }

  const completion = await openai.chat.completions.create({
    model: SCANNER_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You analyze trading card photos for a collector app. Return strict JSON only, never markdown. Be conservative. If you are uncertain, lower confidence and say so inside the JSON notes instead of inventing details.",
      },
      {
        role: "user",
        content,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.toString().trim() ?? "";
  const parsed = raw ? readJsonObject(raw) : null;
  if (!parsed) {
    throw new Error("Scanner AI returned invalid JSON.");
  }

  return parsed as Record<string, unknown>;
}

export async function analyzeQuickScanImage(args: {
  game: GameSlug;
  image: AnalysisImage;
}): Promise<ScannerQuickVisionResult> {
  const gameLabel = getGameBySlug(args.game)?.name ?? args.game;
  const parsed = await createScannerJsonCompletion([
    {
      type: "text",
      text:
        `Analyze this ${gameLabel} trading card photo for a quick scan flow.\n` +
        "Detect up to 6 visible cards. Multiple cards are allowed.\n" +
        "Return JSON with this exact shape: {\"detections\":[{\"detectionIndex\":0,\"detectionConfidence\":0.0,\"bbox\":{\"x\":0,\"y\":0,\"width\":0,\"height\":0},\"cornerPoints\":[{\"x\":0,\"y\":0}],\"hint\":{\"name\":null,\"setGuess\":null,\"numberGuess\":null,\"rarityGuess\":null,\"finishGuess\":null,\"languageGuess\":null,\"confidence\":0.0}}],\"notes\":[\"...\"]}.\n" +
        "Bounding boxes and corner points must be normalized from 0 to 1000 relative to the image.\n" +
        "Do not guess outside this game's card pool. If you are not sure, leave fields null and lower confidence.",
    },
    {
      type: "image_url",
      image_url: {
        url: buildImageDataUrl(args.image),
        detail: "high",
      },
    },
  ]);

  const detections = Array.isArray(parsed.detections)
    ? parsed.detections
        .map((entry, index) => {
          if (!entry || typeof entry !== "object") {
            return null;
          }

          const raw = entry as Record<string, unknown>;
          const bbox = parseBBox(raw.bbox);
          if (!bbox) {
            return null;
          }

          const hintRaw =
            raw.hint && typeof raw.hint === "object"
              ? (raw.hint as Record<string, unknown>)
              : {};

          const detection: ScannerQuickVisionDetection = {
            detectionIndex: readNumber(raw.detectionIndex) ?? index,
            detectionConfidence: normalizeConfidence(readNumber(raw.detectionConfidence)),
            bbox,
            cornerPoints: parseCornerPoints(raw.cornerPoints),
            hint: {
              name: readString(hintRaw.name),
              setGuess: readString(hintRaw.setGuess),
              numberGuess: readString(hintRaw.numberGuess),
              rarityGuess: readString(hintRaw.rarityGuess),
              finishGuess: readString(hintRaw.finishGuess),
              languageGuess: readString(hintRaw.languageGuess),
              confidence: normalizeConfidence(readNumber(hintRaw.confidence)),
            },
          };

          return detection;
        })
        .filter((entry): entry is ScannerQuickVisionDetection => Boolean(entry))
    : [];

  return {
    detections,
    notes: readStringArray(parsed.notes),
  };
}

export async function analyzeGradeScanImages(args: {
  game: GameSlug;
  frontImage: AnalysisImage;
  backImage: AnalysisImage;
}): Promise<ScannerGradeVisionResult> {
  const gameLabel = getGameBySlug(args.game)?.name ?? args.game;
  const parsed = await createScannerJsonCompletion([
    {
      type: "text",
      text:
        `Analyze these ${gameLabel} trading card photos for a strict raw-card grade scan.\n` +
        "The first image is the front and the second image is the back.\n" +
        "Assume this is a raw unsleeved card unless the images clearly show a sleeve or slab.\n" +
        "Return JSON with this exact shape: {\"detection\":{\"detectionConfidence\":0.0,\"frontBbox\":{\"x\":0,\"y\":0,\"width\":0,\"height\":0},\"backBbox\":{\"x\":0,\"y\":0,\"width\":0,\"height\":0},\"frontCornerPoints\":[{\"x\":0,\"y\":0}],\"backCornerPoints\":[{\"x\":0,\"y\":0}]},\"quality\":{\"sharpnessScore\":0,\"glareScore\":0,\"framingScore\":0,\"perspectiveScore\":0,\"resolutionScore\":0,\"frontBackCompletenessScore\":0,\"sleeveDetected\":false,\"slabDetected\":false,\"failureReasons\":[\"...\"],\"recaptureMessage\":null},\"hint\":{\"name\":null,\"setGuess\":null,\"numberGuess\":null,\"rarityGuess\":null,\"finishGuess\":null,\"languageGuess\":null,\"confidence\":0.0},\"pregrade\":{\"centeringScore\":0.0,\"cornersScore\":0.0,\"edgesScore\":0.0,\"surfaceScore\":0.0,\"printQualityAdjustment\":0.0,\"nexusPregradeScore\":0.0,\"gradeBand\":\"\",\"confidence\":0.0,\"explanations\":[\"...\"]},\"notes\":[\"...\"]}.\n" +
        "Use 0-100 scores for the quality fields where higher is better.\n" +
        "Use 0-10 scores for centering, corners, edges, surface, and overall pregrade.\n" +
        "If the capture quality is too weak for a pregrade, still fill the quality and identification hint fields, but set pregrade to null.\n" +
        "Bounding boxes and corner points must be normalized from 0 to 1000 relative to each image.",
    },
    {
      type: "image_url",
      image_url: {
        url: buildImageDataUrl(args.frontImage),
        detail: "high",
      },
    },
    {
      type: "image_url",
      image_url: {
        url: buildImageDataUrl(args.backImage),
        detail: "high",
      },
    },
  ]);

  const qualityRaw =
    parsed.quality && typeof parsed.quality === "object"
      ? (parsed.quality as Record<string, unknown>)
      : {};
  const hintRaw =
    parsed.hint && typeof parsed.hint === "object"
      ? (parsed.hint as Record<string, unknown>)
      : {};
  const pregradeRaw =
    parsed.pregrade && typeof parsed.pregrade === "object"
      ? (parsed.pregrade as Record<string, unknown>)
      : null;
  const detectionRaw =
    parsed.detection && typeof parsed.detection === "object"
      ? (parsed.detection as Record<string, unknown>)
      : {};

  const quality = {
    sharpnessScore: normalizePercentScore(readNumber(qualityRaw.sharpnessScore)),
    glareScore: normalizePercentScore(readNumber(qualityRaw.glareScore)),
    framingScore: normalizePercentScore(readNumber(qualityRaw.framingScore)),
    perspectiveScore: normalizePercentScore(readNumber(qualityRaw.perspectiveScore)),
    resolutionScore: normalizePercentScore(readNumber(qualityRaw.resolutionScore)),
    frontBackCompletenessScore: normalizePercentScore(
      readNumber(qualityRaw.frontBackCompletenessScore),
    ),
    sleeveDetected: readBoolean(qualityRaw.sleeveDetected),
    slabDetected: readBoolean(qualityRaw.slabDetected),
    failureReasons: readStringArray(qualityRaw.failureReasons),
    recaptureMessage: readString(qualityRaw.recaptureMessage),
  };

  if (quality.sleeveDetected) {
    quality.failureReasons.push("A sleeve appears to be present.");
  }

  if (quality.slabDetected) {
    quality.failureReasons.push("A slab appears to be present.");
  }

  const qualityScore = computeScannerQualityScore(quality);
  const allowPregrade = qualityScore >= 70 && !quality.sleeveDetected && !quality.slabDetected;

  return {
    detection: {
      detectionConfidence: normalizeConfidence(readNumber(detectionRaw.detectionConfidence)),
      frontBbox: parseBBox(detectionRaw.frontBbox),
      backBbox: parseBBox(detectionRaw.backBbox),
      frontCornerPoints: parseCornerPoints(detectionRaw.frontCornerPoints),
      backCornerPoints: parseCornerPoints(detectionRaw.backCornerPoints),
    },
    quality,
    hint: {
      name: readString(hintRaw.name),
      setGuess: readString(hintRaw.setGuess),
      numberGuess: readString(hintRaw.numberGuess),
      rarityGuess: readString(hintRaw.rarityGuess),
      finishGuess: readString(hintRaw.finishGuess),
      languageGuess: readString(hintRaw.languageGuess),
      confidence: normalizeConfidence(readNumber(hintRaw.confidence)),
    },
    pregrade:
      allowPregrade && pregradeRaw
        ? {
            centeringScore: clampScannerScore(readNumber(pregradeRaw.centeringScore) ?? 0, 0, 10),
            cornersScore: clampScannerScore(readNumber(pregradeRaw.cornersScore) ?? 0, 0, 10),
            edgesScore: clampScannerScore(readNumber(pregradeRaw.edgesScore) ?? 0, 0, 10),
            surfaceScore: clampScannerScore(readNumber(pregradeRaw.surfaceScore) ?? 0, 0, 10),
            printQualityAdjustment: clampScannerScore(
              readNumber(pregradeRaw.printQualityAdjustment) ?? 0,
              -1,
              1,
            ),
            nexusPregradeScore: clampScannerScore(
              readNumber(pregradeRaw.nexusPregradeScore) ?? 0,
              0,
              10,
            ),
            gradeBand: readString(pregradeRaw.gradeBand) ?? "Uncertain",
            confidence: normalizeConfidence(readNumber(pregradeRaw.confidence)),
            explanations: readStringArray(pregradeRaw.explanations),
          }
        : null,
    notes: readStringArray(parsed.notes),
  };
}
