import { Rarity } from "./rarity";

/** Everything an achievement is measured against. All values come from the database. */
export type PlayerStats = {
  questsCompleted: number;
  totalXpEarned: number;
  level: number;
  streak: number;
  longestStreak: number;
  focusSessions: number;
  focusMinutes: number;
  chestsOpened: number;
  itemsOwned: number;
  companionStageIndex: number;
  bestCombo: number;
};

export type AchievementDef = {
  key: string;
  title: string;
  description: string;
  icon: string;
  rarity: Rarity;
  target: number;
  value: (s: PlayerStats) => number;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first-quest", title: "First Steps", description: "Complete your first quest", icon: "🌱", rarity: "COMMON", target: 1, value: (s) => s.questsCompleted },
  { key: "quests-10", title: "Getting Serious", description: "Complete 10 quests", icon: "📜", rarity: "COMMON", target: 10, value: (s) => s.questsCompleted },
  { key: "quests-50", title: "Seasoned", description: "Complete 50 quests", icon: "⚔️", rarity: "RARE", target: 50, value: (s) => s.questsCompleted },
  { key: "quests-100", title: "Centurion", description: "Complete 100 quests", icon: "🏛️", rarity: "EPIC", target: 100, value: (s) => s.questsCompleted },

  { key: "xp-1000", title: "Thousand Club", description: "Earn 1,000 total XP", icon: "✨", rarity: "COMMON", target: 1000, value: (s) => s.totalXpEarned },
  { key: "xp-10000", title: "Ten Thousand", description: "Earn 10,000 total XP", icon: "💫", rarity: "EPIC", target: 10000, value: (s) => s.totalXpEarned },

  { key: "level-10", title: "Adventurer", description: "Reach level 10", icon: "🛡️", rarity: "RARE", target: 10, value: (s) => s.level },
  { key: "level-25", title: "Veteran", description: "Reach level 25", icon: "👑", rarity: "EPIC", target: 25, value: (s) => s.level },
  { key: "level-50", title: "Elite", description: "Reach level 50", icon: "🔥", rarity: "LEGENDARY", target: 50, value: (s) => s.level },

  { key: "streak-3", title: "Warming Up", description: "Hold a 3 day streak", icon: "🔥", rarity: "COMMON", target: 3, value: (s) => s.longestStreak },
  { key: "streak-7", title: "One Week Strong", description: "Hold a 7 day streak", icon: "🔥", rarity: "RARE", target: 7, value: (s) => s.longestStreak },
  { key: "streak-30", title: "Unbreakable", description: "Hold a 30 day streak", icon: "🌟", rarity: "LEGENDARY", target: 30, value: (s) => s.longestStreak },

  { key: "focus-1", title: "Deep Breath", description: "Finish your first focus session", icon: "🧘", rarity: "COMMON", target: 1, value: (s) => s.focusSessions },
  { key: "focus-10", title: "In The Zone", description: "Finish 10 focus sessions", icon: "🎯", rarity: "RARE", target: 10, value: (s) => s.focusSessions },
  { key: "focus-600", title: "Ten Hours Deep", description: "Focus for 600 minutes total", icon: "⏳", rarity: "EPIC", target: 600, value: (s) => s.focusMinutes },

  { key: "combo-5", title: "On A Roll", description: "Reach a x2 combo", icon: "⚡", rarity: "RARE", target: 5, value: (s) => s.bestCombo },
  { key: "combo-10", title: "Unstoppable", description: "Reach a x3 combo", icon: "🌀", rarity: "EPIC", target: 10, value: (s) => s.bestCombo },

  { key: "chest-1", title: "Treasure Hunter", description: "Open your first chest", icon: "🎁", rarity: "COMMON", target: 1, value: (s) => s.chestsOpened },
  { key: "collector-5", title: "Collector", description: "Own 5 items", icon: "🧰", rarity: "RARE", target: 5, value: (s) => s.itemsOwned },
  { key: "companion-guardian", title: "Bonded", description: "Evolve your companion to Guardian", icon: "🐾", rarity: "EPIC", target: 3, value: (s) => s.companionStageIndex },
];

export function evaluate(stats: PlayerStats) {
  return ACHIEVEMENTS.map((def) => {
    const value = Math.max(0, def.value(stats));
    return {
      key: def.key,
      title: def.title,
      description: def.description,
      icon: def.icon,
      rarity: def.rarity,
      target: def.target,
      progress: Math.min(value, def.target),
      complete: value >= def.target,
    };
  });
}
