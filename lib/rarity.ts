import { Difficulty } from "./types";

export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

/** Stored difficulty values are unchanged; rarity is purely how they are presented. */
export const RARITY_FOR_DIFFICULTY: Record<Difficulty, Rarity> = {
  EASY: "COMMON",
  NORMAL: "RARE",
  HARD: "EPIC",
  EPIC: "LEGENDARY",
};

type RarityStyle = {
  label: Rarity;
  color: string;
  ring: string;
  glow: string;
  sheen: string;
  chip: string;
};

export const RARITY: Record<Rarity, RarityStyle> = {
  COMMON: {
    label: "COMMON",
    color: "var(--common)",
    ring: "rgba(147, 164, 189, 0.45)",
    glow: "rgba(147, 164, 189, 0.22)",
    sheen: "linear-gradient(135deg, rgba(147,164,189,0.16), transparent 60%)",
    chip: "text-common",
  },
  RARE: {
    label: "RARE",
    color: "var(--rare)",
    ring: "rgba(76, 159, 254, 0.55)",
    glow: "rgba(76, 159, 254, 0.3)",
    sheen: "linear-gradient(135deg, rgba(76,159,254,0.2), transparent 60%)",
    chip: "text-rare",
  },
  EPIC: {
    label: "EPIC",
    color: "var(--epic)",
    ring: "rgba(177, 92, 255, 0.6)",
    glow: "rgba(177, 92, 255, 0.34)",
    sheen: "linear-gradient(135deg, rgba(177,92,255,0.24), transparent 60%)",
    chip: "text-epic",
  },
  LEGENDARY: {
    label: "LEGENDARY",
    color: "var(--legendary)",
    ring: "rgba(255, 176, 46, 0.7)",
    glow: "rgba(255, 176, 46, 0.4)",
    sheen: "linear-gradient(135deg, rgba(255,176,46,0.28), transparent 60%)",
    chip: "text-legendary",
  },
};

export const rarityOf = (difficulty: Difficulty) => RARITY[RARITY_FOR_DIFFICULTY[difficulty]];

/** Reward preview shown on a quest card. Mirrors REWARD in lib/engine.ts. */
export const REWARD_PREVIEW: Record<Difficulty, { xp: number; gold: number }> = {
  EASY: { xp: 10, gold: 5 },
  NORMAL: { xp: 25, gold: 12 },
  HARD: { xp: 60, gold: 30 },
  EPIC: { xp: 150, gold: 80 },
};

const ICONS: Record<string, string> = {
  Intellect: "📖",
  Strength: "⚔️",
  Discipline: "🛡️",
  Vitality: "🌿",
};

export const attributeIcon = (name: string) => ICONS[name] ?? "✦";

/** Cost tiers map onto the same rarity ladder as quests. */
export function rarityForCost(cost: number): Rarity {
  if (cost >= 450) return "LEGENDARY";
  if (cost >= 250) return "EPIC";
  if (cost >= 120) return "RARE";
  return "COMMON";
}
