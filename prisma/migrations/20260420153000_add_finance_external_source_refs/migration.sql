-- CreateEnum
CREATE TYPE "FinanceExternalSource" AS ENUM ('GOOGLE_SHOPPING', 'EBAY', 'TCGPLAYER');

-- CreateTable
CREATE TABLE "FinanceExternalSourceRef" (
    "id" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "internalCardId" TEXT NOT NULL,
    "cardCatalogId" TEXT,
    "source" "FinanceExternalSource" NOT NULL,
    "versionKey" TEXT NOT NULL DEFAULT 'default',
    "externalProductId" TEXT NOT NULL,
    "externalUrl" TEXT,
    "matchedTitle" TEXT,
    "searchQuery" TEXT,
    "metadata" JSONB,
    "lastDiscoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceExternalSourceRef_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceExternalSourceRef_game_source_externalProductId_idx" ON "FinanceExternalSourceRef"("game", "source", "externalProductId");

-- CreateIndex
CREATE INDEX "FinanceExternalSourceRef_game_cardCatalogId_source_idx" ON "FinanceExternalSourceRef"("game", "cardCatalogId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceExternalSourceRef_game_internalCardId_source_versionKey_key" ON "FinanceExternalSourceRef"("game", "internalCardId", "source", "versionKey");

-- Seed
INSERT INTO "FinanceExternalSourceRef" (
    "id",
    "game",
    "internalCardId",
    "cardCatalogId",
    "source",
    "versionKey",
    "externalProductId",
    "matchedTitle",
    "metadata",
    "lastDiscoveredAt",
    "lastVerifiedAt",
    "lastScrapedAt",
    "createdAt",
    "updatedAt"
)
VALUES (
    'seed-google-shopping-one-piece-op-st05-002-online-only',
    'ONE_PIECE',
    'OP-ST05-002',
    'OP-ST05-002',
    'GOOGLE_SHOPPING',
    'online-only',
    '4172129135583325756',
    'Ain',
    '{"versionLabel":"Online-Only","seededBy":"migration","note":"Critical 2026 Google Shopping mapping seed."}',
    TIMESTAMP '2026-04-20 12:00:00 UTC',
    TIMESTAMP '2026-04-20 12:00:00 UTC',
    TIMESTAMP '2026-04-20 12:00:00 UTC',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("game", "internalCardId", "source", "versionKey") DO NOTHING;
