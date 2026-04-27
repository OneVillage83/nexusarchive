import {
  Prisma,
  ScanFeedbackType as PrismaScanFeedbackType,
  ScanImageSide as PrismaScanImageSide,
  ScanImageSource as PrismaScanImageSource,
  ScanIntent as PrismaScanIntent,
  ScanMode as PrismaScanMode,
  ScanStatus as PrismaScanStatus,
} from "@prisma/client";

import prisma from "@/lib/db";
import { getFinanceProductDetail, type FinanceProductDetail } from "@/lib/finance/query";
import { buildGamePath, type GameSlug } from "@/lib/games";

import { matchScannerCandidates } from "./catalog-match";
import { analyzeGradeScanImages, analyzeQuickScanImage, isScannerAiConfigured } from "./openai";
import { getScannerQualityDecision, computeScannerQualityScore } from "./quality";
import { buildScannerRecommendation } from "./recommendation";
import {
  createScannerDetectionCrop,
  createScannerOverlay,
  readScannerAsset,
  storeUploadedScanImage,
} from "./storage";
import type {
  ConfirmScanInput,
  CreateScanInput,
  RetryScanInput,
  ScannerCandidateView,
  ScannerCaptureSource,
  ScannerDetectionBox,
  ScannerDetectionHint,
  ScannerDetectionView,
  ScannerFeedbackType,
  ScannerImageSide,
  ScannerPregradeView,
  ScannerQualityReportView,
  ScannerResultsView,
  SubmitScanFeedbackInput,
  UploadScanInput,
} from "./types";

function scannerModeToPrisma(mode: CreateScanInput["mode"]) {
  return mode === "grade" ? PrismaScanMode.GRADE : PrismaScanMode.QUICK;
}

function scannerIntentToPrisma(intent: CreateScanInput["intent"]) {
  return intent === "collection" ? PrismaScanIntent.COLLECTION : PrismaScanIntent.GENERAL;
}

function scannerImageSideToPrisma(side: ScannerImageSide) {
  switch (side) {
    case "front":
      return PrismaScanImageSide.FRONT;
    case "back":
      return PrismaScanImageSide.BACK;
    case "multi":
      return PrismaScanImageSide.MULTI;
    case "unknown":
    default:
      return PrismaScanImageSide.UNKNOWN;
  }
}

function prismaImageSideToScanner(side: PrismaScanImageSide): ScannerImageSide {
  switch (side) {
    case PrismaScanImageSide.FRONT:
      return "front";
    case PrismaScanImageSide.BACK:
      return "back";
    case PrismaScanImageSide.MULTI:
      return "multi";
    case PrismaScanImageSide.UNKNOWN:
    default:
      return "unknown";
  }
}

function scannerCaptureSourceToPrisma(source: ScannerCaptureSource) {
  return source === "camera"
    ? PrismaScanImageSource.CAMERA
    : PrismaScanImageSource.UPLOAD;
}

function prismaCaptureSourceToScanner(
  source: PrismaScanImageSource,
): ScannerCaptureSource {
  return source === PrismaScanImageSource.CAMERA ? "camera" : "upload";
}

function prismaScanStatusToScanner(status: PrismaScanStatus): ScannerResultsView["status"] {
  switch (status) {
    case PrismaScanStatus.PROCESSING:
      return "processing";
    case PrismaScanStatus.DONE:
      return "done";
    case PrismaScanStatus.FAILED:
      return "failed";
    case PrismaScanStatus.NEEDS_REVIEW:
      return "needs_review";
    case PrismaScanStatus.UPLOADED:
    default:
      return "uploaded";
  }
}

function prismaScanModeToScanner(mode: PrismaScanMode): ScannerResultsView["mode"] {
  return mode === PrismaScanMode.GRADE ? "grade" : "quick";
}

function prismaScanIntentToScanner(
  intent: PrismaScanIntent,
): ScannerResultsView["intent"] {
  return intent === PrismaScanIntent.COLLECTION ? "collection" : "general";
}

