-- CreateTable
CREATE TABLE "CardProfile" (
    "id" SERIAL NOT NULL,
    "cardId" INTEGER NOT NULL,
    "game" "Game" NOT NULL,
    "name" TEXT NOT NULL,
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

    CONSTRAINT "CardProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardProfile_cardId_key" ON "CardProfile"("cardId");

-- CreateIndex
CREATE INDEX "CardProfile_game_idx" ON "CardProfile"("game");

-- CreateIndex
CREATE INDEX "CardProfile_confidence_idx" ON "CardProfile"("confidence");

-- AddForeignKey
ALTER TABLE "CardProfile" ADD CONSTRAINT "CardProfile_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
