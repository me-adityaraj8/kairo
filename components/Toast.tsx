"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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
          initial={reduceMotion ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 border-[3px] border-danger bg-panel px-4 py-3">
            <p className="font-mono text-xs text-text">{message}</p>
            <button
              onClick={onDismiss}
              aria-label="Dismiss message"
              className="font-pixel text-[10px] text-muted hover:text-text"
            >
              X
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
