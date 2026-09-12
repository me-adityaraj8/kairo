export type ChestRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export const CHEST_META: Record<ChestRarity, { label: string; tint: string; gold: [number, number] }> = {
  COMMON: { label: "Common Chest", tint: "#93a4bd", gold: [20, 45] },
  RARE: { label: "Rare Chest", tint: "#4c9ffe", gold: [50, 100] },
  EPIC: { label: "Epic Chest", tint: "#b15cff", gold: [110, 200] },
  LEGENDARY: { label: "Legendary Chest", tint: "#ffb02e", gold: [240, 420] },
};

/** Which item rarities a chest may contain, best first. */
export const CHEST_POOL: Record<ChestRarity, string[]> = {
  COMMON: ["COMMON"],
  RARE: ["RARE", "COMMON"],
  EPIC: ["EPIC", "RARE"],
  LEGENDARY: ["LEGENDARY", "EPIC"],
};

export function rollGold(rarity: ChestRarity) {
  const [min, max] = CHEST_META[rarity].gold;
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Streak milestones that award a chest, and what they award. */
export const STREAK_CHESTS: Record<number, ChestRarity> = {
  3: "COMMON",
  7: "RARE",
  14: "EPIC",
  30: "LEGENDARY",
  100: "LEGENDARY",
};

export function chestForLevel(level: number): ChestRarity | null {
  if (level % 25 === 0) return "LEGENDARY";
  if (level % 10 === 0) return "EPIC";
  if (level % 5 === 0) return "RARE";
  return "COMMON";
}
