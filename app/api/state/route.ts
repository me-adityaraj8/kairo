import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { XP_FOR_LEVEL } from "@/lib/engine";
import { readCombo } from "@/lib/combo";
import { challengesFor } from "@/lib/challenges";
import { todayUTC } from "@/lib/engine";
import { CHEST_META, ChestRarity } from "@/lib/chests";
import { moodFrom, nextStage, stageMeta } from "@/lib/companion";

export const dynamic = "force-dynamic";

/**
 * Everything the dashboard needs in one request.
 *
 * The dashboard previously made five parallel calls on mount, which exhausted
 * the connection pool on a high-latency link. One round trip is both faster
 * and far kinder to the pool.
 */
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const day = todayUTC();

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        attributes: { orderBy: { name: "asc" } },
        inventory: { include: { item: true } },
        companion: true,
        quests: { include: { attribute: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
        dailyChallenges: { where: { day } },
        chests: { where: { openedAt: null }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!user) return NextResponse.json({ error: "Adventurer not found" }, { status: 404 });

    const companion =
      user.companion ?? (await prisma.companion.create({ data: { userId: user.id } }));

    const activeFocus = await prisma.focusSession.count({
      where: { userId: user.id, completedAt: null },
    });

    const combo = readCombo(user.comboCount, user.comboExpiresAt);
    const meta = stageMeta(companion.stage);
    const upcoming = nextStage(companion.stage);
    const progressByKey = new Map(user.dailyChallenges.map((c) => [c.key, c]));

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
      quests: user.quests.map((q) => ({
        id: q.id,
        title: q.title,
        difficulty: q.difficulty,
        attributeId: q.attributeId,
        attributeName: q.attribute.name,
        done: q.done,
        completedAt: q.completedAt,
      })),
      companion: {
        name: companion.name,
        species: companion.species,
        personality: companion.personality,
        stage: companion.stage,
        stageTitle: meta.title,
        face: meta.face,
        tint: meta.tint,
        bond: companion.bond,
        nextStage: upcoming
          ? { stage: upcoming.stage, title: upcoming.title, bond: upcoming.bond }
          : null,
        mood: moodFrom({ lastInteracted: companion.lastInteracted, focusActive: activeFocus > 0 }),
      },
      challenges: challengesFor(user.id, day).map((def) => {
        const row = progressByKey.get(def.key);
        const progress = Math.min(row?.progress ?? 0, def.target);
        return {
          key: def.key,
          title: def.title,
          icon: def.icon,
          target: def.target,
          gold: def.gold,
          progress,
          complete: progress >= def.target,
        };
      }),
      chests: user.chests.map((c) => ({
        id: c.id,
        rarity: c.rarity,
        source: c.source,
        label: CHEST_META[c.rarity as ChestRarity]?.label ?? "Chest",
        tint: CHEST_META[c.rarity as ChestRarity]?.tint ?? "#93a4bd",
      })),
    });
  } catch (err) {
    console.error("state fetch failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
