"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Counts toward the target instead of snapping, with an ease-out curve. */
export default function Counter({ value, className = "" }: { value: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(value);
  const frame = useRef<number>();
  const from = useRef(value);

  useEffect(() => {
    if (reduceMotion) {
      setShown(value);
      return;
    }

    const start = from.current;
    const delta = value - start;
    if (delta === 0) return;

    const duration = 700;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(start + delta * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else from.current = value;
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      from.current = value;
    };
  }, [value, reduceMotion]);

  return <span className={`font-display text-sm text-gold ${className}`}>{shown}</span>;
}
