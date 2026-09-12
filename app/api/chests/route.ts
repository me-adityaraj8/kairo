import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { CHEST_META, ChestRarity } from "@/lib/chests";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const chests = await prisma.chest.findMany({
      where: { userId: user.id, openedAt: null },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      chests: chests.map((c) => ({
        id: c.id,
        rarity: c.rarity,
        source: c.source,
        label: CHEST_META[c.rarity as ChestRarity]?.label ?? "Chest",
        tint: CHEST_META[c.rarity as ChestRarity]?.tint ?? "#93a4bd",
      })),
    });
  } catch (err) {
    console.error("chests fetch failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
