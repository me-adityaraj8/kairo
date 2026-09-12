"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export default function GoldCounter({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(value);
  const frame = useRef<number>();

  useEffect(() => {
    if (reduceMotion) {
      setShown(value);
      return;
    }

    const start = shown;
    const delta = value - start;
    if (delta === 0) return;

    const duration = 600;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      setShown(Math.round(start + delta * progress));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduceMotion]);

  return <span className="font-pixel text-xs text-gold">{shown}</span>;
}
