import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.deleteMany({});
  const items = await prisma.item.count();
  console.log(`Removed ${users.count} adventurers. ${items} shop items intact.`);
}

main().finally(() => prisma.$disconnect());
