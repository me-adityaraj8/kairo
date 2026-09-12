import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { REWARD, XP_FOR_LEVEL, applyXp, todayUTC, streakMultiplier } from "@/lib/engine";

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

    const result = await prisma.$transaction(async (tx) => {
      // Atomic claim: only one request can flip done false -> true.
      const claimed = await tx.quest.updateMany({
        where: { id: quest.id, done: false },
        data: { done: true, completedAt: new Date() },
      });
      if (claimed.count === 0) return null;

      const user = await tx.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
      const attribute = await tx.attribute.findUniqueOrThrow({ where: { id: quest.attributeId } });

      const reward = REWARD[quest.difficulty];
      const today = todayUTC();
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      let streak = user.streak;
      if (user.lastActiveOn !== today) {
        streak = user.lastActiveOn === yesterday ? user.streak + 1 : 1;
      }

      const xpGained = Math.round(reward.xp * streakMultiplier(streak));
      const goldGained = reward.gold;

      const userProgress = applyXp(user.level, user.xp, xpGained);
      const attrProgress = applyXp(attribute.level, attribute.xp, xpGained);

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          level: userProgress.level,
          xp: userProgress.xp,
          gold: user.gold + goldGained,
          streak,
          lastActiveOn: today,
        },
      });

      const updatedAttribute = await tx.attribute.update({
        where: { id: attribute.id },
        data: { level: attrProgress.level, xp: attrProgress.xp },
      });

      return {
        xpGained,
        goldGained,
        streak,
        user: {
          level: updatedUser.level,
          xp: updatedUser.xp,
          xpToNext: XP_FOR_LEVEL(updatedUser.level),
          gold: updatedUser.gold,
        },
        attribute: {
          id: updatedAttribute.id,
          name: updatedAttribute.name,
          level: updatedAttribute.level,
          xp: updatedAttribute.xp,
          xpToNext: XP_FOR_LEVEL(updatedAttribute.level),
        },
        leveledUp: userProgress.leveledUp,
        attributeLeveledUp: attrProgress.leveledUp,
      };
      // Neon can idle-suspend; the default 5s interactive-transaction cap is too tight.
    }, { timeout: 20000, maxWait: 15000 });

    if (!result) {
      return NextResponse.json({ error: "Quest already completed" }, { status: 409 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("quest complete failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
