"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  return { x: Math.cos(angle) * 160, y: Math.sin(angle) * 160 };
});

export default function LevelUpOverlay({
  level,
  onDismiss,
}: {
  level: number | null;
  onDismiss: () => void;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (level === null) return;
    const timer = setTimeout(onDismiss, 2000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [level, onDismiss]);

  return (
    <AnimatePresence>
      {level !== null && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          {!reduceMotion &&
            PARTICLES.map((p, i) => (
              <motion.span
                key={i}
                className="absolute h-2 w-2 bg-gold"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ x: p.x, y: p.y, opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            ))}
          <motion.div
            initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 14 }}
            className="border-[3px] border-gold bg-panel px-10 py-8 text-center"
          >
            <p className="font-pixel text-sm text-gold">LEVEL UP</p>
            <p className="mt-4 font-pixel text-3xl text-text">{level}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
