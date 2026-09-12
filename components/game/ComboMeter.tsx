"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SPRING } from "@/lib/motion";

/** Only visible while a chain is actually alive. */
export default function ComboMeter({ count, multiplier }: { count: number; multiplier: number }) {
  const reduceMotion = useReducedMotion();
  const hot = multiplier >= 2;

  return (
    <AnimatePresence>
      {count > 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={SPRING.dramatic}
          className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5"
          style={{
            borderColor: hot ? "rgba(255,92,116,.6)" : "rgba(255,197,66,.45)",
            background: hot ? "rgba(255,92,116,.14)" : "rgba(255,197,66,.12)",
            boxShadow: hot ? "0 0 22px -8px rgba(255,92,116,.9)" : undefined,
          }}
        >
          <motion.span
            aria-hidden="true"
            className="text-sm leading-none"
            animate={reduceMotion ? undefined : { scale: hot ? [1, 1.25, 1] : [1, 1.1, 1] }}
            transition={{ duration: hot ? 0.7 : 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            ⚡
          </motion.span>
          <motion.span
            key={multiplier}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            transition={SPRING.dramatic}
            className="font-display text-xs"
            style={{ color: hot ? "var(--danger)" : "var(--gold)" }}
          >
            x{multiplier}
          </motion.span>
          <span className="sr-only">Combo multiplier {multiplier}, {count} in a row</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
