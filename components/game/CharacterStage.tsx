"use client";

import { motion, useReducedMotion } from "framer-motion";
import { seeded } from "@/lib/motion";

/**
 * Hero centrepiece: an avatar on a lit pedestal that breathes, floats and
 * carries whatever the player has bought as orbiting trophies.
 */
export default function CharacterStage({
  displayName,
  level,
  owned,
  celebrate,
}: {
  displayName: string;
  level: number;
  owned: { slug: string; payload: string }[];
  celebrate: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const initial = displayName.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="relative flex flex-col items-center justify-end pb-2 pt-6">
      {/* floor light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 h-24 w-56 rounded-[50%] blur-2xl sm:w-72"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,197,66,.38) 0%, rgba(177,92,255,.16) 45%, transparent 72%)",
        }}
      />

      {/* halo */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-2 h-52 w-52 rounded-full blur-2xl sm:h-64 sm:w-64"
        style={{
          background:
            "radial-gradient(circle, rgba(177,92,255,.34) 0%, rgba(76,159,254,.14) 50%, transparent 70%)",
        }}
        animate={reduceMotion ? undefined : { opacity: [0.55, 0.9, 0.55], scale: [1, 1.06, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* orbiting sparks */}
      {!reduceMotion &&
        Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const radius = 86;
          return (
            <motion.span
              key={i}
              aria-hidden="true"
              className="absolute h-1.5 w-1.5 rounded-full bg-gold"
              style={{ top: "42%", boxShadow: "0 0 10px rgba(255,197,66,.9)" }}
              animate={{
                x: [Math.cos(angle) * radius, Math.cos(angle + Math.PI) * radius, Math.cos(angle) * radius],
                y: [
                  Math.sin(angle) * radius * 0.34,
                  Math.sin(angle + Math.PI) * radius * 0.34,
                  Math.sin(angle) * radius * 0.34,
                ],
                opacity: [0.25, 0.85, 0.25],
              }}
              transition={{ duration: 9 + seeded(i, 2) * 5, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}

      {/* avatar */}
      <motion.div
        className="relative z-10"
        animate={reduceMotion ? undefined : { y: [0, -9, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          animate={
            celebrate && !reduceMotion
              ? { scale: [1, 1.16, 1], rotate: [0, -3, 3, 0] }
              : reduceMotion
                ? undefined
                : { scale: [1, 1.035, 1] }
          }
          transition={
            celebrate
              ? { duration: 0.8, ease: "easeOut" }
              : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
          }
          className="grid h-32 w-32 place-items-center rounded-[2rem] border border-white/20 sm:h-36 sm:w-36"
          style={{
            background:
              "linear-gradient(160deg, rgba(177,92,255,.55) 0%, rgba(76,159,254,.32) 45%, rgba(8,5,18,.85) 100%)",
            boxShadow:
              "0 0 42px -6px rgba(177,92,255,.65), 0 18px 40px -18px rgba(0,0,0,.95), inset 0 1px 0 rgba(255,255,255,.28)",
          }}
        >
          <span className="font-display text-5xl text-text drop-shadow-[0_3px_10px_rgba(0,0,0,.6)] sm:text-6xl">
            {initial}
          </span>
        </motion.div>

        {/* level medallion */}
        <motion.div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1"
          style={{
            background: "linear-gradient(180deg,#ffd469,#ff972e)",
            boxShadow: "0 6px 18px -6px rgba(255,160,50,.95)",
          }}
          animate={celebrate && !reduceMotion ? { scale: [1, 1.3, 1] } : undefined}
          transition={{ duration: 0.6 }}
        >
          <span className="font-display text-xs text-deep">LV {level}</span>
        </motion.div>
      </motion.div>

      <p className="relative z-10 mt-6 max-w-full truncate px-4 text-center font-display text-lg text-text sm:text-xl">
        {displayName}
      </p>

      {owned.length > 0 && (
        <div className="relative z-10 mt-3 flex flex-wrap items-center justify-center gap-2">
          {owned.map((item, i) => (
            <motion.span
              key={item.slug}
              title={item.slug}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 260, damping: 16 }}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/8 text-lg backdrop-blur"
            >
              {item.payload}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
}
