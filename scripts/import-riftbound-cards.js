// scripts/import-riftbound-cards.js
// Usage: node scripts/import-riftbound-cards.js

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// If you're on Node < 18, uncomment this and install node-fetch:
//   npm install node-fetch
// const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const REGION = process.env.RIOT_RIFTBOUND_REGION || "americas";
const LOCALE = process.env.RIOT_RIFTBOUND_LOCALE || "en";
const API_KEY = process.env.RIOT_RIFTBOUND_API_KEY;

if (!API_KEY) {
  console.error("Missing RIOT_RIFTBOUND_API_KEY in .env");
  process.exit(1);
}

const BASE_URL = `https://${REGION}.api.riotgames.com`;

/**
 * Call GET /riftbound/content/v1/contents
 * Returns a RiftboundContentDTO:
 * {
 *   game: string,
 *   version: string,
 *   lastUpdated: string,
 *   sets: SetDTO[]
 * }
 *
 * SetDTO:
 * { id, name, cards: CardDTO[] }
 */
async function fetchRiftboundContent() {
  const url = new URL("/riftbound/content/v1/contents", BASE_URL);
  url.searchParams.set("locale", LOCALE);

  const res = await fetch(url, {
    headers: {
      "X-Riot-Token": API_KEY,
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    console.error("Error fetching Riftbound content:", res.status, res.statusText);
    const text = await res.text().catch(() => "");
    console.error(text);
    throw new Error(`Failed to fetch Riftbound content (${res.status})`);
  }

  /** @type {{
   *   game: string;
   *   version: string;
   *   lastUpdated: string;
   *   sets: Array<{
   *     id: string;
   *     name: string;
   *     cards: any[];
   *   }>
   * }} */
  const content = await res.json();
  return content;
}

/**
 * Flatten sets[] into an array of { setInfo, card } pairs
 */
function flattenSetsToCards(content) {
  const result = [];

  for (const set of content.sets || []) {
    for (const card of set.cards || []) {
      result.push({
        setId: set.id,
        setName: set.name,
        card,
      });
    }
  }

  return result;
}

/**
 * Map Riot's CardDTO to your Prisma Card model.
 *
 * CardDTO fields (from your screenshot):
 * - id: string
 * - collectorNumber: long
 * - set: string
 * - name: string
 * - description: string
 * - type: string
 * - rarity: string
 * - faction: string
 * - stats: { energy, might, cost, power }
 * - keywords: string[]
 * - art: { thumbnailURL, fullURL, artist }
 * - flavorText: string
 * - tags: string[]
 */
function mapCardToPrisma(flatCard) {
  const { setId, setName, card } = flatCard;

  const stats = card.stats || {};
  const art = card.art || {};

  // NOTE on stats mapping:
  // Prisma has: energyCost, power, might, hp
  // CardStatsDTO has: energy, might, cost, power
  // For now:
  //   energyCost  <- stats.cost (what players usually call "cost")
  //   power       <- stats.power
  //   might       <- stats.might
  //   hp          <- null (Riftbound cards don't appear to surface HP separately)
  //
  // If Riot later clarifies that "energy" is the actual cost, you can swap it.

  return {
    name: card.name,
    type: card.type,
    domains: card.faction ? [card.faction] : [],
    rarity: card.rarity,

    energyCost: stats.cost ?? null,
    power: stats.power ?? null,
    might: stats.might ?? null,
    hp: null,

    text: card.description ?? null,
    flavor: card.flavorText ?? null,

    setCode: setId ?? card.set ?? null,
    setName: setName ?? null,
    collectorNo: card.collectorNumber != null ? String(card.collectorNumber) : null,

    imageUrl: art.fullURL ?? art.thumbnailURL ?? null,

    // You don't have championName / championId in the content API, so leave null
    championId: null,
  };
}

async function main() {
  console.log("Fetching Riftbound content from Riot API...");
  const content = await fetchRiftboundContent();

  console.log(
    `Game: ${content.game}, version: ${content.version}, lastUpdated: ${content.lastUpdated}`
  );

  const flatCards = flattenSetsToCards(content);
  console.log(`Total cards returned across all sets: ${flatCards.length}`);

  // Wipe and reseed. Later we can switch to upsert if you want migrations over time.
  console.log("Clearing existing Card records...");
  await prisma.card.deleteMany();

  console.log("Inserting cards into database...");
  const chunkSize = 100;
  let inserted = 0;

  for (let i = 0; i < flatCards.length; i += chunkSize) {
    const chunk = flatCards.slice(i, i + chunkSize);
    const data = chunk.map(mapCardToPrisma);

    await prisma.card.createMany({
      data,
      skipDuplicates: true,
    });

    inserted += data.length;
    console.log(`Inserted ${inserted} / ${flatCards.length} cards...`);
  }

  console.log("Riftbound card import complete.");
}

main()
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
