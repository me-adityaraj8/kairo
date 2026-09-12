import { todayUTC } from "./engine";

export type ChallengeDef = {
  key: string;
  title: string;
  icon: string;
  target: number;
  gold: number;
  /** Which counter advances this challenge. */
  metric: "quests" | "xp" | "focus" | "hardQuests";
};

const POOL: ChallengeDef[] = [
  { key: "quests-3", title: "Complete 3 quests", icon: "📜", target: 3, gold: 40, metric: "quests" },
  { key: "quests-5", title: "Complete 5 quests", icon: "🗂️", target: 5, gold: 70, metric: "quests" },
  { key: "xp-200", title: "Earn 200 XP", icon: "✨", target: 200, gold: 50, metric: "xp" },
  { key: "xp-400", title: "Earn 400 XP", icon: "💫", target: 400, gold: 90, metric: "xp" },
  { key: "focus-1", title: "Finish a focus session", icon: "🧘", target: 1, gold: 45, metric: "focus" },
  { key: "focus-2", title: "Finish 2 focus sessions", icon: "🎯", target: 2, gold: 80, metric: "focus" },
  { key: "hard-1", title: "Complete an Epic or Legendary quest", icon: "⚔️", target: 1, gold: 60, metric: "hardQuests" },
];

export const CHALLENGE_BY_KEY = Object.fromEntries(POOL.map((c) => [c.key, c]));

/** Deterministic per user per day, so a refresh never reshuffles the board. */
export function challengesFor(userId: string, day = todayUTC()): ChallengeDef[] {
  let hash = 0;
  const seedText = `${userId}:${day}`;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
  }

  const picked: ChallengeDef[] = [];
  const pool = [...POOL];
  for (let i = 0; i < 3 && pool.length; i++) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    const [choice] = pool.splice(hash % pool.length, 1);
    picked.push(choice);
  }
  return picked;
}