function scannerFeedbackTypeToPrisma(type: ScannerFeedbackType) {
  switch (type) {
    case "wrong_card":
      return PrismaScanFeedbackType.WRONG_CARD;
    case "wrong_finish":
      return PrismaScanFeedbackType.WRONG_FINISH;
    case "wrong_grade":
      return PrismaScanFeedbackType.WRONG_GRADE;
    case "bad_crop":
      return PrismaScanFeedbackType.BAD_CROP;
    case "other":
    default:
      return PrismaScanFeedbackType.OTHER;
  }
}

function buildFallbackBBox(): ScannerDetectionBox {
  return {
    x: 0,
    y: 0,
    width: 1000,
    height: 1000,
  };
}

function buildSearchQueryFromHint(hint: ScannerDetectionHint) {
  return [hint.name, hint.numberGuess, hint.setGuess].filter(Boolean).join(" ").trim();
}

function ensureImageMimeType(mimeType: string) {
  return /^(image\/jpeg|image\/jpg|image\/png|image\/webp)$/i.test(mimeType.trim());
}

function buildStatusMessage(scan: {
  status: PrismaScanStatus;
  failureMessage: string | null;
}) {
  if (scan.failureMessage) {
    return scan.failureMessage;
  }

  switch (scan.status) {
    case PrismaScanStatus.PROCESSING:
      return "Scanner analysis is in progress.";
    case PrismaScanStatus.FAILED:
      return "Scanner processing failed before the result could be completed.";
    case PrismaScanStatus.NEEDS_REVIEW:
      return "Scanner processing finished, but the result needs a second look.";
    case PrismaScanStatus.DONE:
      return "Scanner result is ready.";
    case PrismaScanStatus.UPLOADED:
    default:
      return "Images uploaded and waiting for analysis.";
  }
}

