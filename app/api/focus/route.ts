import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { XP_FOR_LEVEL, applyXp, todayUTC } from "@/lib/engine";
import { stageIndex } from "@/lib/companion";
import {
  CascadeEvent,
  addBond,
  bumpChallenges,
  grantLevelChest,
  recordActivity,
  unlockAchievements,
} from "@/lib/progression";

export const dynamic = "force-dynamic";

const startSchema = z.object({ minutes: z.number().int().min(1).max(120) });
const finishSchema = z.object({ id: z.string().min(1) });

/** XP scales with real minutes focused. */
const xpForMinutes = (m: number) => Math.round(m * 2.5);
const goldForMinutes = (m: number) => Math.round(m * 0.8);

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const [active, recent, total] = await Promise.all([
      prisma.focusSession.findFirst({
        where: { userId: user.id, completedAt: null },
        orderBy: { startedAt: "desc" },
      }),
      prisma.focusSession.findMany({
        where: { userId: user.id, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 10,
      }),
      prisma.focusSession.count({ where: { userId: user.id, completedAt: { not: null } } }),
    ]);

    return NextResponse.json({
      active: active ? { id: active.id, minutes: active.minutes, startedAt: active.startedAt } : null,
      recent: recent.map((s) => ({ id: s.id, minutes: s.minutes, completedAt: s.completedAt })),
      totalSessions: total,
    });
  } catch (err) {
    console.error("focus fetch failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/** Starts a session. Any previous unfinished session is abandoned. */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const parsed = startSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid session length" }, { status: 400 });

    await prisma.focusSession.deleteMany({ where: { userId: user.id, completedAt: null } });

    const session = await prisma.focusSession.create({
      data: { userId: user.id, minutes: parsed.data.minutes },
    });

    return NextResponse.json({ id: session.id, minutes: session.minutes, startedAt: session.startedAt });
  } catch (err) {
    console.error("focus start failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/** Abandons the in-flight session without paying out. */
export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    await prisma.focusSession.deleteMany({ where: { userId: user.id, completedAt: null } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("focus abandon failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/** Completes a session and pays out. Elapsed time is verified server-side. */
export async function PATCH(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const parsed = finishSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

    const existing = await prisma.focusSession.findUnique({ where: { id: parsed.data.id } });
    if (!existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (existing.userId !== sessionUser.id) {
      return NextResponse.json({ error: "Not your session" }, { status: 403 });
    }
    if (existing.completedAt) return NextResponse.json({ error: "Session already finished" }, { status: 409 });

    // The client cannot claim a session finished before its timer could have run.
    const elapsedMs = Date.now() - existing.startedAt.getTime();
    if (elapsedMs < existing.minutes * 60_000 * 0.9) {
      return NextResponse.json({ error: "Session is not finished yet" }, { status: 409 });
    }

    const minutes = existing.minutes;
    const xpGained = xpForMinutes(minutes);
    const goldGained = goldForMinutes(minutes);

    // Only the payout is atomic; the cascade runs afterwards.
    const core = await prisma.$transaction(
      async (tx) => {
        const claimed = await tx.focusSession.updateMany({
          where: { id: existing.id, completedAt: null },
          data: { completedAt: new Date() },
        });
        if (claimed.count === 0) return null;

        const user = await tx.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
        const progress = applyXp(user.level, user.xp, xpGained);

        const updated = await tx.user.update({
          where: { id: user.id },
          data: {
            level: progress.level,
            xp: progress.xp,
            gold: user.gold + goldGained,
            totalXpEarned: user.totalXpEarned + xpGained,
            focusMinutes: user.focusMinutes + minutes,
            lastActiveOn: todayUTC(),
          },
        });

        return { user: updated, leveledUp: progress.leveledUp, level: progress.level };
      },
      { timeout: 15000, maxWait: 10000 }
    );

    if (!core) return NextResponse.json({ error: "Session already finished" }, { status: 409 });

    const events: CascadeEvent[] = [];
    try {
      await recordActivity(prisma, core.user.id, { xp: xpGained, focusMinutes: minutes });
      events.push(...(await bumpChallenges(prisma, core.user.id, { focus: 1, xp: xpGained })));
      if (core.leveledUp) events.push(...(await grantLevelChest(prisma, core.user.id, core.level)));

      const bond = await addBond(prisma, core.user.id, "focusSession");
      events.push(...bond.events);

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
          bestCombo: core.user.comboCount,
        }))
      );
    } catch (err) {
      console.error("focus cascade failed (reward already granted)", err);
    }

    const finalUser = await prisma.user.findUniqueOrThrow({ where: { id: core.user.id } });

    return NextResponse.json({
      minutes,
      xpGained,
      goldGained,
      user: {
        level: finalUser.level,
        xp: finalUser.xp,
        xpToNext: XP_FOR_LEVEL(finalUser.level),
        gold: finalUser.gold,
      },
      leveledUp: core.leveledUp,
      events,
    });
  } catch (err) {
    console.error("focus finish failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
