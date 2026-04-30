-- CreateTable
CREATE TABLE "CatalogCardProfile" (
    "id" SERIAL NOT NULL,
    "game" "Game" NOT NULL,
    "catalogCardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "familyKey" TEXT,
    "tags" JSONB NOT NULL,
    "roles" JSONB NOT NULL,
    "triggers" JSONB NOT NULL,
    "produces" JSONB NOT NULL,
    "consumes" JSONB NOT NULL,
    "payoffs" JSONB NOT NULL,
    "constraints" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "parserVersion" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogCardProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogCardProfile_game_catalogCardId_key" ON "CatalogCardProfile"("game", "catalogCardId");

-- CreateIndex
CREATE INDEX "CatalogCardProfile_game_idx" ON "CatalogCardProfile"("game");

-- CreateIndex
CREATE INDEX "CatalogCardProfile_source_idx" ON "CatalogCardProfile"("source");

-- CreateIndex
CREATE INDEX "CatalogCardProfile_familyKey_idx" ON "CatalogCardProfile"("familyKey");

-- CreateIndex
CREATE INDEX "CatalogCardProfile_confidence_idx" ON "CatalogCardProfile"("confidence");
