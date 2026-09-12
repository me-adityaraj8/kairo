import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { XP_FOR_LEVEL, todayUTC } from "@/lib/engine";
import { stageMeta } from "@/lib/companion";
import { evaluate } from "@/lib/achievements";
import { stageIndex } from "@/lib/companion";

export const dynamic = "force-dynamic";

/** Everything the character/stats screen needs, including a year of activity. */
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const since = new Date(Date.now() - 364 * 86400000).toISOString().slice(0, 10);

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        attributes: { orderBy: { name: "asc" } },
        inventory: { include: { item: true } },
        companion: true,
        activityDays: { where: { day: { gte: since } }, orderBy: { day: "asc" } },
        quests: { select: { done: true, difficulty: true, completedAt: true, title: true, createdAt: true } },
      },
    });
    if (!user) return NextResponse.json({ error: "Adventurer not found" }, { status: 404 });

    const [focusSessions, achievementRows] = await Promise.all([
      prisma.focusSession.count({ where: { userId: user.id, completedAt: { not: null } } }),
      prisma.userAchievement.findMany({ where: { userId: user.id }, select: { key: true } }),
    ]);

    const unlocked = new Set(achievementRows.map((a) => a.key));
    const achievements = evaluate({
      questsCompleted: user.questsCompleted,
      totalXpEarned: user.totalXpEarned,
      level: user.level,
      streak: user.streak,
      longestStreak: user.longestStreak,
      focusSessions,
      focusMinutes: user.focusMinutes,
      chestsOpened: user.chestsOpened,
      itemsOwned: user.inventory.length,
      companionStageIndex: stageIndex(user.companion?.stage ?? "BASIC"),
      bestCombo: user.comboCount,
    });

    const byDifficulty: Record<string, number> = {};
    for (const q of user.quests) {
      if (!q.done) continue;
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
    }

    const meta = user.companion ? stageMeta(user.companion.stage) : null;

    return NextResponse.json({
      today: todayUTC(),
      user: {
        displayName: user.displayName,
        level: user.level,
        xp: user.xp,
        xpToNext: XP_FOR_LEVEL(user.level),
        gold: user.gold,
        streak: user.streak,
        longestStreak: user.longestStreak,
        totalXpEarned: user.totalXpEarned,
        questsCompleted: user.questsCompleted,
        focusMinutes: user.focusMinutes,
        chestsOpened: user.chestsOpened,
        joinedAt: user.createdAt,
      },
      attributes: user.attributes.map((a) => ({
        id: a.id,
        name: a.name,
        level: a.level,
        xp: a.xp,
        xpToNext: XP_FOR_LEVEL(a.level),
      })),
      companion: user.companion
        ? {
            name: user.companion.name,
            personality: user.companion.personality,
            stage: user.companion.stage,
            stageTitle: meta!.title,
            face: meta!.face,
            tint: meta!.tint,
            bond: user.companion.bond,
          }
        : null,
      owned: user.inventory.map((r) => ({
        slug: r.item.slug,
        name: r.item.name,
        payload: r.item.payload,
        rarity: r.item.rarity,
        slot: r.item.slot,
        equipped: r.equipped,
      })),
      activity: user.activityDays.map((d) => ({
        day: d.day,
        quests: d.quests,
        xp: d.xp,
        focusMinutes: d.focusMinutes,
      })),
      questsByDifficulty: byDifficulty,
      focusSessions,
      achievements: {
        unlocked: achievements.filter((a) => unlocked.has(a.key)).length,
        total: achievements.length,
        recent: achievements
          .filter((a) => unlocked.has(a.key))
          .slice(-5)
          .map((a) => ({ key: a.key, title: a.title, icon: a.icon, rarity: a.rarity })),
      },
    });
  } catch (err) {
    console.error("stats fetch failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
