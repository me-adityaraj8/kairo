import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { CHEST_META, CHEST_POOL, ChestRarity, rollGold } from "@/lib/chests";
import { addBond } from "@/lib/progression";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const chest = await prisma.chest.findUnique({ where: { id: params.id } });
    if (!chest) return NextResponse.json({ error: "Chest not found" }, { status: 404 });
    if (chest.userId !== sessionUser.id) {
      return NextResponse.json({ error: "Not your chest" }, { status: 403 });
    }
    if (chest.openedAt) return NextResponse.json({ error: "Chest already opened" }, { status: 409 });

    const result = await prisma.$transaction(
      async (tx) => {
        // Atomic claim so a double click cannot open the same chest twice.
        const claimed = await tx.chest.updateMany({
          where: { id: chest.id, openedAt: null },
          data: { openedAt: new Date() },
        });
        if (claimed.count === 0) return null;

        const rarity = chest.rarity as ChestRarity;
        const owned = await tx.inventory.findMany({
          where: { userId: sessionUser.id },
          select: { itemId: true },
        });
        const ownedIds = owned.map((o) => o.itemId);

        // Try each rarity tier the chest can produce, best first.
        let item = null;
        for (const tier of CHEST_POOL[rarity] ?? ["COMMON"]) {
          const candidates = await tx.item.findMany({
            where: { rarity: tier, id: { notIn: ownedIds } },
          });
          if (candidates.length) {
            item = candidates[Math.floor(Math.random() * candidates.length)];
            break;
          }
        }

        // Nothing left to win: pay out gold instead so a chest is never a dud.
        const gold = item ? Math.floor(rollGold(rarity) * 0.3) : rollGold(rarity);

        if (item) {
          await tx.inventory.create({ data: { userId: sessionUser.id, itemId: item.id } });
        }

        await tx.chest.update({
          where: { id: chest.id },
          data: { rewardId: item?.id ?? null, rewardGold: gold },
        });

        const user = await tx.user.update({
          where: { id: sessionUser.id },
          data: { gold: { increment: gold }, chestsOpened: { increment: 1 } },
        });

        const bond = await addBond(tx, sessionUser.id, "chest");

        return {
          rarity,
          label: CHEST_META[rarity]?.label ?? "Chest",
          gold,
          item: item ? { slug: item.slug, name: item.name, payload: item.payload, rarity: item.rarity } : null,
          totalGold: user.gold,
          companionEvolved: bond.events.some((e) => e.type === "COMPANION_EVOLVED"),
        };
      },
      { timeout: 20000, maxWait: 15000 }
    );

    if (!result) return NextResponse.json({ error: "Chest already opened" }, { status: 409 });

    return NextResponse.json(result);
  } catch (err) {
    console.error("chest open failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
