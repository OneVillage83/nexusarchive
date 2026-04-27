-- CreateEnum
CREATE TYPE "ScanMode" AS ENUM ('QUICK', 'GRADE');

-- CreateEnum
CREATE TYPE "ScanIntent" AS ENUM ('GENERAL', 'COLLECTION');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'DONE', 'FAILED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ScanImageSide" AS ENUM ('FRONT', 'BACK', 'MULTI', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ScanImageSource" AS ENUM ('CAMERA', 'UPLOAD');

-- CreateEnum
CREATE TYPE "ScanFeedbackType" AS ENUM ('WRONG_CARD', 'WRONG_FINISH', 'WRONG_GRADE', 'BAD_CROP', 'OTHER');

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "clerkUserId" TEXT,
    "mode" "ScanMode" NOT NULL,
    "intent" "ScanIntent" NOT NULL DEFAULT 'GENERAL',
    "status" "ScanStatus" NOT NULL DEFAULT 'UPLOADED',
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "failureMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanImage" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "side" "ScanImageSide" NOT NULL DEFAULT 'UNKNOWN',
    "rawStorageKey" TEXT NOT NULL,
    "normalizedStorageKey" TEXT,
    "overlayStorageKey" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" TEXT NOT NULL,
    "source" "ScanImageSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanDetection" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "scanImageId" TEXT NOT NULL,
    "detectionIndex" INTEGER NOT NULL,
    "bboxX" DOUBLE PRECISION NOT NULL,
    "bboxY" DOUBLE PRECISION NOT NULL,
    "bboxW" DOUBLE PRECISION NOT NULL,
    "bboxH" DOUBLE PRECISION NOT NULL,
    "cornerPoints" JSONB,
    "cropStorageKey" TEXT,
    "detectionConfidence" DOUBLE PRECISION,
    "selectedIdentificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanQualityReport" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "qualityScore" INTEGER,
    "sharpnessScore" INTEGER,
    "glareScore" INTEGER,
    "framingScore" INTEGER,
    "perspectiveScore" INTEGER,
    "resolutionScore" INTEGER,
    "frontBackCompletenessScore" INTEGER,
    "sleeveDetected" BOOLEAN NOT NULL DEFAULT false,
    "slabDetected" BOOLEAN NOT NULL DEFAULT false,
    "failureReasons" JSONB,
    "recaptureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanQualityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanIdentification" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "detectionId" TEXT NOT NULL,
    "financeProductId" TEXT,
    "matchedCardName" TEXT,
    "candidateRank" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "gameGuess" TEXT,
    "setGuess" TEXT,
    "numberGuess" TEXT,
    "rarityGuess" TEXT,
    "finishGuess" TEXT,
    "languageGuess" TEXT,
    "searchQuery" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanIdentification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanPregrade" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "financeProductId" TEXT,
    "centeringScore" DOUBLE PRECISION,
    "cornersScore" DOUBLE PRECISION,
    "edgesScore" DOUBLE PRECISION,
    "surfaceScore" DOUBLE PRECISION,
    "printQualityAdjustment" DOUBLE PRECISION,
    "nexusPregradeScore" DOUBLE PRECISION,
    "gradeBand" TEXT,
    "confidence" DOUBLE PRECISION,
    "explanation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanPregrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanFeedback" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "feedbackType" "ScanFeedbackType" NOT NULL,
    "correctFinanceProductId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scan_game_createdAt_idx" ON "Scan"("game", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_game_clerkUserId_createdAt_idx" ON "Scan"("game", "clerkUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ScanImage_scanId_side_idx" ON "ScanImage"("scanId", "side");

-- CreateIndex
CREATE UNIQUE INDEX "ScanDetection_scanImageId_detectionIndex_key" ON "ScanDetection"("scanImageId", "detectionIndex");

-- CreateIndex
CREATE INDEX "ScanDetection_scanId_detectionIndex_idx" ON "ScanDetection"("scanId", "detectionIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ScanQualityReport_scanId_key" ON "ScanQualityReport"("scanId");

-- CreateIndex
CREATE INDEX "ScanIdentification_scanId_candidateRank_idx" ON "ScanIdentification"("scanId", "candidateRank");

-- CreateIndex
CREATE INDEX "ScanIdentification_detectionId_candidateRank_idx" ON "ScanIdentification"("detectionId", "candidateRank");

-- CreateIndex
CREATE UNIQUE INDEX "ScanPregrade_scanId_key" ON "ScanPregrade"("scanId");

-- CreateIndex
CREATE INDEX "ScanFeedback_scanId_createdAt_idx" ON "ScanFeedback"("scanId", "createdAt");

-- AddForeignKey
ALTER TABLE "ScanImage" ADD CONSTRAINT "ScanImage_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanDetection" ADD CONSTRAINT "ScanDetection_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanDetection" ADD CONSTRAINT "ScanDetection_scanImageId_fkey" FOREIGN KEY ("scanImageId") REFERENCES "ScanImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanQualityReport" ADD CONSTRAINT "ScanQualityReport_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanIdentification" ADD CONSTRAINT "ScanIdentification_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanIdentification" ADD CONSTRAINT "ScanIdentification_detectionId_fkey" FOREIGN KEY ("detectionId") REFERENCES "ScanDetection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanDetection" ADD CONSTRAINT "ScanDetection_selectedIdentificationId_fkey" FOREIGN KEY ("selectedIdentificationId") REFERENCES "ScanIdentification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanPregrade" ADD CONSTRAINT "ScanPregrade_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanFeedback" ADD CONSTRAINT "ScanFeedback_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
