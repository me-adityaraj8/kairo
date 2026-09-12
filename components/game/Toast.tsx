"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SPRING } from "@/lib/motion";

export default function Toast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { y: 40, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: 24, opacity: 0, scale: 0.95 }}
          transition={SPRING.snappy}
          className="fixed inset-x-4 bottom-24 z-[70] mx-auto max-w-sm lg:bottom-8"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-danger/40 bg-deep/95 px-4 py-3 shadow-[0_18px_40px_-18px_rgba(0,0,0,.95)] backdrop-blur-xl">
            <span aria-hidden="true" className="text-lg">
              ⚠️
            </span>
            <p className="min-w-0 flex-1 text-sm text-text">{message}</p>
            <button
              onClick={onDismiss}
              aria-label="Dismiss message"
              className="rounded-lg px-2 py-1 text-dim transition-colors hover:bg-white/10 hover:text-text"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
