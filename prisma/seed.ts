import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const items = [
  // COMMON
  { slug: "torch", name: "Rusty Torch", cost: 50, payload: "🔦", rarity: "COMMON", slot: "TRINKET" },
  { slug: "shield-badge", name: "Apprentice Shield", cost: 90, payload: "🛡️", rarity: "COMMON", slot: "ARMOR" },
  { slug: "boots", name: "Worn Boots", cost: 70, payload: "🥾", rarity: "COMMON", slot: "ARMOR" },
  { slug: "compass", name: "Bent Compass", cost: 110, payload: "🧭", rarity: "COMMON", slot: "TRINKET" },

  // RARE
  { slug: "quill", name: "Scribe's Quill", cost: 150, payload: "🪶", rarity: "RARE", slot: "WEAPON" },
  { slug: "potion", name: "Vial of Vigor", cost: 220, payload: "🧪", rarity: "RARE", slot: "TRINKET" },
  { slug: "lantern", name: "Everlit Lantern", cost: 180, payload: "🏮", rarity: "RARE", slot: "TRINKET" },
  { slug: "cloak", name: "Traveller's Cloak", cost: 240, payload: "🧥", rarity: "RARE", slot: "ARMOR" },

  // EPIC
  { slug: "crown", name: "Tin Crown", cost: 300, payload: "👑", rarity: "EPIC", slot: "COSMETIC" },
  { slug: "sword", name: "Iron Blade", cost: 380, payload: "⚔️", rarity: "EPIC", slot: "WEAPON" },
  { slug: "orb", name: "Whispering Orb", cost: 420, payload: "🔮", rarity: "EPIC", slot: "COMPANION" },
  { slug: "bow", name: "Longbow of Focus", cost: 350, payload: "🏹", rarity: "EPIC", slot: "WEAPON" },

  // LEGENDARY
  { slug: "wings", name: "Moth Wings", cost: 480, payload: "🦋", rarity: "LEGENDARY", slot: "COSMETIC" },
  { slug: "dragon", name: "Dragon Emblem", cost: 600, payload: "🐉", rarity: "LEGENDARY", slot: "COSMETIC" },
  { slug: "halo", name: "Fractured Halo", cost: 720, payload: "😇", rarity: "LEGENDARY", slot: "COSMETIC" },
  { slug: "star", name: "Captive Star", cost: 900, payload: "🌟", rarity: "LEGENDARY", slot: "COMPANION" },
];

async function main() {
  for (const item of items) {
    await prisma.item.upsert({
      where: { slug: item.slug },
      update: { rarity: item.rarity, slot: item.slot, name: item.name, cost: item.cost, payload: item.payload },
      create: item,
    });
  }
  console.log(`Seeded ${items.length} items.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
