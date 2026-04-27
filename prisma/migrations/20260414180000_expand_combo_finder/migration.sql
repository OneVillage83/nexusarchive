ALTER TABLE "Combo"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN "externalId" TEXT,
  ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'combo',
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "resultText" TEXT,
  ADD COLUMN "steps" JSONB,
  ADD COLUMN "prerequisites" JSONB,
  ADD COLUMN "formatTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "isComplete" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "popularity" INTEGER,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Combo"
SET
  "summary" = COALESCE("description", "summary"),
  "resultText" = COALESCE("output", "resultText"),
  "prerequisites" = CASE
    WHEN "requirements" IS NULL OR trim("requirements") = '' THEN "prerequisites"
    ELSE to_jsonb(ARRAY["requirements"])
  END,
  "slug" = lower(regexp_replace(COALESCE("name", 'combo') || '-' || "id"::text, '[^a-zA-Z0-9]+', '-', 'g'));

ALTER TABLE "Combo"
  ALTER COLUMN "slug" SET NOT NULL;

ALTER TABLE "Combo"
  ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "ComboCard"
  ADD COLUMN "familyKey" TEXT,
  ADD COLUMN "cardName" TEXT,
  ADD COLUMN "role" TEXT NOT NULL DEFAULT 'piece',
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "ComboCard" AS "comboCard"
SET
  "familyKey" = lower(regexp_replace(COALESCE("Card"."name", 'card-' || "comboCard"."id"::text), '[^a-zA-Z0-9]+', '-', 'g')),
  "cardName" = COALESCE("Card"."name", 'Unknown Card'),
  "sortOrder" = 0
FROM "Card"
WHERE "Card"."id" = "comboCard"."cardId";

UPDATE "ComboCard"
SET
  "familyKey" = COALESCE("familyKey", 'card-' || "id"::text),
  "cardName" = COALESCE("cardName", 'Unknown Card');

ALTER TABLE "ComboCard"
  ALTER COLUMN "familyKey" SET NOT NULL,
  ALTER COLUMN "cardName" SET NOT NULL,
  ALTER COLUMN "cardId" DROP NOT NULL;

CREATE UNIQUE INDEX "Combo_game_slug_key" ON "Combo"("game", "slug");
CREATE UNIQUE INDEX "Combo_game_source_externalId_key" ON "Combo"("game", "source", "externalId");
CREATE INDEX "Combo_game_source_idx" ON "Combo"("game", "source");
CREATE INDEX "ComboCard_comboId_sortOrder_idx" ON "ComboCard"("comboId", "sortOrder");
CREATE INDEX "ComboCard_familyKey_idx" ON "ComboCard"("familyKey");