async function getScanForAccess(scanId: string) {
  return prisma.scan.findUnique({
    where: {
      id: scanId,
    },
    include: {
      images: {
        orderBy: {
          createdAt: "asc",
        },
      },
      detections: {
        orderBy: {
          detectionIndex: "asc",
        },
        include: {
          identifications: {
            orderBy: {
              candidateRank: "asc",
            },
          },
        },
      },
      qualityReport: true,
      pregrade: true,
      feedback: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

function assertScanAccess(
  scan: Awaited<ReturnType<typeof getScanForAccess>> | null,
  clerkUserId: string | null,
) {
  if (!scan) {
    throw new Error("Scan not found.");
  }

  if (scan.clerkUserId && scan.clerkUserId !== clerkUserId) {
    throw new Error("Scan not found.");
  }

  return scan;
}

async function setScanFailure(args: {
  scanId: string;
  status: PrismaScanStatus;
  code: string;
  message: string;
  meta?: Prisma.InputJsonValue;
}) {
  await prisma.scan.update({
    where: {
      id: args.scanId,
    },
    data: {
      status: args.status,
      failureCode: args.code,
      failureMessage: args.message,
      failureMeta: args.meta ?? Prisma.DbNull,
    },
  });
}

async function createIdentificationCandidates(args: {
  scanId: string;
  detectionId: string;
  game: GameSlug;
  hint: ScannerDetectionHint;
}) {
  const candidates = await matchScannerCandidates(args.game, args.hint);
  const candidateRows = candidates.length
    ? candidates
    : [
        {
          financeProductId: null,
          matchedCardName: args.hint.name,
          matchScore: 0,
          confidence: Math.min(Math.max(args.hint.confidence * 0.65, 0.05), 0.95),
          searchQuery: buildSearchQueryFromHint(args.hint),
          guess: args.hint,
        },
      ];

  const created = [];
  for (const [index, candidate] of candidateRows.entries()) {
    created.push(
      await prisma.scanIdentification.create({
        data: {
          scanId: args.scanId,
          detectionId: args.detectionId,
          financeProductId: candidate.financeProductId,
          matchedCardName: candidate.matchedCardName,
          candidateRank: index + 1,
          confidence: candidate.confidence,
          gameGuess: args.game,
          setGuess: candidate.guess.setGuess,
          numberGuess: candidate.guess.numberGuess,
          rarityGuess: candidate.guess.rarityGuess,
          finishGuess: candidate.guess.finishGuess,
          languageGuess: candidate.guess.languageGuess,
          searchQuery: candidate.searchQuery,
        },
      }),
    );
  }

  return created;
}

async function processQuickScan(scanId: string) {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      images: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!scan) {
    throw new Error("Scan not found.");
  }

  let detectionCount = 0;
  let matchedDetectionCount = 0;

  for (const image of scan.images) {
    const normalizedStorageKey = image.normalizedStorageKey ?? image.rawStorageKey;
    const normalizedAsset = await readScannerAsset(normalizedStorageKey);
    const analysis = await analyzeQuickScanImage({
      game: scan.game === "ONE_PIECE"
        ? "one-piece"
        : scan.game === "MAGIC_THE_GATHERING"
          ? "magic-the-gathering"
          : "riftbound",
      image: {
        bytes: normalizedAsset.bytes,
        mimeType: normalizedAsset.mimeType,
      },
    });

    const overlayBoxes: ScannerDetectionBox[] = [];
    for (const detection of analysis.detections) {
      detectionCount += 1;
      overlayBoxes.push(detection.bbox);

      const createdDetection = await prisma.scanDetection.create({
        data: {
          scanId: scan.id,
          scanImageId: image.id,
          detectionIndex: detection.detectionIndex,
          bboxX: detection.bbox.x,
          bboxY: detection.bbox.y,
          bboxW: detection.bbox.width,
          bboxH: detection.bbox.height,
          cornerPoints: detection.cornerPoints,
          detectionConfidence: detection.detectionConfidence,
        },
      });

      const cropStorageKey = await createScannerDetectionCrop({
        scanId: scan.id,
        detectionId: createdDetection.id,
        normalizedStorageKey,
        bbox: detection.bbox,
      });

      const identificationRows = await createIdentificationCandidates({
        scanId: scan.id,
        detectionId: createdDetection.id,
        game:
          scan.game === "ONE_PIECE"
            ? "one-piece"
            : scan.game === "MAGIC_THE_GATHERING"
              ? "magic-the-gathering"
              : "riftbound",
        hint: detection.hint,
      });

      const selectedIdentification =
        identificationRows.find((candidate) => candidate.financeProductId) ??
        identificationRows[0] ??
        null;
      if (selectedIdentification?.financeProductId) {
        matchedDetectionCount += 1;
      }

      await prisma.scanDetection.update({
        where: { id: createdDetection.id },
        data: {
          cropStorageKey,
          selectedIdentificationId: selectedIdentification?.id ?? null,
        },
      });
    }

    const overlayStorageKey = image.normalizedStorageKey
      ? await createScannerOverlay({
          scanId: scan.id,
          imageId: image.id,
          normalizedStorageKey: image.normalizedStorageKey,
          boxes: overlayBoxes,
        })
      : null;

    if (overlayStorageKey) {
      await prisma.scanImage.update({
        where: { id: image.id },
        data: {
          overlayStorageKey,
        },
      });
    }
  }

  if (detectionCount === 0) {
    await setScanFailure({
      scanId: scan.id,
      status: PrismaScanStatus.NEEDS_REVIEW,
      code: "NO_DETECTIONS",
      message: "No cards were confidently detected in this photo. Try a cleaner shot or tighter crop.",
    });
    return;
  }

  await prisma.scan.update({
    where: {
      id: scan.id,
    },
    data: {
      status:
        matchedDetectionCount > 0
          ? PrismaScanStatus.DONE
          : PrismaScanStatus.NEEDS_REVIEW,
      failureCode: matchedDetectionCount > 0 ? null : "NO_CONFIDENT_MATCH",
      failureMessage:
        matchedDetectionCount > 0
          ? null
          : "Cards were detected, but the archive could not produce a confident canonical match yet.",
      failureMeta: Prisma.DbNull,
    },
  });
}

async function processGradeScan(scanId: string) {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      images: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!scan) {
    throw new Error("Scan not found.");
  }

  const frontImage = scan.images.find((image) => image.side === PrismaScanImageSide.FRONT);
  const backImage = scan.images.find((image) => image.side === PrismaScanImageSide.BACK);

  if (!frontImage || !backImage) {
    await setScanFailure({
      scanId: scan.id,
      status: PrismaScanStatus.FAILED,
      code: "MISSING_FRONT_OR_BACK",
      message: "Grade Scan requires both a front and back image.",
    });
    return;
  }

  const frontAsset = await readScannerAsset(
    frontImage.normalizedStorageKey ?? frontImage.rawStorageKey,
  );
  const backAsset = await readScannerAsset(
    backImage.normalizedStorageKey ?? backImage.rawStorageKey,
  );

  const analysis = await analyzeGradeScanImages({
    game:
      scan.game === "ONE_PIECE"
        ? "one-piece"
        : scan.game === "MAGIC_THE_GATHERING"
          ? "magic-the-gathering"
          : "riftbound",
    frontImage: {
      bytes: frontAsset.bytes,
      mimeType: frontAsset.mimeType,
    },
    backImage: {
      bytes: backAsset.bytes,
      mimeType: backAsset.mimeType,
    },
  });

  const qualityScore = computeScannerQualityScore(analysis.quality);
  const qualityDecision = getScannerQualityDecision(qualityScore);
  const bbox = analysis.detection.frontBbox ?? buildFallbackBBox();

  const detection = await prisma.scanDetection.create({
    data: {
      scanId: scan.id,
      scanImageId: frontImage.id,
      detectionIndex: 0,
      bboxX: bbox.x,
      bboxY: bbox.y,
      bboxW: bbox.width,
      bboxH: bbox.height,
      cornerPoints: analysis.detection.frontCornerPoints,
      detectionConfidence: analysis.detection.detectionConfidence,
    },
  });

  const cropStorageKey = await createScannerDetectionCrop({
    scanId: scan.id,
    detectionId: detection.id,
    normalizedStorageKey: frontImage.normalizedStorageKey ?? frontImage.rawStorageKey,
    bbox,
  });

  const overlayStorageKey = frontImage.normalizedStorageKey
    ? await createScannerOverlay({
        scanId: scan.id,
        imageId: frontImage.id,
        normalizedStorageKey: frontImage.normalizedStorageKey,
        boxes: [bbox],
      })
    : null;

  await prisma.scanDetection.update({
    where: { id: detection.id },
    data: {
      cropStorageKey,
    },
  });

  if (overlayStorageKey) {
    await prisma.scanImage.update({
      where: { id: frontImage.id },
      data: {
        overlayStorageKey,
      },
    });
  }

  const identificationRows = await createIdentificationCandidates({
    scanId: scan.id,
    detectionId: detection.id,
    game:
      scan.game === "ONE_PIECE"
        ? "one-piece"
        : scan.game === "MAGIC_THE_GATHERING"
          ? "magic-the-gathering"
          : "riftbound",
    hint: analysis.hint,
  });
  const selectedIdentification =
    identificationRows.find((candidate) => candidate.financeProductId) ??
    identificationRows[0] ??
    null;

  await prisma.scanDetection.update({
    where: { id: detection.id },
    data: {
      selectedIdentificationId: selectedIdentification?.id ?? null,
    },
  });

  await prisma.scanQualityReport.create({
    data: {
      scanId: scan.id,
      qualityScore,
      sharpnessScore: analysis.quality.sharpnessScore,
      glareScore: analysis.quality.glareScore,
      framingScore: analysis.quality.framingScore,
      perspectiveScore: analysis.quality.perspectiveScore,
      resolutionScore: analysis.quality.resolutionScore,
      frontBackCompletenessScore: analysis.quality.frontBackCompletenessScore,
      sleeveDetected: analysis.quality.sleeveDetected,
      slabDetected: analysis.quality.slabDetected,
      failureReasons: analysis.quality.failureReasons,
      recaptureMessage: analysis.quality.recaptureMessage,
    },
  });

  if (qualityDecision === "pregrade" && analysis.pregrade) {
    await prisma.scanPregrade.create({
      data: {
        scanId: scan.id,
        financeProductId: selectedIdentification?.financeProductId ?? null,
        centeringScore: analysis.pregrade.centeringScore,
        cornersScore: analysis.pregrade.cornersScore,
        edgesScore: analysis.pregrade.edgesScore,
        surfaceScore: analysis.pregrade.surfaceScore,
        printQualityAdjustment: analysis.pregrade.printQualityAdjustment,
        nexusPregradeScore: analysis.pregrade.nexusPregradeScore,
        gradeBand: analysis.pregrade.gradeBand,
        confidence: analysis.pregrade.confidence,
        explanation: analysis.pregrade.explanations,
      },
    });
  }

  const matched = Boolean(selectedIdentification?.financeProductId);
  await prisma.scan.update({
    where: { id: scan.id },
    data: {
      status: matched ? PrismaScanStatus.DONE : PrismaScanStatus.NEEDS_REVIEW,
      failureCode: matched ? null : "NO_CONFIDENT_MATCH",
      failureMessage:
        matched || qualityDecision !== "reject"
          ? null
          : analysis.quality.recaptureMessage ??
            "The grade scan did not clear the quality gate.",
      failureMeta: Prisma.DbNull,
    },
  });
}

async function processScanById(scanId: string) {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
  });

  if (!scan) {
    throw new Error("Scan not found.");
  }

  await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: PrismaScanStatus.PROCESSING,
      failureCode: null,
      failureMessage: null,
      failureMeta: Prisma.DbNull,
    },
  });

  if (!isScannerAiConfigured()) {
    await setScanFailure({
      scanId,
      status: PrismaScanStatus.FAILED,
      code: "MODEL_UNAVAILABLE",
      message:
        "Scanner AI is unavailable in this environment because OPENAI_API_KEY is missing.",
    });
    return;
  }

  if (scan.mode === PrismaScanMode.QUICK) {
    await processQuickScan(scanId);
    return;
  }

  await processGradeScan(scanId);
}

