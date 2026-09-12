"use client";

import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AMBIENTS } from "@/lib/ambient";
import { useAudio } from "./AudioProvider";
import { SPRING } from "@/lib/motion";

/** Layerable ambience for Focus Mode. Separate from game SFX. */
export default function FocusSounds({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const { mix, toggleAmbient, setAmbientLevel, stopAllAmbient, settings } = useAudio();

  const activeCount = Object.values(mix).filter((m) => m?.on).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={SPRING.snappy}
          className="panel absolute inset-x-0 bottom-full mb-3 max-h-[52vh] overflow-y-auto p-4"
          role="group"
          aria-label="Focus sounds"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-dim">
              Focus Sounds {activeCount > 0 && <span className="text-xp">· {activeCount} on</span>}
            </p>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button
                  onClick={stopAllAmbient}
                  className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-dim hover:text-danger"
                >
                  Stop all
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close focus sounds"
                className="rounded-lg px-2 py-1 text-dim hover:text-text"
              >
                ✕
              </button>
            </div>
          </div>

          {settings.muted && (
            <p className="mb-3 rounded-lg bg-danger/12 px-3 py-2 text-[11px] text-danger">
              Sound is muted in settings.
            </p>
          )}

          <ul className="flex flex-col gap-1.5">
            {AMBIENTS.map((a) => {
              const entry = mix[a.id];
              const on = !!entry?.on;
              const level = entry?.level ?? 0.5;

              return (
                <li key={a.id}>
                  <motion.div
                    className="relative rounded-xl border px-2.5 py-2 transition-colors"
                    animate={reduceMotion ? undefined : { scale: on ? 1.03 : 1 }}
                    whileHover={reduceMotion ? undefined : { scale: on ? 1.05 : 1.02 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    transition={SPRING.snappy}
                    style={{
                      borderColor: on ? `${a.tint}77` : "rgba(255,255,255,.08)",
                      background: on ? `${a.tint}14` : "rgba(255,255,255,.02)",
                    }}
                  >
                    {/*
                      The toggle covers the whole row but sits behind its
                      contents, because the volume slider can't live inside a
                      button. Everything above it ignores the pointer except
                      the slider, so a click anywhere else lands here.
                    */}
                    <button
                      onClick={() => toggleAmbient(a.id)}
                      aria-pressed={on}
                      aria-label={`${on ? "Stop" : "Play"} ${a.label}`}
                      className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2"
                      style={{ "--tw-ring-color": a.tint } as CSSProperties}
                    />

                    <div className="pointer-events-none relative z-10 flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base transition-colors"
                        style={{
                          background: on ? `${a.tint}2e` : "rgba(255,255,255,.05)",
                          boxShadow: on ? `0 0 16px -6px ${a.tint}` : undefined,
                        }}
                      >
                        <motion.span
                          animate={
                            on && !reduceMotion ? { scale: [1, 1.14, 1] } : { scale: 1 }
                          }
                          transition={{ duration: 2.4, repeat: on ? Infinity : 0, ease: "easeInOut" }}
                        >
                          {a.icon}
                        </motion.span>
                      </span>

                      <span
                        className="w-[72px] shrink-0 text-[12px] font-semibold"
                        style={{ color: on ? a.tint : "var(--text-dim)" }}
                      >
                        {a.label}
                      </span>

                      <input
                        type="range"
                        min={0.05}
                        max={1}
                        step={0.05}
                        value={level}
                        onChange={(e) => setAmbientLevel(a.id, Number(e.target.value))}
                        aria-label={`${a.label} volume`}
                        className="pointer-events-auto h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/12
                          [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:rounded-full"
                        style={{
                          opacity: on ? 1 : 0.4,
                          accentColor: a.tint,
                        }}
                      />

                      <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-dim">
                        {Math.round(level * 100)}
                      </span>
                    </div>

                    {/* level meter, animates only while playing */}
                    {on && !reduceMotion && (
                      <div className="pointer-events-none relative z-10 mt-1.5 flex h-3 items-end gap-0.5 pl-[42px]">
                        {Array.from({ length: 14 }).map((_, i) => (
                          <motion.span
                            key={i}
                            className="w-full rounded-sm"
                            style={{ background: a.tint, opacity: 0.5 }}
                            animate={{ height: [3, 3 + Math.random() * 9 * level, 3] }}
                            transition={{
                              duration: 0.9 + (i % 5) * 0.25,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: i * 0.05,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-[10px] leading-relaxed text-dim">
            Layer as many as you like. Levels are saved for next time.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
