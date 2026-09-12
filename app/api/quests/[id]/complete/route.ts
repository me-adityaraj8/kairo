import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { REWARD, XP_FOR_LEVEL, applyXp, todayUTC, streakMultiplier } from "@/lib/engine";
import { advanceCombo } from "@/lib/combo";
import { stageIndex } from "@/lib/companion";
import {
  CascadeEvent,
  addBond,
  bumpChallenges,
  grantLevelChest,
  grantStreakChest,
  recordActivity,
  unlockAchievements,
} from "@/lib/progression";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const quest = await prisma.quest.findUnique({ where: { id: params.id } });
    if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    if (quest.userId !== sessionUser.id) {
      return NextResponse.json({ error: "Not your quest" }, { status: 403 });
    }
    if (quest.done) {
      return NextResponse.json({ error: "Quest already completed" }, { status: 409 });
    }

    /*
     * Only the reward itself is atomic. Challenges, achievements, chests and
     * bond are derived bookkeeping, so they run after the commit — keeping the
     * transaction short enough to survive a distant database.
     */
    const core = await prisma.$transaction(
      async (tx) => {
        const claimed = await tx.quest.updateMany({
          where: { id: quest.id, done: false },
          data: { done: true, completedAt: new Date() },
        });
        if (claimed.count === 0) return null;

        const [user, attribute] = await Promise.all([
          tx.user.findUniqueOrThrow({ where: { id: sessionUser.id } }),
          tx.attribute.findUniqueOrThrow({ where: { id: quest.attributeId } }),
        ]);

        const reward = REWARD[quest.difficulty];
        const today = todayUTC();
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

        let streak = user.streak;
        let streakGrew = false;
        if (user.lastActiveOn !== today) {
          streak = user.lastActiveOn === yesterday ? user.streak + 1 : 1;
          streakGrew = true;
        }

        const combo = advanceCombo(user.comboCount, user.comboExpiresAt);
        const xpGained = Math.round(reward.xp * streakMultiplier(streak) * combo.multiplier);
        const goldGained = reward.gold;

        const userProgress = applyXp(user.level, user.xp, xpGained);
        const attrProgress = applyXp(attribute.level, attribute.xp, xpGained);

        const [updatedUser, updatedAttribute] = await Promise.all([
          tx.user.update({
            where: { id: user.id },
            data: {
              level: userProgress.level,
              xp: userProgress.xp,
              gold: user.gold + goldGained,
              streak,
              lastActiveOn: today,
              comboCount: combo.count,
              comboExpiresAt: combo.expiresAt,
              longestStreak: Math.max(user.longestStreak, streak),
              totalXpEarned: user.totalXpEarned + xpGained,
              questsCompleted: user.questsCompleted + 1,
            },
          }),
          tx.attribute.update({
            where: { id: attribute.id },
            data: { level: attrProgress.level, xp: attrProgress.xp },
          }),
        ]);

        return {
          xpGained,
          goldGained,
          streak,
          streakGrew,
          combo,
          user: updatedUser,
          attribute: updatedAttribute,
          leveledUp: userProgress.leveledUp,
          attributeLeveledUp: attrProgress.leveledUp,
        };
      },
      { timeout: 15000, maxWait: 10000 }
    );

    if (!core) {
      return NextResponse.json({ error: "Quest already completed" }, { status: 409 });
    }

    // --- post-commit cascade: best effort, never fails the reward ---
    const events: CascadeEvent[] = [];
    let companion: { stage: string; bond: number } | null = null;

    try {
      await recordActivity(prisma, core.user.id, { quests: 1, xp: core.xpGained });

      events.push(
        ...(await bumpChallenges(prisma, core.user.id, {
          quests: 1,
          xp: core.xpGained,
          hardQuests: quest.difficulty === "HARD" || quest.difficulty === "EPIC" ? 1 : 0,
        }))
      );

      if (core.streakGrew) events.push(...(await grantStreakChest(prisma, core.user.id, core.streak)));
      if (core.leveledUp) events.push(...(await grantLevelChest(prisma, core.user.id, core.user.level)));

      const bond = await addBond(prisma, core.user.id, core.leveledUp ? "levelUp" : "quest");
      events.push(...bond.events);
      companion = bond.companion ? { stage: bond.companion.stage, bond: bond.companion.bond } : null;

      const [itemsOwned, focusSessions] = await Promise.all([
        prisma.inventory.count({ where: { userId: core.user.id } }),
        prisma.focusSession.count({ where: { userId: core.user.id, completedAt: { not: null } } }),
      ]);

      events.push(
        ...(await unlockAchievements(prisma, core.user.id, {
          questsCompleted: core.user.questsCompleted,
          totalXpEarned: core.user.totalXpEarned,
          level: core.user.level,
          streak: core.user.streak,
          longestStreak: core.user.longestStreak,
          focusSessions,
          focusMinutes: core.user.focusMinutes,
          chestsOpened: core.user.chestsOpened,
          itemsOwned,
          companionStageIndex: stageIndex(bond.companion?.stage ?? "BASIC"),
          bestCombo: core.combo.count,
        }))
      );
    } catch (err) {
      console.error("cascade bookkeeping failed (reward already granted)", err);
    }

    const [finalUser, pendingChests] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: core.user.id } }),
      prisma.chest.count({ where: { userId: core.user.id, openedAt: null } }),
    ]);

    return NextResponse.json({
      xpGained: core.xpGained,
      goldGained: core.goldGained,
      streak: core.streak,
      combo: { count: core.combo.count, multiplier: core.combo.multiplier },
      user: {
        level: finalUser.level,
        xp: finalUser.xp,
        xpToNext: XP_FOR_LEVEL(finalUser.level),
        gold: finalUser.gold,
      },
      attribute: {
        id: core.attribute.id,
        name: core.attribute.name,
        level: core.attribute.level,
        xp: core.attribute.xp,
        xpToNext: XP_FOR_LEVEL(core.attribute.level),
      },
      companion,
      pendingChests,
      events,
      leveledUp: core.leveledUp,
      attributeLeveledUp: core.attributeLeveledUp,
    });
  } catch (err) {
    console.error("quest complete failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
