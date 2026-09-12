"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function XPBar({
  value,
  max,
  color = "var(--xp)",
  label,
}: {
  value: number;
  max: number;
  color?: string;
  label: string;
}) {
  const reduceMotion = useReducedMotion();
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className="h-4 w-full border-[3px] border-border bg-bg"
    >
      <motion.div
        className="h-full"
        style={{ backgroundColor: color }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 120, damping: 18 }
        }
      />
    </div>
  );
}
