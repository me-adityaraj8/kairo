export type Tier = {
  title: string;
  minLevel: number;
  tint: string;
  ring: string;
  aura: string;
  /** Number of orbiting motes around the avatar. */
  motes: number;
};

/** Visual identity changes with level, not just the number. */
export const TIERS: Tier[] = [
  {
    title: "Novice",
    minLevel: 1,
    tint: "#93a4bd",
    ring: "rgba(147,164,189,.5)",
    aura: "linear-gradient(160deg, rgba(147,164,189,.45) 0%, rgba(8,5,18,.85) 100%)",
    motes: 0,
  },
  {
    title: "Adventurer",
    minLevel: 10,
    tint: "#4c9ffe",
    ring: "rgba(76,159,254,.6)",
    aura: "linear-gradient(160deg, rgba(76,159,254,.5) 0%, rgba(8,5,18,.85) 100%)",
    motes: 3,
  },
  {
    title: "Veteran",
    minLevel: 25,
    tint: "#b15cff",
    ring: "rgba(177,92,255,.65)",
    aura: "linear-gradient(160deg, rgba(177,92,255,.55) 0%, rgba(8,5,18,.85) 100%)",
    motes: 5,
  },
  {
    title: "Elite",
    minLevel: 50,
    tint: "#ffb02e",
    ring: "rgba(255,176,46,.7)",
    aura: "linear-gradient(160deg, rgba(255,176,46,.55) 0%, rgba(60,20,5,.9) 100%)",
    motes: 7,
  },
  {
    title: "Legendary",
    minLevel: 100,
    tint: "#4ce6cf",
    ring: "rgba(76,230,207,.8)",
    aura: "linear-gradient(160deg, rgba(76,230,207,.5) 0%, rgba(255,176,46,.35) 55%, rgba(8,5,18,.9) 100%)",
    motes: 10,
  },
];

export function tierFor(level: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) if (level >= t.minLevel) current = t;
  return current;
}

export function nextTier(level: number): Tier | null {
  return TIERS.find((t) => t.minLevel > level) ?? null;
}
