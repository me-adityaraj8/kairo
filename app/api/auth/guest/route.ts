import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { SPECIES } from "@/lib/characters";
import { todayUTC } from "@/lib/engine";
import { unlockAchievements } from "@/lib/progression";
import { stageIndex } from "@/lib/companion";

export const dynamic = "force-dynamic";

const ATTRIBUTES = ["Intellect", "Strength", "Discipline", "Vitality"];

/** Guest accounts are disposable. Anything older than this is swept up the
 *  next time someone starts a demo, so the table doesn't grow forever. */
const MAX_AGE_HOURS = 24;

const SAMPLE_QUESTS: { title: string; attribute: string; difficulty: "EASY" | "NORMAL" | "HARD" | "EPIC" }[] = [
  { title: "Read 20 pages", attribute: "Intellect", difficulty: "NORMAL" },
  { title: "Run 5k", attribute: "Strength", difficulty: "HARD" },
  { title: "Inbox to zero", attribute: "Discipline", difficulty: "EASY" },
  { title: "Ship the side project", attribute: "Intellect", difficulty: "EPIC" },
  { title: "Cook instead of ordering", attribute: "Vitality", difficulty: "NORMAL" },
];

async function sweepOldGuests() {
  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 3_600_000);
  await prisma.user.deleteMany({
    where: { provider: "guest", createdAt: { lt: cutoff } },
  });
}

export async function POST() {
  try {
    // Best effort — a failed sweep must never stop someone starting a demo.
    await sweepOldGuests().catch(() => {});

    const token = randomBytes(9).toString("hex");
    const email = `guest-${token}@kairo.demo`;
    const password = randomBytes(24).toString("hex");
    const species = SPECIES[Math.floor(Math.random() * SPECIES.length)];

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        displayName: "Guest",
        provider: "guest",
        // Mid-game state, so the HUD has something to show on arrival.
        level: 4,
        xp: 180,
        gold: 420,
        streak: 3,
        longestStreak: 3,
        lastActiveOn: todayUTC(),
        totalXpEarned: 1240,
        questsCompleted: 11,
        focusMinutes: 75,
        chestsOpened: 2,
        attributes: {
          create: ATTRIBUTES.map((name, i) => ({
            name,
            level: [3, 2, 3, 1][i],
            xp: [40, 15, 55, 30][i],
          })),
        },
        companion: { create: { species: species.id, name: species.name, bond: 120, stage: "ADVENTURER" } },
      },
      include: { attributes: true },
    });

    const byName = new Map(user.attributes.map((a) => [a.name, a.id]));
    await prisma.quest.createMany({
      data: SAMPLE_QUESTS.map((q) => ({
        userId: user.id,
        attributeId: byName.get(q.attribute)!,
        title: q.title,
        difficulty: q.difficulty,
      })),
    });

    /*
     * Catch the achievements those counters already earn. Without this the
     * account is internally inconsistent — the totals say eleven quests, but
     * nothing is unlocked — and the visitor's first completion sets off a
     * pile-up of five achievements at once. The chests they award are what
     * the demo starts with.
     */
    await unlockAchievements(prisma, user.id, {
      questsCompleted: user.questsCompleted,
      totalXpEarned: user.totalXpEarned,
      level: user.level,
      streak: user.streak,
      longestStreak: user.longestStreak,
      focusSessions: 3,
      focusMinutes: user.focusMinutes,
      chestsOpened: user.chestsOpened,
      itemsOwned: 0,
      companionStageIndex: stageIndex("ADVENTURER"),
      bestCombo: 3,
    }).catch(() => {});

    // Handed back so the client can sign in through the normal credentials
    // provider rather than this route minting a session of its own.
    return NextResponse.json({ email, password }, { status: 201 });
  } catch (err) {
    console.error("guest session failed", err);
    return NextResponse.json({ error: "Could not start the demo" }, { status: 500 });
  }
}
