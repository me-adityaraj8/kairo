import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { evaluate } from "@/lib/achievements";
import { stageIndex } from "@/lib/companion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const [user, unlocked, itemsOwned, focusSessions, companion] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } }),
      prisma.userAchievement.findMany({ where: { userId: sessionUser.id } }),
      prisma.inventory.count({ where: { userId: sessionUser.id } }),
      prisma.focusSession.count({ where: { userId: sessionUser.id, completedAt: { not: null } } }),
      prisma.companion.findUnique({ where: { userId: sessionUser.id } }),
    ]);

    const unlockedAt = new Map(unlocked.map((u) => [u.key, u.unlockedAt]));

    const list = evaluate({
      questsCompleted: user.questsCompleted,
      totalXpEarned: user.totalXpEarned,
      level: user.level,
      streak: user.streak,
      longestStreak: user.longestStreak,
      focusSessions,
      focusMinutes: user.focusMinutes,
      chestsOpened: user.chestsOpened,
      itemsOwned,
      companionStageIndex: stageIndex(companion?.stage ?? "BASIC"),
      bestCombo: user.comboCount,
    }).map((a) => ({
      ...a,
      unlocked: unlockedAt.has(a.key),
      unlockedAt: unlockedAt.get(a.key) ?? null,
    }));

    return NextResponse.json({
      achievements: list,
      unlockedCount: list.filter((a) => a.unlocked).length,
      total: list.length,
    });
  } catch (err) {
    console.error("achievements fetch failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
