-- CreateTable
CREATE TABLE "CardSynergy" (
    "id" SERIAL NOT NULL,
    "game" "Game" NOT NULL,
    "source" TEXT NOT NULL,
    "primaryCardId" TEXT NOT NULL,
    "secondaryCardId" TEXT NOT NULL,
    "primaryIdentityKey" TEXT NOT NULL,
    "secondaryIdentityKey" TEXT NOT NULL,
    "cardIds" JSONB NOT NULL,
    "identityKeys" JSONB NOT NULL,
    "synergyType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "tags" JSONB NOT NULL,
    "roles" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "requiredConditions" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardSynergy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardSynergy_game_source_primaryIdentityKey_secondaryIdentityKey_synergyType_key" ON "CardSynergy"("game", "source", "primaryIdentityKey", "secondaryIdentityKey", "synergyType");

-- CreateIndex
CREATE INDEX "CardSynergy_game_idx" ON "CardSynergy"("game");

-- CreateIndex
CREATE INDEX "CardSynergy_source_idx" ON "CardSynergy"("source");

-- CreateIndex
CREATE INDEX "CardSynergy_primaryCardId_idx" ON "CardSynergy"("primaryCardId");

-- CreateIndex
CREATE INDEX "CardSynergy_secondaryCardId_idx" ON "CardSynergy"("secondaryCardId");

-- CreateIndex
CREATE INDEX "CardSynergy_primaryIdentityKey_idx" ON "CardSynergy"("primaryIdentityKey");

-- CreateIndex
CREATE INDEX "CardSynergy_secondaryIdentityKey_idx" ON "CardSynergy"("secondaryIdentityKey");

-- CreateIndex
CREATE INDEX "CardSynergy_score_idx" ON "CardSynergy"("score");
