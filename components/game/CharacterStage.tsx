"use client";

import { motion, useReducedMotion } from "framer-motion";
import { seeded } from "@/lib/motion";
import { nextTier, tierFor } from "@/lib/evolution";
import { RARITY, Rarity } from "@/lib/rarity";
import Creature from "./Creature";
import type { Mood } from "@/lib/companion";

type Owned = { slug: string; payload: string; rarity?: string; slot?: string; equipped?: boolean };

/**
 * Hero centrepiece. The chosen companion stands here and reacts to what
 * happens; the plinth around it is driven by level tier, so progression shows
 * up as more than a number going up.
 */
export default function CharacterStage({
  displayName,
  level,
  owned,
  celebrate,
  species,
  mood,
  onInteract,
}: {
  displayName: string;
  level: number;
  owned: Owned[];
  celebrate: boolean;
  species?: string;
  mood?: Mood;
  onInteract?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const tier = tierFor(level);
  const upcoming = nextTier(level);

  const equipped = owned.filter((o) => o.equipped);
  const badges = equipped.length ? equipped : owned.slice(0, 6);

  return (
    <div className="relative flex flex-col items-center justify-end pb-2 pt-6">
      {/* floor light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 h-24 w-56 rounded-[50%] blur-2xl sm:w-72"
        style={{
          background: `radial-gradient(ellipse at center, ${tier.tint}55 0%, rgba(177,92,255,.16) 45%, transparent 72%)`,
        }}
      />

      {/* halo */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-2 h-52 w-52 rounded-full blur-2xl sm:h-64 sm:w-64"
        style={{
          background: `radial-gradient(circle, ${tier.tint}44 0%, rgba(76,159,254,.14) 50%, transparent 70%)`,
        }}
        animate={reduceMotion ? undefined : { opacity: [0.55, 0.9, 0.55], scale: [1, 1.06, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* tier motes: more of them at higher tiers */}
      {!reduceMotion &&
        Array.from({ length: tier.motes }).map((_, i) => {
          const angle = (i / Math.max(1, tier.motes)) * Math.PI * 2;
          const radius = 86;
          return (
            <motion.span
              key={i}
              aria-hidden="true"
              className="absolute h-1.5 w-1.5 rounded-full"
              style={{ top: "42%", background: tier.tint, boxShadow: `0 0 10px ${tier.tint}` }}
              animate={{
                x: [Math.cos(angle) * radius, Math.cos(angle + Math.PI) * radius, Math.cos(angle) * radius],
                y: [
                  Math.sin(angle) * radius * 0.34,
                  Math.sin(angle + Math.PI) * radius * 0.34,
                  Math.sin(angle) * radius * 0.34,
                ],
                opacity: [0.25, 0.9, 0.25],
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
          onClick={onInteract}
          role={onInteract ? "button" : undefined}
          tabIndex={onInteract ? 0 : undefined}
          onKeyDown={
            onInteract
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onInteract();
                  }
                }
              : undefined
          }
          aria-label={onInteract ? "Greet your companion" : undefined}
          className={`grid h-32 w-32 place-items-center rounded-[2rem] border sm:h-36 sm:w-36 ${
            onInteract ? "cursor-pointer" : ""
          }`}
          style={{
            borderColor: tier.ring,
            background: tier.aura,
            boxShadow: `0 0 42px -6px ${tier.tint}aa, 0 18px 40px -18px rgba(0,0,0,.95), inset 0 1px 0 rgba(255,255,255,.28)`,
          }}
        >
          <Creature
            species={species ?? "fox"}
            mood={celebrate ? "CELEBRATING" : mood ?? "IDLE"}
            size={116}
          />
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

      <p
        className="relative z-10 mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: tier.tint }}
      >
        {tier.title}
        {upcoming && <span className="ml-1.5 text-dim">→ {upcoming.title} at {upcoming.minLevel}</span>}
      </p>

      {badges.length > 0 && (
        <div className="relative z-10 mt-3 flex flex-wrap items-center justify-center gap-2">
          {badges.map((item, i) => {
            const rarity = item.rarity ? RARITY[item.rarity as Rarity] : null;
            return (
              <motion.span
                key={item.slug}
                title={`${item.slug}${item.equipped ? " (equipped)" : ""}`}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 260, damping: 16 }}
                className="grid h-9 w-9 place-items-center rounded-xl border text-lg backdrop-blur"
                style={{
                  borderColor: item.equipped ? rarity?.ring ?? "rgba(255,255,255,.4)" : "rgba(255,255,255,.15)",
                  background: item.equipped ? rarity?.glow ?? "rgba(255,255,255,.08)" : "rgba(255,255,255,.05)",
                  boxShadow: item.equipped && rarity ? `0 0 16px -4px ${rarity.color}` : undefined,
                }}
              >
                {item.payload}
              </motion.span>
            );
          })}
        </div>
      )}
    </div>
  );
}
