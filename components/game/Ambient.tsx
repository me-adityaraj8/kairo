"use client";

import { useReducedMotion } from "framer-motion";
import { seeded } from "@/lib/motion";

/** Slow drifting motes. Purely decorative, disabled under reduced motion. */
export default function Ambient({ count = 18 }: { count?: number }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const left = seeded(i, 1) * 100;
        const size = 2 + seeded(i, 2) * 3;
        const duration = 12 + seeded(i, 3) * 16;
        const delay = seeded(i, 4) * -24;
        const gold = seeded(i, 5) > 0.55;

        return (
          <span
            key={i}
            className="absolute bottom-[-10%] rounded-full animate-drift"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              background: gold ? "var(--gold)" : "var(--xp)",
              boxShadow: `0 0 ${size * 3}px ${gold ? "rgba(255,197,66,.7)" : "rgba(76,230,207,.7)"}`,
              opacity: 0.5,
            }}
          />
        );
      })}
    </div>
  );
}
