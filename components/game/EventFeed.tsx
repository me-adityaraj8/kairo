"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SPRING } from "@/lib/motion";

export type GameEvent = {
  id: number;
  icon: string;
  text: string;
  tint: string;
};

/** Stacked toasts for the cascade. Capped so a big chain cannot spam the screen. */
export default function EventFeed({ events }: { events: GameEvent[] }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-3 top-3 z-[65] flex w-[15rem] flex-col gap-2 sm:right-5 sm:top-5"
    >
      <AnimatePresence initial={false}>
        {events.slice(-4).map((e) => (
          <motion.div
            key={e.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.92 }}
            transition={SPRING.snappy}
            className="flex items-center gap-2.5 rounded-xl border bg-deep/92 px-3 py-2 backdrop-blur"
            style={{ borderColor: `${e.tint}66`, boxShadow: `0 0 22px -12px ${e.tint}` }}
          >
            <span className="text-base leading-none">{e.icon}</span>
            <span className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-text">
              {e.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
