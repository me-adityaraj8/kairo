export type Difficulty = "EASY" | "NORMAL" | "HARD" | "EPIC";

export type Quest = {
  id: string;
  title: string;
  difficulty: Difficulty;
  attributeId: string;
  attributeName: string;
  done: boolean;
  completedAt: string | null;
  minutes?: number | null;
  dueOn?: string | null;
};

export type CharacterAttribute = {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
};

export type Character = {
  user: {
    displayName: string;
    level: number;
    xp: number;
    xpToNext: number;
    gold: number;
    streak: number;
    longestStreak?: number;
    combo?: { count: number; multiplier: number };
  };
  pendingChests?: number;
  attributes: CharacterAttribute[];
  owned: { slug: string; payload: string; rarity?: string; slot?: string; equipped?: boolean }[];
};

export type CompleteResult = {
  xpGained: number;
  goldGained: number;
  streak: number;
  user: { level: number; xp: number; xpToNext: number; gold: number };
  attribute: CharacterAttribute;
  leveledUp: boolean;
  attributeLeveledUp: boolean;
};
