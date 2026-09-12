import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const [items, inventory, dbUser] = await Promise.all([
      prisma.item.findMany({ orderBy: { cost: "asc" } }),
      prisma.inventory.findMany({ where: { userId: user.id } }),
      prisma.user.findUnique({ where: { id: user.id }, select: { gold: true } }),
    ]);

    const ownedIds = new Set(inventory.map((row) => row.itemId));

    return NextResponse.json({
      gold: dbUser?.gold ?? 0,
      items: items.map((item) => ({
        slug: item.slug,
        name: item.name,
        cost: item.cost,
        payload: item.payload,
        owned: ownedIds.has(item.id),
      })),
    });
  } catch (err) {
    console.error("shop fetch failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
