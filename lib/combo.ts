/** Consecutive completions inside this window keep the chain alive. */
export const COMBO_WINDOW_MS = 30 * 60 * 1000;

const TIERS = [
  { at: 10, mult: 3 },
  { at: 5, mult: 2 },
  { at: 3, mult: 1.5 },
  { at: 2, mult: 1.2 },
] as const;

export function comboMultiplier(count: number) {
  for (const tier of TIERS) if (count >= tier.at) return tier.mult;
  return 1;
}

/** Next count and expiry given the stored window. */
export function advanceCombo(count: number, expiresAt: Date | null, now = new Date()) {
  const alive = expiresAt !== null && expiresAt.getTime() > now.getTime();
  const next = alive ? count + 1 : 1;
  return {
    count: next,
    expiresAt: new Date(now.getTime() + COMBO_WINDOW_MS),
    multiplier: comboMultiplier(next),
    reset: !alive && count > 1,
  };
}

/** Combo shown to a player who has not completed anything recently. */
export function readCombo(count: number, expiresAt: Date | null, now = new Date()) {
  const alive = expiresAt !== null && expiresAt.getTime() > now.getTime();
  return {
    count: alive ? count : 0,
    multiplier: alive ? comboMultiplier(count) : 1,
    expiresAt: alive ? expiresAt : null,
  };
}
