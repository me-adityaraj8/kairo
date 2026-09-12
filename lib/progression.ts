import type { Prisma, PrismaClient } from "@prisma/client";
import { XP_FOR_LEVEL, applyXp, todayUTC } from "./engine";
import { ACHIEVEMENTS, PlayerStats } from "./achievements";
import { challengesFor } from "./challenges";
import { BOND, stageForBond } from "./companion";
import { ChestRarity, STREAK_CHESTS, chestForLevel } from "./chests";

/** These helpers run either inside a transaction or directly on the client. */
type Tx = Prisma.TransactionClient | PrismaClient;

export type CascadeEvent =
  | { type: "CHALLENGE"; key: string; title: string; gold: number }
  | { type: "ACHIEVEMENT"; key: string; title: string; icon: string; rarity: string }
  | { type: "CHEST"; rarity: ChestRarity; source: string }
  | { type: "COMPANION_EVOLVED"; stage: string };

/** Advances daily challenges for the metrics this action touched. */
export async function bumpChallenges(
  tx: Tx,
  userId: string,
  deltas: Partial<Record<"quests" | "xp" | "focus" | "hardQuests", number>>
) {
  const day = todayUTC();
  const defs = challengesFor(userId, day).filter((d) => (deltas[d.metric] ?? 0) > 0);
  if (!defs.length) return [];

  // the three challenges are independent, so advance them together
  const rows = await Promise.all(
    defs.map((def) =>
      tx.dailyChallenge.upsert({
        where: { userId_day_key: { userId, day, key: def.key } },
        update: { progress: { increment: deltas[def.metric] ?? 0 } },
        create: { userId, day, key: def.key, target: def.target, progress: deltas[def.metric] ?? 0 },
      })
    )
  );

  const finished = defs.filter((def, i) => rows[i].progress >= def.target && !rows[i].claimed);
  if (!finished.length) return [];

  const goldTotal = finished.reduce((sum, def) => sum + def.gold, 0);

  await Promise.all([
    ...finished.map((def) =>
      tx.dailyChallenge.update({
        where: { id: rows[defs.indexOf(def)].id },
        data: { claimed: true },
      })
    ),
    tx.user.update({ where: { id: userId }, data: { gold: { increment: goldTotal } } }),
    tx.chest.createMany({
      data: finished.map((def) => ({ userId, rarity: "RARE", source: `Daily: ${def.title}` })),
    }),
  ]);

  return finished.flatMap((def) => [
    { type: "CHALLENGE", key: def.key, title: def.title, gold: def.gold } as CascadeEvent,
    { type: "CHEST", rarity: "RARE", source: "Daily challenge" } as CascadeEvent,
  ]);
}

/** Unlocks any achievement whose real condition is now met. */
export async function unlockAchievements(tx: Tx, userId: string, stats: PlayerStats) {
  const already = await tx.userAchievement.findMany({ where: { userId }, select: { key: true } });
  const have = new Set(already.map((a) => a.key));

  const earned = ACHIEVEMENTS.filter((def) => !have.has(def.key) && def.value(stats) >= def.target);
  if (!earned.length) return [];

  const chestRarity = (r: string) => (r === "LEGENDARY" ? "LEGENDARY" : "EPIC");

  // createMany with skipDuplicates keeps this safe if two requests race
  await Promise.all([
    tx.userAchievement.createMany({
      data: earned.map((def) => ({ userId, key: def.key })),
      skipDuplicates: true,
    }),
    tx.chest.createMany({
      data: earned.map((def) => ({
        userId,
        rarity: chestRarity(def.rarity),
        source: `Achievement: ${def.title}`,
      })),
    }),
  ]);

  return earned.flatMap((def) => [
    {
      type: "ACHIEVEMENT",
      key: def.key,
      title: def.title,
      icon: def.icon,
      rarity: def.rarity,
    } as CascadeEvent,
    { type: "CHEST", rarity: chestRarity(def.rarity), source: "Achievement" } as CascadeEvent,
  ]);
}

/** Adds bond and evolves the companion when it crosses a stage threshold. */
export async function addBond(tx: Tx, userId: string, amount: keyof typeof BOND | number) {
  const gain = typeof amount === "number" ? amount : BOND[amount];
  const companion = await tx.companion.findUnique({ where: { userId } });
  if (!companion) return { events: [] as CascadeEvent[], companion: null };

  const bond = companion.bond + gain;
  const stage = stageForBond(bond);
  const evolved = stage !== companion.stage;

  const updated = await tx.companion.update({
    where: { userId },
    data: { bond, stage, lastInteracted: new Date() },
  });

  return {
    companion: updated,
    events: evolved ? [{ type: "COMPANION_EVOLVED", stage } as CascadeEvent] : [],
  };
}

/** Records a day's activity for the streak heatmap. */
export async function recordActivity(
  tx: Tx,
  userId: string,
  deltas: { quests?: number; xp?: number; focusMinutes?: number }
) {
  const day = todayUTC();
  await tx.activityDay.upsert({
    where: { userId_day: { userId, day } },
    update: {
      quests: { increment: deltas.quests ?? 0 },
      xp: { increment: deltas.xp ?? 0 },
      focusMinutes: { increment: deltas.focusMinutes ?? 0 },
    },
    create: {
      userId,
      day,
      quests: deltas.quests ?? 0,
      xp: deltas.xp ?? 0,
      focusMinutes: deltas.focusMinutes ?? 0,
    },
  });
}

export async function grantStreakChest(tx: Tx, userId: string, streak: number) {
  const rarity = STREAK_CHESTS[streak];
  if (!rarity) return [];
  await tx.chest.create({ data: { userId, rarity, source: `${streak} day streak` } });
  return [{ type: "CHEST", rarity, source: `${streak} day streak` } as CascadeEvent];
}

export async function grantLevelChest(tx: Tx, userId: string, level: number) {
  const rarity = chestForLevel(level);
  if (!rarity) return [];
  await tx.chest.create({ data: { userId, rarity, source: `Level ${level}` } });
  return [{ type: "CHEST", rarity, source: `Level ${level}` } as CascadeEvent];
}

export { XP_FOR_LEVEL, applyXp };
