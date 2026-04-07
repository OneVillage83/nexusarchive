-- CreateEnum
CREATE TYPE "Game" AS ENUM ('RIFTBOUND', 'ONE_PIECE', 'MAGIC_THE_GATHERING');

-- AlterTable
ALTER TABLE "Card"
ADD COLUMN "game" "Game" NOT NULL DEFAULT 'RIFTBOUND';

-- AlterTable
ALTER TABLE "Champion"
ADD COLUMN "game" "Game" NOT NULL DEFAULT 'RIFTBOUND';

-- AlterTable
ALTER TABLE "Deck"
ADD COLUMN "game" "Game" NOT NULL DEFAULT 'RIFTBOUND';

-- AlterTable
ALTER TABLE "Combo"
ADD COLUMN "game" "Game" NOT NULL DEFAULT 'RIFTBOUND';

-- CreateIndex
CREATE INDEX "Card_game_name_idx" ON "Card"("game", "name");

-- CreateIndex
CREATE INDEX "Champion_game_name_idx" ON "Champion"("game", "name");

-- CreateIndex
CREATE INDEX "Deck_game_name_idx" ON "Deck"("game", "name");

-- CreateIndex
CREATE INDEX "Combo_game_name_idx" ON "Combo"("game", "name");
