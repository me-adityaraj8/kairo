"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Mood, companionLine, stageMeta } from "@/lib/companion";
import { SPRING } from "@/lib/motion";
import Creature from "./Creature";

export type CompanionState = {
  name: string;
  species: string;
  personality: string;
  stage: string;
  stageTitle: string;
  face: string;
  tint: string;
  bond: number;
  nextStage: { stage: string; title: string; bond: number } | null;
  mood: Mood;
};

/** Per-mood body language. The companion is never simply static. */
const BODY: Record<Mood, { y: number[]; rotate: number[]; scale: number[]; duration: number }> = {
  IDLE: { y: [0, -6, 0], rotate: [0, 2, -2, 0], scale: [1, 1, 1], duration: 3.6 },
  HAPPY: { y: [0, -12, 0], rotate: [0, 6, -6, 0], scale: [1, 1.06, 1], duration: 1.4 },
  EXCITED: { y: [0, -22, 0, -12, 0], rotate: [0, 10, -10, 0], scale: [1, 1.12, 1], duration: 0.9 },
  FOCUSED: { y: [0, -2, 0], rotate: [0, 0, 0], scale: [1, 1.02, 1], duration: 5 },
  CELEBRATING: { y: [0, -28, 0, -18, 0], rotate: [0, 16, -16, 0], scale: [1, 1.2, 1], duration: 0.8 },
  SLEEPY: { y: [0, -3, 0], rotate: [0, -4, 0], scale: [1, 0.98, 1], duration: 5.5 },
  STARSTRUCK: { y: [0, -16, 0], rotate: [0, -8, 8, 0], scale: [1, 1.15, 1], duration: 1.1 },
};

export default function Companion({
  state,
  reaction,
  chaos,
  onInteract,
}: {
  state: CompanionState;
  reaction: Mood | null;
  chaos: boolean;
  onInteract: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [speech, setSpeech] = useState<string | null>(null);
  const [wander, setWander] = useState({ x: 0, y: 0 });
  const speechTimer = useRef<ReturnType<typeof setTimeout>>();

  const mood: Mood = reaction ?? state.mood;
  const body = BODY[mood] ?? BODY.IDLE;
  const meta = stageMeta(state.stage);

  // speak on mood change
  useEffect(() => {
    setSpeech(companionLine(state.personality, mood, Date.now()));
    clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setSpeech(null), 3600);
    return () => clearTimeout(speechTimer.current);
  }, [mood, state.personality]);

  // chaos mode: drift around its corner
  useEffect(() => {
    if (!chaos || reduceMotion) {
      setWander({ x: 0, y: 0 });
      return;
    }
    const id = setInterval(() => {
      setWander({ x: (Math.random() - 0.5) * 46, y: (Math.random() - 0.5) * 26 });
    }, 1800);
    return () => clearInterval(id);
  }, [chaos, reduceMotion]);

  const progress = state.nextStage
    ? Math.min(100, Math.round((state.bond / state.nextStage.bond) * 100))
    : 100;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-36 w-full items-end justify-center">
        {/* speech bubble */}
        <AnimatePresence>
          {speech && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={SPRING.snappy}
              className="absolute top-0 z-10 max-w-[15rem]"
            >
              <div className="rounded-2xl border border-white/15 bg-deep/95 px-3 py-2 text-center text-[12px] leading-snug text-text shadow-lg backdrop-blur">
                {speech}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* glow pad */}
        <div
          aria-hidden="true"
          className="absolute bottom-2 h-10 w-28 rounded-[50%] blur-xl"
          style={{ background: meta.tint, opacity: 0.35 }}
        />

        {/* the companion */}
        <motion.button
          onClick={onInteract}
          aria-label={`${state.name}, your companion. Tap to interact.`}
          className="relative rounded-full focus-visible:outline-none"
          animate={
            reduceMotion
              ? undefined
              : { y: body.y, rotate: body.rotate, scale: body.scale, x: wander.x }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: body.duration, repeat: Infinity, ease: "easeInOut" }
          }
          whileTap={{ scale: 0.88 }}
        >
          <Creature species={state.species} mood={mood} size={84} />

          {/* celebration sparks */}
          {!reduceMotion && (mood === "CELEBRATING" || mood === "EXCITED" || mood === "STARSTRUCK") && (
            <>
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                return (
                  <motion.span
                    key={i}
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
                    style={{ background: meta.tint, boxShadow: `0 0 8px ${meta.tint}` }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{ x: Math.cos(angle) * 54, y: Math.sin(angle) * 54, opacity: 0 }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.06 }}
                  />
                );
              })}
            </>
          )}
        </motion.button>
      </div>

      {/* identity + bond */}
      <div className="w-full text-center">
        <p className="text-sm font-bold text-text">{state.name}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: meta.tint }}>
          {state.stageTitle}
        </p>

        <div className="mt-2.5">
          <div
            role="progressbar"
            aria-label={`Bond with ${state.name}`}
            aria-valuenow={state.bond}
            aria-valuemin={0}
            aria-valuemax={state.nextStage?.bond ?? state.bond}
            className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/40"
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: meta.tint, boxShadow: `0 0 10px ${meta.tint}` }}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={reduceMotion ? { duration: 0 } : SPRING.dramatic}
            />
          </div>
          <p className="mt-1 text-[10px] text-dim">
            {state.nextStage
              ? `${state.bond} / ${state.nextStage.bond} bond → ${state.nextStage.title}`
              : "Fully evolved"}
          </p>
        </div>
      </div>
    </div>
  );
}