async function hydrateCandidateFinance(
  game: GameSlug,
  financeProductId: string | null,
  detailCache: Map<string, FinanceProductDetail | null>,
) {
  if (!financeProductId) {
    return null;
  }

  if (!detailCache.has(financeProductId)) {
    detailCache.set(financeProductId, await getFinanceProductDetail(game, financeProductId));
  }

  return detailCache.get(financeProductId) ?? null;
}

async function buildCandidateView(args: {
  game: GameSlug;
  identification: {
    id: string;
    financeProductId: string | null;
    matchedCardName: string | null;
    confidence: number;
    gameGuess: string | null;
    setGuess: string | null;
    numberGuess: string | null;
    rarityGuess: string | null;
    finishGuess: string | null;
    languageGuess: string | null;
  };
  selectedIdentificationId: string | null;
  detailCache: Map<string, FinanceProductDetail | null>;
}): Promise<ScannerCandidateView> {
  const detail = await hydrateCandidateFinance(
    args.game,
    args.identification.financeProductId,
    args.detailCache,
  );

  return {
    identificationId: args.identification.id,
    financeProductId: args.identification.financeProductId,
    selected: args.selectedIdentificationId === args.identification.id,
    confidence: args.identification.confidence,
    matchedCardName: args.identification.matchedCardName,
    guessedMetadata: {
      gameGuess: args.identification.gameGuess,
      setGuess: args.identification.setGuess,
      numberGuess: args.identification.numberGuess,
      rarityGuess: args.identification.rarityGuess,
      finishGuess: args.identification.finishGuess,
      languageGuess: args.identification.languageGuess,
    },
    finance: detail
      ? {
          name: detail.name,
          subtitle: detail.subtitle,
          imageUrl: detail.imageUrl,
          setName: detail.setName,
          setCode: detail.setCode,
          collectorNo: detail.collectorNo,
          rarity: detail.rarity,
          marketPrice: detail.marketPrice,
          fairValue: detail.fairValue,
          liquidityScore: detail.liquidityScore,
          confidenceScore: detail.confidenceScore,
          cashNowValue: detail.cashNowValue,
          fastSellValue: detail.fastSellValue,
          maxValueValue: detail.maxValueValue,
          storeCreditValue: detail.storeCreditValue,
          financeHref: buildGamePath(
            args.game,
            `finance/product/${encodeURIComponent(detail.financeProductId)}`,
          ),
        }
      : null,
  };
}

