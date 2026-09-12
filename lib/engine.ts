export const XP_FOR_LEVEL = (n: number) => Math.floor(100 * Math.pow(n, 1.5));

export const REWARD = {
  EASY: { xp: 10, gold: 5 },
  NORMAL: { xp: 25, gold: 12 },
  HARD: { xp: 60, gold: 30 },
  EPIC: { xp: 150, gold: 80 },
} as const;

export const todayUTC = () => new Date().toISOString().slice(0, 10);

export function applyXp(level: number, xp: number, gain: number) {
  let l = level;
  let x = xp + gain;
  let ups = 0;
  while (x >= XP_FOR_LEVEL(l)) {
    x -= XP_FOR_LEVEL(l);
    l++;
    ups++;
  }
  return { level: l, xp: x, leveledUp: ups > 0 };
}

export function nextStreak(lastActiveOn: string | null, today: string) {
  if (lastActiveOn === today) return { streak: null, sameDay: true };
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return { streak: lastActiveOn === yesterday ? "inc" : "reset", sameDay: false };
}

export function streakMultiplier(streak: number) {
  return 1 + Math.min(streak, 10) * 0.05;
}
