// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  // Clear existing data in a safe order
  await prisma.deckCard.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.comboCard.deleteMany();
  await prisma.combo.deleteMany();
  await prisma.cardPrice.deleteMany();
  await prisma.card.deleteMany();
  await prisma.champion.deleteMany();

  // Create a sample champion
  const champion = await prisma.champion.create({
    data: {
      name: "Arc Nexus Warden",
      type: "Champion",
      imageUrl: null,
    },
  });

  // Create a few sample cards
  await prisma.card.createMany({
    data: [
      {
        name: "Rift Spark",
        type: "Spell",
        domains: ["Arcane"],
        rarity: "Common",
        energyCost: 1,
        power: null,
        might: null,
        hp: null,
        text: "Deal 1 damage to a unit. If it dies, gain 1 energy.",
        flavor: "Every spark can ignite a war.",
        setCode: "CORE",
        setName: "Core Set",
        collectorNo: "001",
        imageUrl: null,
        championId: champion.id,
      },
      {
        name: "Nexus Vanguard",
        type: "Unit",
        domains: ["Valor"],
        rarity: "Rare",
        energyCost: 3,
        power: 3,
        might: 2,
        hp: 3,
        text: "On summon: Gain +1 Might this turn.",
        flavor: "They stand between the Rift and ruin.",
        setCode: "CORE",
        setName: "Core Set",
        collectorNo: "045",
        imageUrl: null,
        championId: champion.id,
      },
      {
        name: "Void-Touched Acolyte",
        type: "Unit",
        domains: ["Void"],
        rarity: "Uncommon",
        energyCost: 2,
        power: 2,
        might: 1,
        hp: 2,
        text: "When this dies, draw a card, then discard a card.",
        flavor: "Even whispers from the Void demand a price.",
        setCode: "CORE",
        setName: "Core Set",
        collectorNo: "078",
        imageUrl: null,
        championId: champion.id,
      },
    ],
  });

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