function buildQualityReportView(
  report: NonNullable<Awaited<ReturnType<typeof getScanForAccess>>>["qualityReport"],
): ScannerQualityReportView | null {
  if (!report) {
    return null;
  }

  return {
    qualityScore: report.qualityScore,
    sharpnessScore: report.sharpnessScore,
    glareScore: report.glareScore,
    framingScore: report.framingScore,
    perspectiveScore: report.perspectiveScore,
    resolutionScore: report.resolutionScore,
    frontBackCompletenessScore: report.frontBackCompletenessScore,
    sleeveDetected: report.sleeveDetected,
    slabDetected: report.slabDetected,
    failureReasons: Array.isArray(report.failureReasons)
      ? report.failureReasons.filter((entry): entry is string => typeof entry === "string")
      : [],
    recaptureMessage: report.recaptureMessage,
    decision: getScannerQualityDecision(report.qualityScore),
  };
}

function buildPregradeView(
  pregrade: NonNullable<Awaited<ReturnType<typeof getScanForAccess>>>["pregrade"],
): ScannerPregradeView | null {
  if (!pregrade) {
    return null;
  }

  return {
    financeProductId: pregrade.financeProductId,
    centeringScore: pregrade.centeringScore,
    cornersScore: pregrade.cornersScore,
    edgesScore: pregrade.edgesScore,
    surfaceScore: pregrade.surfaceScore,
    printQualityAdjustment: pregrade.printQualityAdjustment,
    nexusPregradeScore: pregrade.nexusPregradeScore,
    gradeBand: pregrade.gradeBand,
    confidence: pregrade.confidence,
    explanations: Array.isArray(pregrade.explanation)
      ? pregrade.explanation.filter((entry): entry is string => typeof entry === "string")
      : [],
  };
}

