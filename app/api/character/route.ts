import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { XP_FOR_LEVEL } from "@/lib/engine";
import { readCombo } from "@/lib/combo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        attributes: { orderBy: { name: "asc" } },
        inventory: { include: { item: true } },
      },
    });
    if (!user) return NextResponse.json({ error: "Adventurer not found" }, { status: 404 });

    const combo = readCombo(user.comboCount, user.comboExpiresAt);
    const pendingChests = await prisma.chest.count({
      where: { userId: user.id, openedAt: null },
    });

    return NextResponse.json({
      user: {
        displayName: user.displayName,
        level: user.level,
        xp: user.xp,
        xpToNext: XP_FOR_LEVEL(user.level),
        gold: user.gold,
        streak: user.streak,
        longestStreak: user.longestStreak,
        combo: { count: combo.count, multiplier: combo.multiplier },
      },
      pendingChests,
      attributes: user.attributes.map((a) => ({
        id: a.id,
        name: a.name,
        level: a.level,
        xp: a.xp,
        xpToNext: XP_FOR_LEVEL(a.level),
      })),
      owned: user.inventory.map((row) => ({
        slug: row.item.slug,
        payload: row.item.payload,
        rarity: row.item.rarity,
        slot: row.item.slot,
        equipped: row.equipped,
      })),
    });
  } catch (err) {
    console.error("character fetch failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
