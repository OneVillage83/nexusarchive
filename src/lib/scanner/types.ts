import type { GameSlug } from "@/lib/games";

export const SCAN_MODES = ["quick", "grade"] as const;
export const SCAN_INTENTS = ["general", "collection"] as const;
export const SCAN_STATUSES = [
  "uploaded",
  "processing",
  "done",
  "failed",
  "needs_review",
] as const;
export const SCAN_IMAGE_SIDES = [
  "front",
  "back",
  "multi",
  "unknown",
] as const;
export const SCAN_CAPTURE_SOURCES = ["camera", "upload"] as const;
export const SCAN_FEEDBACK_TYPES = [
  "wrong_card",
  "wrong_finish",
  "wrong_grade",
  "bad_crop",
  "other",
] as const;
export const SCAN_QUALITY_DECISIONS = [
  "reject",
  "id-only",
  "pregrade",
] as const;

export type ScannerMode = (typeof SCAN_MODES)[number];
export type ScannerIntent = (typeof SCAN_INTENTS)[number];
export type ScannerStatus = (typeof SCAN_STATUSES)[number];
export type ScannerImageSide = (typeof SCAN_IMAGE_SIDES)[number];
export type ScannerCaptureSource = (typeof SCAN_CAPTURE_SOURCES)[number];
export type ScannerFeedbackType = (typeof SCAN_FEEDBACK_TYPES)[number];
export type ScannerQualityDecision = (typeof SCAN_QUALITY_DECISIONS)[number];

export type ScannerDetectionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ScannerCornerPoint = {
  x: number;
  y: number;
};

export type ScannerDetectionHint = {
  name: string | null;
  setGuess: string | null;
  numberGuess: string | null;
  rarityGuess: string | null;
  finishGuess: string | null;
  languageGuess: string | null;
  confidence: number;
};

export type ScannerQuickVisionDetection = {
  detectionIndex: number;
  detectionConfidence: number;
  bbox: ScannerDetectionBox;
  cornerPoints: ScannerCornerPoint[];
  hint: ScannerDetectionHint;
};

export type ScannerQuickVisionResult = {
  detections: ScannerQuickVisionDetection[];
  notes: string[];
};

export type ScannerGradeVisionResult = {
  detection: {
    detectionConfidence: number;
    frontBbox: ScannerDetectionBox | null;
    backBbox: ScannerDetectionBox | null;
    frontCornerPoints: ScannerCornerPoint[];
    backCornerPoints: ScannerCornerPoint[];
  };
  quality: {
    sharpnessScore: number;
    glareScore: number;
    framingScore: number;
    perspectiveScore: number;
    resolutionScore: number;
    frontBackCompletenessScore: number;
    sleeveDetected: boolean;
    slabDetected: boolean;
    failureReasons: string[];
    recaptureMessage: string | null;
  };
  hint: ScannerDetectionHint;
  pregrade: {
    centeringScore: number;
    cornersScore: number;
    edgesScore: number;
    surfaceScore: number;
    printQualityAdjustment: number;
    nexusPregradeScore: number;
    gradeBand: string;
    confidence: number;
    explanations: string[];
  } | null;
  notes: string[];
};

export type ScannerCatalogCandidate = {
  financeProductId: string | null;
  matchedCardName: string | null;
  matchScore: number;
  confidence: number;
  searchQuery: string;
  guess: ScannerDetectionHint;
};

export type ScannerImageView = {
  id: string;
  side: ScannerImageSide;
  source: ScannerCaptureSource;
  width: number | null;
  height: number | null;
  previewUrl: string;
  overlayUrl: string | null;
};

export type ScannerCandidateView = {
  identificationId: string;
  financeProductId: string | null;
  selected: boolean;
  confidence: number;
  matchedCardName: string | null;
  guessedMetadata: {
    gameGuess: string | null;
    setGuess: string | null;
    numberGuess: string | null;
    rarityGuess: string | null;
    finishGuess: string | null;
    languageGuess: string | null;
  };
  finance: {
    name: string;
    subtitle: string;
    imageUrl: string | null;
    setName: string | null;
    setCode: string | null;
    collectorNo: string | null;
    rarity: string | null;
    marketPrice: number | null;
    fairValue: number | null;
    liquidityScore: number | null;
    confidenceScore: number | null;
    cashNowValue: number | null;
    fastSellValue: number | null;
    maxValueValue: number | null;
    storeCreditValue: number | null;
    financeHref: string | null;
  } | null;
};

export type ScannerDetectionView = {
  id: string;
  detectionIndex: number;
  detectionConfidence: number | null;
  bbox: ScannerDetectionBox;
  cropUrl: string | null;
  selectedCandidate: ScannerCandidateView | null;
  candidates: ScannerCandidateView[];
};

export type ScannerQualityReportView = {
  qualityScore: number | null;
  sharpnessScore: number | null;
  glareScore: number | null;
  framingScore: number | null;
  perspectiveScore: number | null;
  resolutionScore: number | null;
  frontBackCompletenessScore: number | null;
  sleeveDetected: boolean;
  slabDetected: boolean;
  failureReasons: string[];
  recaptureMessage: string | null;
  decision: ScannerQualityDecision | null;
};

export type ScannerPregradeView = {
  financeProductId: string | null;
  centeringScore: number | null;
  cornersScore: number | null;
  edgesScore: number | null;
  surfaceScore: number | null;
  printQualityAdjustment: number | null;
  nexusPregradeScore: number | null;
  gradeBand: string | null;
  confidence: number | null;
  explanations: string[];
};

export type ScannerRecommendationKey =
  | "recapture-needed"
  | "grade-candidate"
  | "sell-raw-or-compare"
  | "not-worth-grading";

export type ScannerRecommendationView = {
  key: ScannerRecommendationKey;
  title: string;
  body: string;
  gradeFirstNetValue: number | null;
  rawBestNetValue: number | null;
  rawBestLabel: string | null;
};

export type ScannerResultsView = {
  id: string;
  game: GameSlug;
  mode: ScannerMode;
  intent: ScannerIntent;
  status: ScannerStatus;
  statusMessage: string;
  createdAt: string;
  signedInOwner: boolean;
  images: ScannerImageView[];
  detections: ScannerDetectionView[];
  qualityReport: ScannerQualityReportView | null;
  pregrade: ScannerPregradeView | null;
  recommendation: ScannerRecommendationView | null;
  actions: {
    canRetry: boolean;
    canSubmitFeedback: boolean;
    canAddToCollection: boolean;
    canAddToWatchlist: boolean;
    primaryAction: "add-to-collection" | "review-results" | "open-finance" | null;
  };
};

export type CreateScanInput = {
  game: GameSlug;
  mode: ScannerMode;
  intent: ScannerIntent;
  clerkUserId: string | null;
};

export type UploadScanInput = {
  scanId: string;
  source: ScannerCaptureSource;
  files: Array<{
    side: ScannerImageSide;
    fileName: string;
    mimeType: string;
    bytes: Buffer;
  }>;
  clerkUserId: string | null;
};

export type ConfirmScanInput = {
  scanId: string;
  detectionId: string;
  identificationId: string;
  clerkUserId: string | null;
};

export type SubmitScanFeedbackInput = {
  scanId: string;
  feedbackType: ScannerFeedbackType;
  note: string | null;
  correctFinanceProductId: string | null;
  clerkUserId: string | null;
};

export type RetryScanInput = {
  scanId: string;
  clerkUserId: string | null;
};