function getPrimaryFinanceProductId(
  detections: Array<{
    identifications: Array<{
      id: string;
      financeProductId: string | null;
    }>;
    selectedIdentificationId: string | null;
  }>,
  pregradeFinanceProductId: string | null,
) {
  if (pregradeFinanceProductId) {
    return pregradeFinanceProductId;
  }

  for (const detection of detections) {
    const selected =
      detection.identifications.find(
        (identification) => identification.id === detection.selectedIdentificationId,
      ) ?? detection.identifications[0];
    if (selected?.financeProductId) {
      return selected.financeProductId;
    }
  }

  return null;
}

export async function createScan(input: CreateScanInput) {
  return prisma.scan.create({
    data: {
      game:
        input.game === "one-piece"
          ? "ONE_PIECE"
          : input.game === "magic-the-gathering"
            ? "MAGIC_THE_GATHERING"
            : "RIFTBOUND",
      clerkUserId: input.clerkUserId,
      mode: scannerModeToPrisma(input.mode),
      intent: scannerIntentToPrisma(input.intent),
      status: PrismaScanStatus.UPLOADED,
    },
  });
}

export async function uploadAndProcessScan(input: UploadScanInput) {
  const scan = assertScanAccess(await getScanForAccess(input.scanId), input.clerkUserId);

  if (scan.images.length > 0) {
    throw new Error("This scan already has uploaded images.");
  }

  if (input.files.length === 0) {
    throw new Error("At least one image is required.");
  }

  if (scan.mode === PrismaScanMode.QUICK && input.files.length !== 1) {
    throw new Error("Quick Scan accepts exactly one image.");
  }

  if (scan.mode === PrismaScanMode.GRADE) {
    const sides = new Set(input.files.map((file) => file.side));
    if (!(sides.has("front") && sides.has("back"))) {
      throw new Error("Grade Scan requires both front and back images.");
    }
  }

  for (const file of input.files) {
    if (!ensureImageMimeType(file.mimeType)) {
      throw new Error("Only JPEG, PNG, and WebP images are supported.");
    }

    const stored = await storeUploadedScanImage({
      scanId: scan.id,
      side: file.side,
      fileName: file.fileName,
      mimeType: file.mimeType,
      bytes: file.bytes,
    });

    await prisma.scanImage.create({
      data: {
        scanId: scan.id,
        side: scannerImageSideToPrisma(file.side),
        rawStorageKey: stored.rawStorageKey,
        normalizedStorageKey: stored.normalizedStorageKey,
        width: stored.width,
        height: stored.height,
        mimeType: file.mimeType,
        source: scannerCaptureSourceToPrisma(input.source),
      },
    });
  }

  await processScanById(scan.id);
  return getScanResultsView(scan.id, input.clerkUserId);
}

