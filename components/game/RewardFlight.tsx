"use client";

import { AnimatePresence, motion } from "framer-motion";
import { seeded } from "@/lib/motion";

export type Flight = {
  id: number;
  from: { x: number; y: number };
  toGold: { x: number; y: number };
  toXp: { x: number; y: number };
  xp: number;
  gold: number;
};

/**
 * Fixed-position overlay: XP number pops at the quest, then motes travel to
 * the XP bar and coins to the gold counter.
 */
export default function RewardFlight({
  flights,
  onDone,
}: {
  flights: Flight[];
  onDone: (id: number) => void;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]">
      <AnimatePresence>
        {flights.map((flight) => (
          <motion.div
            key={flight.id}
            className="absolute"
            style={{ left: flight.from.x, top: flight.from.y }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => onDone(flight.id)}
          >
            {/* XP number pop */}
            <motion.span
              className="absolute -translate-x-1/2 whitespace-nowrap font-display text-xl text-xp"
              style={{ textShadow: "0 0 16px rgba(76,230,207,.9)" }}
              initial={{ y: 0, opacity: 0, scale: 0.6 }}
              animate={{ y: -54, opacity: [0, 1, 1, 0], scale: [0.6, 1.25, 1, 0.9] }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            >
              +{flight.xp} XP
            </motion.span>

            {/* XP motes */}
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.span
                key={`x${i}`}
                className="absolute h-2 w-2 rounded-full bg-xp"
                style={{ boxShadow: "0 0 10px rgba(76,230,207,.95)" }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
                animate={{
                  x: [0, (seeded(i, 2) - 0.5) * 120, flight.toXp.x - flight.from.x],
                  y: [0, -50 - seeded(i, 3) * 50, flight.toXp.y - flight.from.y],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.4],
                }}
                transition={{ duration: 0.95, delay: i * 0.045, ease: "easeInOut" }}
              />
            ))}

            {/* coins */}
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.span
                key={`g${i}`}
                className="absolute grid h-4 w-4 place-items-center rounded-full text-[9px]"
                style={{
                  background: "linear-gradient(180deg,#ffd469,#ff972e)",
                  boxShadow: "0 0 12px rgba(255,180,60,.95)",
                }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{
                  x: [0, (seeded(i, 5) - 0.5) * 130, flight.toGold.x - flight.from.x],
                  y: [0, -40 - seeded(i, 6) * 60, flight.toGold.y - flight.from.y],
                  opacity: [0, 1, 0],
                  scale: [0.4, 1, 0.5],
                  rotate: [0, 260],
                }}
                transition={{ duration: 1.05, delay: 0.1 + i * 0.05, ease: "easeInOut" }}
              />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
