-- CreateTable
CREATE TABLE "SynergyPackage" (
    "id" SERIAL NOT NULL,
    "game" "Game" NOT NULL,
    "source" TEXT NOT NULL,
    "packageKey" TEXT NOT NULL,
    "cardIds" JSONB NOT NULL,
    "identityKeys" JSONB NOT NULL,
    "packageSize" INTEGER NOT NULL,
    "packageType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "tags" JSONB NOT NULL,
    "roles" JSONB NOT NULL,
    "requiredEdges" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "playPattern" TEXT NOT NULL,
    "requiredConditions" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "isCombo" BOOLEAN NOT NULL DEFAULT false,
    "isEngine" BOOLEAN NOT NULL DEFAULT false,
    "isWinCondition" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SynergyPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SynergyPackage_game_source_packageKey_packageType_key" ON "SynergyPackage"("game", "source", "packageKey", "packageType");

-- CreateIndex
CREATE INDEX "SynergyPackage_game_idx" ON "SynergyPackage"("game");

-- CreateIndex
CREATE INDEX "SynergyPackage_source_idx" ON "SynergyPackage"("source");

-- CreateIndex
CREATE INDEX "SynergyPackage_packageSize_idx" ON "SynergyPackage"("packageSize");

-- CreateIndex
CREATE INDEX "SynergyPackage_packageType_idx" ON "SynergyPackage"("packageType");

-- CreateIndex
CREATE INDEX "SynergyPackage_score_idx" ON "SynergyPackage"("score");

-- CreateIndex
CREATE INDEX "SynergyPackage_isCombo_idx" ON "SynergyPackage"("isCombo");

-- CreateIndex
CREATE INDEX "SynergyPackage_isEngine_idx" ON "SynergyPackage"("isEngine");

-- CreateIndex
CREATE INDEX "SynergyPackage_isWinCondition_idx" ON "SynergyPackage"("isWinCondition");