export async function getScanSummary(scanId: string, clerkUserId: string | null) {
  const scan = assertScanAccess(await getScanForAccess(scanId), clerkUserId);
  return {
    id: scan.id,
    status: prismaScanStatusToScanner(scan.status),
    mode: prismaScanModeToScanner(scan.mode),
    intent: prismaScanIntentToScanner(scan.intent),
    createdAt: scan.createdAt.toISOString(),
    updatedAt: scan.updatedAt.toISOString(),
    statusMessage: buildStatusMessage(scan),
  };
}

export async function getScanResultsView(
  scanId: string,
  clerkUserId: string | null,
): Promise<ScannerResultsView> {
  const scan = assertScanAccess(await getScanForAccess(scanId), clerkUserId);
  const game =
    scan.game === "ONE_PIECE"
      ? "one-piece"
      : scan.game === "MAGIC_THE_GATHERING"
        ? "magic-the-gathering"
        : "riftbound";
  const detailCache = new Map<string, FinanceProductDetail | null>();

  const detections: ScannerDetectionView[] = [];
  for (const detection of scan.detections) {
    const candidates = await Promise.all(
      detection.identifications.map((identification) =>
        buildCandidateView({
          game,
          identification,
          selectedIdentificationId: detection.selectedIdentificationId,
          detailCache,
        }),
      ),
    );

    detections.push({
      id: detection.id,
      detectionIndex: detection.detectionIndex,
      detectionConfidence: detection.detectionConfidence,
      bbox: {
        x: detection.bboxX,
        y: detection.bboxY,
        width: detection.bboxW,
        height: detection.bboxH,
      },
      cropUrl: detection.cropStorageKey
        ? `/api/scan/${encodeURIComponent(scan.id)}/asset?detectionId=${encodeURIComponent(
            detection.id,
          )}&variant=crop`
        : null,
      selectedCandidate:
        candidates.find((candidate) => candidate.selected) ?? candidates[0] ?? null,
      candidates,
    });
  }

  const qualityReport = buildQualityReportView(scan.qualityReport);
  const pregrade = buildPregradeView(scan.pregrade);
  const primaryFinanceProductId = getPrimaryFinanceProductId(
    scan.detections,
    scan.pregrade?.financeProductId ?? null,
  );
  const primaryFinanceDetail = await hydrateCandidateFinance(
    game,
    primaryFinanceProductId,
    detailCache,
  );
  const recommendation = buildScannerRecommendation({
    qualityScore: qualityReport?.qualityScore,
    pregrade,
    financeDetail: primaryFinanceDetail,
  });

  return {
    id: scan.id,
    game,
    mode: prismaScanModeToScanner(scan.mode),
    intent: prismaScanIntentToScanner(scan.intent),
    status: prismaScanStatusToScanner(scan.status),
    statusMessage: buildStatusMessage(scan),
    createdAt: scan.createdAt.toISOString(),
    signedInOwner: Boolean(scan.clerkUserId && scan.clerkUserId === clerkUserId),
    images: scan.images.map((image) => ({
      id: image.id,
      side: prismaImageSideToScanner(image.side),
      source: prismaCaptureSourceToScanner(image.source),
      width: image.width,
      height: image.height,
      previewUrl: `/api/scan/${encodeURIComponent(scan.id)}/asset?imageId=${encodeURIComponent(
        image.id,
      )}&variant=normalized`,
      overlayUrl: image.overlayStorageKey
        ? `/api/scan/${encodeURIComponent(scan.id)}/asset?imageId=${encodeURIComponent(
            image.id,
          )}&variant=overlay`
        : null,
    })),
    detections,
    qualityReport,
    pregrade,
    recommendation,
    actions: {
      canRetry: true,
      canSubmitFeedback: true,
      canAddToCollection: Boolean(clerkUserId) && detections.some((detection) =>
        detection.candidates.some((candidate) => Boolean(candidate.financeProductId)),
      ),
      canAddToWatchlist: Boolean(clerkUserId) && detections.some((detection) =>
        detection.candidates.some((candidate) => Boolean(candidate.financeProductId)),
      ),
      primaryAction:
        Boolean(clerkUserId) &&
        prismaScanIntentToScanner(scan.intent) === "collection" &&
        detections.some((detection) => detection.selectedCandidate?.financeProductId)
          ? "add-to-collection"
          : primaryFinanceProductId
            ? "open-finance"
            : "review-results",
    },
  };
}

