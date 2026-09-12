import type { Transition, Variants } from "framer-motion";

/**
 * Three intensities so not every interaction explodes:
 * subtle = ambient/idle, snappy = interaction feedback, dramatic = major events.
 */
export const SPRING: Record<"subtle" | "snappy" | "dramatic", Transition> = {
  subtle: { type: "spring", stiffness: 90, damping: 20 },
  snappy: { type: "spring", stiffness: 420, damping: 26, mass: 0.6 },
  dramatic: { type: "spring", stiffness: 190, damping: 13, mass: 0.9 },
};

export const pressable = {
  whileHover: { y: -2, scale: 1.02 },
  whileTap: { y: 1, scale: 0.97 },
  transition: SPRING.snappy,
};

export const riseIn: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: SPRING.subtle },
};

export const stagger = (gap = 0.06): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap } },
});

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  show: { opacity: 1, scale: 1, transition: SPRING.dramatic },
};

/**
 * Deterministic pseudo-random so server and client markup agree.
 * Rounded because Math.sin's last bits can differ between Node and browsers,
 * which is enough to trip React hydration warnings on inline styles.
 */
export function seeded(index: number, salt = 1) {
  const value = Math.sin((index + 1) * 12.9898 * salt) * 43758.5453;
  return Math.round((value - Math.floor(value)) * 1e5) / 1e5;
}

/** Even radial spread for particle bursts. */
export function burst(count: number, radius: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const spread = 0.65 + seeded(i, 3) * 0.6;
    return {
      x: Math.cos(angle) * radius * spread,
      y: Math.sin(angle) * radius * spread,
      delay: seeded(i, 7) * 0.12,
    };
  });
}
