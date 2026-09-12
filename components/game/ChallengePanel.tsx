"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SPRING } from "@/lib/motion";

export type Challenge = {
  key: string;
  title: string;
  icon: string;
  target: number;
  gold: number;
  progress: number;
  complete: boolean;
};

export default function ChallengePanel({ challenges }: { challenges: Challenge[] | null }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-dim">Today&apos;s Challenges</h2>
        <span className="text-[10px] text-dim">resets daily</span>
      </div>

      {!challenges ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.05]" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {challenges.map((c) => {
            const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
            return (
              <li
                key={c.key}
                className="rounded-xl border px-3 py-2.5 transition-colors"
                style={{
                  borderColor: c.complete ? "rgba(76,230,207,.45)" : "rgba(255,255,255,.09)",
                  background: c.complete ? "rgba(76,230,207,.09)" : "rgba(255,255,255,.03)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="text-base leading-none">
                    {c.complete ? "✅" : c.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text">
                    {c.title}
                  </span>
                  <span className="shrink-0 text-[11px] font-bold text-gold">+{c.gold}🪙</span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div
                    role="progressbar"
                    aria-label={c.title}
                    aria-valuenow={c.progress}
                    aria-valuemin={0}
                    aria-valuemax={c.target}
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/40"
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: c.complete ? "var(--xp)" : "var(--gold)" }}
                      initial={false}
                      animate={{ width: `${pct}%` }}
                      transition={reduceMotion ? { duration: 0 } : SPRING.dramatic}
                    />
                  </div>
                  <span className="shrink-0 text-[10px] tabular-nums text-dim">
                    {c.progress}/{c.target}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
