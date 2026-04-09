-- CreateEnum
CREATE TYPE "FinanceProductKind" AS ENUM ('CARD', 'SEALED');

-- CreateEnum
CREATE TYPE "FinanceMarketplaceType" AS ENUM ('MARKETPLACE', 'BUYLIST', 'GRADING', 'REFERENCE');

-- CreateEnum
CREATE TYPE "FinanceRouteType" AS ENUM ('CASH_NOW', 'FAST_SELL', 'MAX_VALUE', 'STORE_CREDIT', 'GRADE_FIRST');

-- CreateTable
CREATE TABLE "FinanceProduct" (
    "id" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "kind" "FinanceProductKind" NOT NULL DEFAULT 'CARD',
    "financeKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "cardCatalogId" TEXT,
    "setName" TEXT,
    "setCode" TEXT,
    "collectorNo" TEXT,
    "rarity" TEXT,
    "imageUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceProductAlias" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,

    CONSTRAINT "FinanceProductAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceMarketplace" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinanceMarketplaceType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceMarketplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceListingSnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "condition" TEXT,
    "quantity" INTEGER,
    "listingUrl" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceListingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceSalesComp" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "condition" TEXT,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "FinanceSalesComp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceBuylistOffer" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "cashValue" DOUBLE PRECISION NOT NULL,
    "creditValue" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "FinanceBuylistOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceProductMetricDaily" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "marketPrice" DOUBLE PRECISION,
    "fairValue" DOUBLE PRECISION,
    "delta24h" DOUBLE PRECISION,
    "deltaPercent24h" DOUBLE PRECISION,
    "liquidityScore" INTEGER,
    "confidenceScore" INTEGER,

    CONSTRAINT "FinanceProductMetricDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceRouteEstimate" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "routeType" "FinanceRouteType" NOT NULL,
    "routeName" TEXT NOT NULL,
    "netValue" DOUBLE PRECISION NOT NULL,
    "estimatedDays" INTEGER,
    "feeRate" DOUBLE PRECISION,
    "shippingCost" DOUBLE PRECISION,
    "confidenceScore" INTEGER,
    "asOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceRouteEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceRecommendationSnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "persona" TEXT,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceRecommendationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceDataQualitySnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "freshnessHours" INTEGER NOT NULL,
    "sourceCount" INTEGER NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceDataQualitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceSealedProduct" (
    "id" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "financeKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setName" TEXT,
    "setCode" TEXT,
    "imageUrl" TEXT,
    "msrp" DOUBLE PRECISION,
    "currentPrice" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceSealedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceSealedEvSnapshot" (
    "id" TEXT NOT NULL,
    "sealedProductId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "singlesEv" DOUBLE PRECISION,
    "fairValue" DOUBLE PRECISION,
    "liquidityScore" INTEGER,
    "confidenceScore" INTEGER,
    "notes" JSONB,

    CONSTRAINT "FinanceSealedEvSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceAlert" (
    "id" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "productId" TEXT,
    "sealedProductId" TEXT,
    "alertType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "FinanceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceWatchlist" (
    "id" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceWatchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceWatchlistItem" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceWatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancePortfolioPosition" (
    "id" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "averageCost" DOUBLE PRECISION,
    "acquiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancePortfolioPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceAlertPreference" (
    "id" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "moversEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reversalsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "watchlistEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceAlertPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceCollectionSync" (
    "id" TEXT NOT NULL,
    "game" "Game" NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "source" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceCollectionSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceProduct_financeKey_key" ON "FinanceProduct"("financeKey");

-- CreateIndex
CREATE INDEX "FinanceProduct_game_canonicalName_idx" ON "FinanceProduct"("game", "canonicalName");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceProduct_game_slug_key" ON "FinanceProduct"("game", "slug");

-- CreateIndex
CREATE INDEX "FinanceProductAlias_normalized_idx" ON "FinanceProductAlias"("normalized");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceMarketplace_slug_key" ON "FinanceMarketplace"("slug");

-- CreateIndex
CREATE INDEX "FinanceListingSnapshot_productId_capturedAt_idx" ON "FinanceListingSnapshot"("productId", "capturedAt");

-- CreateIndex
CREATE INDEX "FinanceSalesComp_productId_soldAt_idx" ON "FinanceSalesComp"("productId", "soldAt");

-- CreateIndex
CREATE INDEX "FinanceBuylistOffer_productId_capturedAt_idx" ON "FinanceBuylistOffer"("productId", "capturedAt");

-- CreateIndex
CREATE INDEX "FinanceProductMetricDaily_day_idx" ON "FinanceProductMetricDaily"("day");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceProductMetricDaily_productId_day_key" ON "FinanceProductMetricDaily"("productId", "day");

-- CreateIndex
CREATE INDEX "FinanceRouteEstimate_productId_routeType_idx" ON "FinanceRouteEstimate"("productId", "routeType");

-- CreateIndex
CREATE INDEX "FinanceRecommendationSnapshot_productId_createdAt_idx" ON "FinanceRecommendationSnapshot"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "FinanceDataQualitySnapshot_productId_createdAt_idx" ON "FinanceDataQualitySnapshot"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceSealedProduct_financeKey_key" ON "FinanceSealedProduct"("financeKey");

-- CreateIndex
CREATE INDEX "FinanceSealedProduct_game_name_idx" ON "FinanceSealedProduct"("game", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceSealedProduct_game_slug_key" ON "FinanceSealedProduct"("game", "slug");

-- CreateIndex
CREATE INDEX "FinanceSealedEvSnapshot_sealedProductId_capturedAt_idx" ON "FinanceSealedEvSnapshot"("sealedProductId", "capturedAt");

-- CreateIndex
CREATE INDEX "FinanceAlert_game_createdAt_idx" ON "FinanceAlert"("game", "createdAt");

-- CreateIndex
CREATE INDEX "FinanceWatchlist_game_clerkUserId_idx" ON "FinanceWatchlist"("game", "clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceWatchlistItem_watchlistId_productId_key" ON "FinanceWatchlistItem"("watchlistId", "productId");

-- CreateIndex
CREATE INDEX "FinancePortfolioPosition_game_clerkUserId_idx" ON "FinancePortfolioPosition"("game", "clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancePortfolioPosition_game_clerkUserId_productId_key" ON "FinancePortfolioPosition"("game", "clerkUserId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceAlertPreference_game_clerkUserId_key" ON "FinanceAlertPreference"("game", "clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceCollectionSync_game_clerkUserId_key" ON "FinanceCollectionSync"("game", "clerkUserId");

-- AddForeignKey
ALTER TABLE "FinanceProductAlias" ADD CONSTRAINT "FinanceProductAlias_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinanceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceListingSnapshot" ADD CONSTRAINT "FinanceListingSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinanceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceListingSnapshot" ADD CONSTRAINT "FinanceListingSnapshot_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "FinanceMarketplace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceSalesComp" ADD CONSTRAINT "FinanceSalesComp_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinanceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceSalesComp" ADD CONSTRAINT "FinanceSalesComp_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "FinanceMarketplace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceBuylistOffer" ADD CONSTRAINT "FinanceBuylistOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinanceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceBuylistOffer" ADD CONSTRAINT "FinanceBuylistOffer_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "FinanceMarketplace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceProductMetricDaily" ADD CONSTRAINT "FinanceProductMetricDaily_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinanceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRouteEstimate" ADD CONSTRAINT "FinanceRouteEstimate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinanceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRecommendationSnapshot" ADD CONSTRAINT "FinanceRecommendationSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinanceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceDataQualitySnapshot" ADD CONSTRAINT "FinanceDataQualitySnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinanceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceSealedEvSnapshot" ADD CONSTRAINT "FinanceSealedEvSnapshot_sealedProductId_fkey" FOREIGN KEY ("sealedProductId") REFERENCES "FinanceSealedProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceAlert" ADD CONSTRAINT "FinanceAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinanceProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceAlert" ADD CONSTRAINT "FinanceAlert_sealedProductId_fkey" FOREIGN KEY ("sealedProductId") REFERENCES "FinanceSealedProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceWatchlistItem" ADD CONSTRAINT "FinanceWatchlistItem_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "FinanceWatchlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceWatchlistItem" ADD CONSTRAINT "FinanceWatchlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinanceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancePortfolioPosition" ADD CONSTRAINT "FinancePortfolioPosition_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinanceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

