import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const items = [
  { slug: "torch", name: "Rusty Torch", cost: 50, payload: "🔦" },
  { slug: "shield-badge", name: "Apprentice Shield", cost: 90, payload: "🛡️" },
  { slug: "quill", name: "Scribe's Quill", cost: 150, payload: "🪶" },
  { slug: "potion", name: "Vial of Vigor", cost: 220, payload: "🧪" },
  { slug: "crown", name: "Tin Crown", cost: 300, payload: "👑" },
  { slug: "sword", name: "Iron Blade", cost: 380, payload: "⚔️" },
  { slug: "wings", name: "Moth Wings", cost: 480, payload: "🦋" },
  { slug: "dragon", name: "Dragon Emblem", cost: 600, payload: "🐉" },
];

async function main() {
  for (const item of items) {
    await prisma.item.upsert({
      where: { slug: item.slug },
      update: {},
      create: item,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