export async function confirmScanSelection(input: ConfirmScanInput) {
  const scan = assertScanAccess(await getScanForAccess(input.scanId), input.clerkUserId);
  const detection = scan.detections.find((entry) => entry.id === input.detectionId);
  if (!detection) {
    throw new Error("Detection not found.");
  }

  const identification = detection.identifications.find(
    (entry) => entry.id === input.identificationId,
  );
  if (!identification) {
    throw new Error("Candidate not found.");
  }

  await prisma.scanDetection.update({
    where: {
      id: detection.id,
    },
    data: {
      selectedIdentificationId: identification.id,
    },
  });

  if (scan.pregrade && identification.financeProductId) {
    await prisma.scanPregrade.update({
      where: {
        scanId: scan.id,
      },
      data: {
        financeProductId: identification.financeProductId,
      },
    });
  }

  return getScanResultsView(scan.id, input.clerkUserId);
}

export async function submitScanFeedback(input: SubmitScanFeedbackInput) {
  const scan = assertScanAccess(await getScanForAccess(input.scanId), input.clerkUserId);
  await prisma.scanFeedback.create({
    data: {
      scanId: scan.id,
      clerkUserId: input.clerkUserId,
      feedbackType: scannerFeedbackTypeToPrisma(input.feedbackType),
      correctFinanceProductId: input.correctFinanceProductId,
      note: input.note,
    },
  });

  return {
    ok: true,
  };
}

export async function retryScan(input: RetryScanInput) {
  const scan = assertScanAccess(await getScanForAccess(input.scanId), input.clerkUserId);
  if (scan.images.length === 0) {
    throw new Error("Cannot retry a scan before images are uploaded.");
  }

  await prisma.$transaction([
    prisma.scanPregrade.deleteMany({ where: { scanId: scan.id } }),
    prisma.scanQualityReport.deleteMany({ where: { scanId: scan.id } }),
    prisma.scanDetection.deleteMany({ where: { scanId: scan.id } }),
    prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: PrismaScanStatus.UPLOADED,
        failureCode: null,
        failureMessage: null,
        failureMeta: Prisma.DbNull,
      },
    }),
  ]);

  await processScanById(scan.id);
  return getScanResultsView(scan.id, input.clerkUserId);
}

export async function getScanAsset(args: {
  scanId: string;
  imageId?: string | null;
  detectionId?: string | null;
  variant: "raw" | "normalized" | "overlay" | "crop";
  clerkUserId: string | null;
}) {
  const scan = assertScanAccess(await getScanForAccess(args.scanId), args.clerkUserId);

  if (args.detectionId) {
    const detection = scan.detections.find((entry) => entry.id === args.detectionId);
    if (!detection?.cropStorageKey || args.variant !== "crop") {
      throw new Error("Detection asset not found.");
    }

    return readScannerAsset(detection.cropStorageKey);
  }

  if (args.imageId) {
    const image = scan.images.find((entry) => entry.id === args.imageId);
    if (!image) {
      throw new Error("Image asset not found.");
    }

    const storageKey =
      args.variant === "raw"
        ? image.rawStorageKey
        : args.variant === "overlay"
          ? image.overlayStorageKey
          : image.normalizedStorageKey ?? image.rawStorageKey;

    if (!storageKey) {
      throw new Error("Image asset not found.");
    }

    return readScannerAsset(storageKey);
  }

  throw new Error("Asset target is required.");
}
