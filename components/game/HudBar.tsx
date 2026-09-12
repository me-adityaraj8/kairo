"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SPRING } from "@/lib/motion";
import Counter from "./Counter";

export default function HudBar({
  level,
  xp,
  xpToNext,
  gold,
  streak,
  goldAnchorRef,
  xpAnchorRef,
}: {
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  streak: number;
  goldAnchorRef?: React.Ref<HTMLDivElement>;
  xpAnchorRef?: React.Ref<HTMLDivElement>;
}) {
  const reduceMotion = useReducedMotion();
  const pct = xpToNext > 0 ? Math.min(100, (xp / xpToNext) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div ref={xpAnchorRef} className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-dim">
              Experience
            </span>
            <span className="font-display text-[11px] text-xp text-glow-xp">
              {xp}/{xpToNext}
            </span>
          </div>

          <div
            role="progressbar"
            aria-label={`Experience: ${xp} of ${xpToNext}`}
            aria-valuenow={xp}
            aria-valuemin={0}
            aria-valuemax={xpToNext}
            className="relative h-3.5 w-full overflow-hidden rounded-full border border-white/12 bg-black/45"
          >
            <motion.div
              className="relative h-full rounded-full"
              style={{
                background: "linear-gradient(90deg,#17b4c6,#5ef0d9)",
                boxShadow: "0 0 16px rgba(76,230,207,.75)",
              }}
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={reduceMotion ? { duration: 0 } : SPRING.dramatic}
            >
              {!reduceMotion && (
                <span className="absolute inset-0 overflow-hidden rounded-full">
                  <span className="absolute inset-y-0 -left-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Stat
          anchorRef={goldAnchorRef}
          icon="🪙"
          value={<Counter value={gold} />}
          label="Gold"
          tint="rgba(255,197,66,.16)"
          border="rgba(255,197,66,.35)"
        />
        <Stat
          icon="🔥"
          value={<span className="font-display text-sm text-text">{streak}</span>}
          label={streak === 1 ? "Day" : "Days"}
          tint="rgba(255,92,116,.16)"
          border="rgba(255,92,116,.35)"
        />
        <Stat
          icon="⭐"
          value={<span className="font-display text-sm text-text">{level}</span>}
          label="Level"
          tint="rgba(177,92,255,.16)"
          border="rgba(177,92,255,.35)"
        />
      </div>
    </div>
  );
}

const Stat = ({
  anchorRef,
  icon,
  value,
  label,
  tint,
  border,
}: {
  anchorRef?: React.Ref<HTMLDivElement>;
  icon: string;
  value: React.ReactNode;
  label: string;
  tint: string;
  border: string;
}) => (
  <div
    ref={anchorRef}
    className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-2.5 py-2 backdrop-blur"
    style={{ background: tint, borderColor: border }}
  >
    <span aria-hidden="true" className="text-base leading-none">
      {icon}
    </span>
    <span className="min-w-0 leading-tight">
      <span className="block truncate">{value}</span>
      <span className="block text-[10px] uppercase tracking-wider text-dim">{label}</span>
    </span>
  </div>
);
