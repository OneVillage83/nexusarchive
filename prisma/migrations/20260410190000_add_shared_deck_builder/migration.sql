-- CreateEnum
CREATE TYPE "DeckVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "DeckRulesMode" AS ENUM ('COMPETITIVE', 'STANDARD', 'HOUSE');

-- AlterTable
ALTER TABLE "Deck"
ADD COLUMN     "clerkUserId" TEXT,
ADD COLUMN     "formatKey" TEXT NOT NULL DEFAULT 'competitive',
ADD COLUMN     "rulesMode" "DeckRulesMode" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "slug" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "visibility" "DeckVisibility" NOT NULL DEFAULT 'PUBLIC';

UPDATE "Deck"
SET "slug" = CONCAT('deck-', "id")
WHERE "slug" = '';

-- AlterTable
ALTER TABLE "Deck"
ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];

UPDATE "Deck"
SET "tags" = ARRAY[]::TEXT[]
WHERE "tags" IS NULL;

-- AlterTable
ALTER TABLE "DeckCard" DROP CONSTRAINT "DeckCard_cardId_fkey";

ALTER TABLE "DeckCard"
ALTER COLUMN "cardId" DROP NOT NULL,
ADD COLUMN     "cardName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "cost" INTEGER,
ADD COLUMN     "displayCardId" TEXT,
ADD COLUMN     "domainValues" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "familyKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "hp" INTEGER,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "might" INTEGER,
ADD COLUMN     "power" INTEGER,
ADD COLUMN     "rarity" TEXT,
ADD COLUMN     "sectionKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "setCode" TEXT,
ADD COLUMN     "setName" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "text" TEXT,
ADD COLUMN     "typeLine" TEXT,
ADD COLUMN     "versionLabel" TEXT;

UPDATE "DeckCard" dc
SET
  "cardName" = COALESCE(c."name", dc."cardName"),
  "displayCardId" = COALESCE(dc."displayCardId", c."id"::TEXT),
  "imageUrl" = COALESCE(c."imageUrl", dc."imageUrl"),
  "typeLine" = COALESCE(c."type", dc."typeLine"),
  "text" = COALESCE(c."text", dc."text"),
  "domainValues" = CASE
    WHEN cardinality(COALESCE(c."domains", ARRAY[]::TEXT[])) > 0 THEN c."domains"
    ELSE dc."domainValues"
  END,
  "cost" = COALESCE(c."energyCost", dc."cost"),
  "power" = COALESCE(c."power", dc."power"),
  "might" = COALESCE(c."might", dc."might"),
  "hp" = COALESCE(c."hp", dc."hp"),
  "setCode" = COALESCE(c."setCode", dc."setCode"),
  "setName" = COALESCE(c."setName", dc."setName"),
  "rarity" = COALESCE(c."rarity", dc."rarity"),
  "familyKey" = CASE
    WHEN COALESCE(dc."familyKey", '') <> '' THEN dc."familyKey"
    ELSE LOWER(REGEXP_REPLACE(COALESCE(c."name", CONCAT('card-', dc."id")), '[^a-z0-9]+', '-', 'g'))
  END,
  "sectionKey" = CASE
    WHEN COALESCE(dc."sectionKey", '') <> '' THEN dc."sectionKey"
    WHEN c."type" ILIKE '%battlefield%' THEN 'battlefields'
    WHEN c."type" ILIKE '%rune%' THEN 'runes'
    WHEN c."type" ILIKE '%gear%' THEN 'gear'
    WHEN c."type" ILIKE '%spell%' THEN 'spells'
    WHEN c."type" ILIKE '%legend%' THEN 'legends'
    WHEN c."type" ILIKE '%leader%' THEN 'leader'
    WHEN c."type" ILIKE '%stage%' THEN 'stages'
    WHEN c."type" ILIKE '%event%' THEN 'events'
    WHEN c."type" ILIKE '%character%' THEN 'characters'
    WHEN c."type" ILIKE '%land%' THEN 'lands'
    WHEN c."type" ILIKE '%instant%' THEN 'instants'
    WHEN c."type" ILIKE '%sorcery%' THEN 'sorceries'
    WHEN c."type" ILIKE '%planeswalker%' THEN 'planeswalkers'
    WHEN c."type" ILIKE '%battle%' THEN 'battles'
    WHEN c."type" ILIKE '%enchantment%' THEN 'enchantments'
    WHEN c."type" ILIKE '%artifact%' THEN 'artifacts'
    WHEN c."type" ILIKE '%creature%' OR c."type" ILIKE '%unit%' THEN 'creatures'
    ELSE 'extras'
  END
FROM "Card" c
WHERE dc."cardId" = c."id";

ALTER TABLE "DeckCard"
ADD CONSTRAINT "DeckCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "Deck_slug_key" ON "Deck"("slug");

-- CreateIndex
CREATE INDEX "Deck_game_visibility_updatedAt_idx" ON "Deck"("game", "visibility", "updatedAt");

-- CreateIndex
CREATE INDEX "Deck_game_clerkUserId_updatedAt_idx" ON "Deck"("game", "clerkUserId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeckCard_deckId_familyKey_key" ON "DeckCard"("deckId", "familyKey");

-- CreateIndex
CREATE INDEX "DeckCard_deckId_sectionKey_sortOrder_idx" ON "DeckCard"("deckId", "sectionKey", "sortOrder");
