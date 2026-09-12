"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CHEST_META, ChestRarity } from "@/lib/chests";
import { RARITY, Rarity } from "@/lib/rarity";
import { burst } from "@/lib/motion";
import GameButton from "./GameButton";

export type ChestReward = {
  rarity: ChestRarity;
  label: string;
  gold: number;
  item: { slug: string; name: string; payload: string; rarity: string } | null;
};

type Phase = "SHAKE" | "BURST" | "REVEAL";

const SPARKS = burst(26, 240);

export default function ChestCeremony({
  pending,
  reward,
  onOpen,
  onClose,
  busy,
}: {
  pending: { id: string; rarity: string; source: string; label: string; tint: string } | null;
  reward: ChestReward | null;
  onOpen: () => void;
  onClose: () => void;
  busy: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("SHAKE");

  useEffect(() => {
    if (!reward) {
      setPhase("SHAKE");
      return;
    }
    setPhase("BURST");
    const t = setTimeout(() => setPhase("REVEAL"), reduceMotion ? 150 : 900);
    return () => clearTimeout(t);
  }, [reward, reduceMotion]);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, onClose]);

  if (!pending) return null;

  const tint = CHEST_META[pending.rarity as ChestRarity]?.tint ?? "#93a4bd";
  const itemRarity = reward?.item ? RARITY[reward.item.rarity as Rarity] : null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${pending.label} from ${pending.source}`}
        className="fixed inset-0 z-[85] grid place-items-center overflow-hidden px-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-deep/92 backdrop-blur-sm" />

        {/* rarity bloom */}
        <motion.div
          aria-hidden="true"
          className="absolute h-[420px] w-[420px] rounded-full"
          style={{ background: `radial-gradient(circle, ${tint}66 0%, transparent 68%)` }}
          animate={reduceMotion ? undefined : { scale: [0.9, 1.1, 0.9], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* burst */}
        {phase !== "SHAKE" &&
          !reduceMotion &&
          SPARKS.map((p, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="absolute h-2 w-2 rounded-full"
              style={{ background: tint, boxShadow: `0 0 12px ${tint}` }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.2 }}
              transition={{ duration: 1.3, delay: p.delay, ease: "easeOut" }}
            />
          ))}

        <div className="relative w-full max-w-sm text-center">
          <AnimatePresence mode="wait">
            {phase !== "REVEAL" ? (
              <motion.div key="chest" exit={{ scale: 0.5, opacity: 0 }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-dim">
                  {pending.source}
                </p>
                <p className="mt-1 font-display text-lg" style={{ color: tint }}>
                  {pending.label}
                </p>

                <motion.div
                  className="mx-auto mt-8 text-8xl"
                  animate={
                    reduceMotion
                      ? undefined
                      : busy || phase === "BURST"
                        ? { rotate: [0, -9, 9, -9, 9, 0], scale: [1, 1.08, 1] }
                        : { y: [0, -8, 0] }
                  }
                  transition={
                    busy || phase === "BURST"
                      ? { duration: 0.5, repeat: Infinity }
                      : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                  }
                >
                  🎁
                </motion.div>

                <div className="mt-10 flex justify-center gap-3">
                  <GameButton variant="ghost" onClick={onClose} disabled={busy}>
                    Later
                  </GameButton>
                  <GameButton variant="gold" onClick={onOpen} disabled={busy}>
                    {busy ? "Opening…" : "Open"}
                  </GameButton>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="reward"
                initial={reduceMotion ? { opacity: 0 } : { scale: 0.4, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 220, damping: 13 }}
              >
                {reward?.item && itemRarity && (
                  <>
                    <motion.p
                      className="text-[11px] font-extrabold uppercase tracking-[0.22em]"
                      style={{ color: itemRarity.color }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      {itemRarity.label}
                    </motion.p>

                    <motion.div
                      className="mx-auto mt-5 grid h-32 w-32 place-items-center rounded-3xl border"
                      style={{
                        borderColor: itemRarity.ring,
                        background: itemRarity.sheen,
                        boxShadow: `0 0 60px -10px ${itemRarity.color}`,
                      }}
                      animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span className="text-6xl">{reward.item.payload}</span>
                    </motion.div>

                    <p className="mt-4 font-display text-base text-text">{reward.item.name}</p>
                  </>
                )}

                {reward && !reward.item && (
                  <>
                    <p className="font-display text-lg text-gold">Coin Haul</p>
                    <div className="mx-auto mt-5 text-7xl">🪙</div>
                  </>
                )}

                {reward && reward.gold > 0 && (
                  <motion.p
                    className="mt-3 text-sm font-bold text-gold"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    +{reward.gold} gold
                  </motion.p>
                )}

                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <GameButton variant="gold" onClick={onClose}>
                    Collect
                  </GameButton>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
