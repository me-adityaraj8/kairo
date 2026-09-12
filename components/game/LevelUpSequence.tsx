"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { burst } from "@/lib/motion";

export type LevelUpPayload = {
  level: number;
  attributeName: string;
  attributeLevel: number;
  gold: number;
};

const RING = burst(22, 210);

export default function LevelUpSequence({
  payload,
  onDismiss,
}: {
  payload: LevelUpPayload | null;
  onDismiss: () => void;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!payload) return;
    const timer = setTimeout(onDismiss, reduceMotion ? 1600 : 3400);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDismiss();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [payload, onDismiss, reduceMotion]);

  return (
    <AnimatePresence>
      {payload && (
        <motion.div
          role="dialog"
          aria-label={`Level ${payload.level} reached`}
          className="fixed inset-0 z-[80] grid place-items-center overflow-hidden px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          {/* dim + light bloom */}
          <div className="absolute inset-0 bg-deep/88 backdrop-blur-sm" />
          <motion.div
            aria-hidden="true"
            className="absolute h-[420px] w-[420px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,197,66,.55) 0%, rgba(177,92,255,.28) 40%, transparent 68%)",
            }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.5, 1.15], opacity: [0, 1, 0.55] }}
            transition={{ duration: 1.3, ease: "easeOut" }}
          />

          {/* shockwave */}
          {!reduceMotion && (
            <motion.span
              aria-hidden="true"
              className="absolute rounded-full border-2 border-gold"
              initial={{ width: 0, height: 0, opacity: 0.9 }}
              animate={{ width: 620, height: 620, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          )}

          {/* particle explosion */}
          {!reduceMotion &&
            RING.map((p, i) => (
              <motion.span
                key={i}
                aria-hidden="true"
                className="absolute h-2.5 w-2.5 rounded-full"
                style={{
                  background: i % 3 === 0 ? "var(--xp)" : "var(--gold)",
                  boxShadow: `0 0 12px ${i % 3 === 0 ? "rgba(76,230,207,.9)" : "rgba(255,197,66,.9)"}`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.2 }}
                transition={{ duration: 1.4, delay: p.delay, ease: "easeOut" }}
              />
            ))}

          {/* plate */}
          <motion.div
            className="relative w-full max-w-sm text-center"
            initial={reduceMotion ? { opacity: 0 } : { scale: 0.3, opacity: 0, rotateX: -40 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            transition={
              reduceMotion
                ? { duration: 0.2 }
                : { type: "spring", stiffness: 210, damping: 12, delay: 0.15 }
            }
          >
            <motion.p
              className="font-display text-2xl tracking-wide text-gold text-glow-gold sm:text-3xl"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              LEVEL UP!
            </motion.p>

            <motion.div
              className="relative mx-auto mt-4 grid h-32 w-32 place-items-center rounded-[2rem] border border-gold/50"
              style={{
                background: "linear-gradient(160deg, rgba(255,197,66,.28), rgba(8,5,18,.9))",
                boxShadow: "0 0 60px -10px rgba(255,180,60,.85)",
              }}
              initial={reduceMotion ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0.2 }
                  : { type: "spring", stiffness: 260, damping: 11, delay: 0.5 }
              }
            >
              <span className="font-display text-6xl text-text text-glow-gold">{payload.level}</span>
            </motion.div>

            {/* reward cards reveal */}
            <motion.div
              className="mt-6 flex flex-wrap items-center justify-center gap-2"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.85 } } }}
            >
              <RewardCard label={`${payload.attributeName} Lv ${payload.attributeLevel}`} tint="var(--epic)" />
              <RewardCard label={`${payload.gold} Gold`} tint="var(--gold)" />
            </motion.div>

            <motion.p
              className="mt-6 text-xs text-dim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const RewardCard = ({ label, tint }: { label: string; tint: string }) => (
  <motion.span
    variants={{
      hidden: { opacity: 0, y: 22, scale: 0.7 },
      show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 15 } },
    }}
    className="rounded-xl border px-3.5 py-2 text-xs font-bold backdrop-blur"
    style={{ color: tint, borderColor: tint, background: "rgba(255,255,255,.06)" }}
  >
    {label}
  </motion.span>
);
