"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { seeded } from "@/lib/motion";

/**
 * Layered world: stars, twin moons, drifting fog and two ridgelines.
 * Each layer shifts by a different factor against the pointer for depth.
 */
export default function WorldBackground() {
  const reduceMotion = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const mx = useSpring(px, { stiffness: 40, damping: 20 });
  const my = useSpring(py, { stiffness: 40, damping: 20 });

  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py, reduceMotion]);

  const starsX = useTransform(mx, (v) => v * -14);
  const starsY = useTransform(my, (v) => v * -7);
  const moonsX = useTransform(mx, (v) => v * -26);
  const moonsY = useTransform(my, (v) => v * -13);
  const farX = useTransform(mx, (v) => v * 18);
  const farY = useTransform(my, (v) => v * 9);
  const nearX = useTransform(mx, (v) => v * 38);
  const nearY = useTransform(my, (v) => v * 19);

  const stars = { x: starsX, y: starsY };
  const moons = { x: moonsX, y: moonsY };
  const farRidge = { x: farX, y: farY };
  const nearRidge = { x: nearX, y: nearY };

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-[3] overflow-hidden">
      {/* stars */}
      <motion.div className="absolute inset-[-4%]" style={reduceMotion ? undefined : stars}>
        {Array.from({ length: 48 }).map((_, i) => {
          const size = 1 + seeded(i, 9) * 2;
          return (
            <motion.span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${seeded(i, 1) * 100}%`,
                top: `${seeded(i, 2) * 62}%`,
                width: size,
                height: size,
                opacity: 0.25 + seeded(i, 3) * 0.5,
              }}
              animate={reduceMotion ? undefined : { opacity: [0.2, 0.75, 0.2] }}
              transition={{ duration: 3 + seeded(i, 4) * 5, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}
      </motion.div>

      {/* moons */}
      <motion.div className="absolute inset-0" style={reduceMotion ? undefined : moons}>
        <div
          className="absolute right-[12%] top-[8%] h-28 w-28 rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 32%, #fff3d1 0%, #ffc542 45%, rgba(255,152,46,.25) 70%, transparent 78%)",
            filter: "blur(0.4px)",
            opacity: 0.5,
          }}
        />
        <div
          className="absolute left-[16%] top-[16%] h-14 w-14 rounded-full"
          style={{
            background: "radial-gradient(circle at 40% 35%, #dcd6ff 0%, #b15cff 55%, transparent 75%)",
            opacity: 0.35,
          }}
        />
      </motion.div>

      {/* fog band */}
      <motion.div
        className="absolute inset-x-[-20%] top-[46%] h-48"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(177,92,255,.16) 45%, transparent)",
          filter: "blur(28px)",
        }}
        animate={reduceMotion ? undefined : { x: ["-4%", "4%", "-4%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ridgelines */}
      <motion.svg
        className="absolute inset-x-0 bottom-0 h-[42vh] w-full"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        style={reduceMotion ? undefined : farRidge}
      >
        <path
          d="M0,260 L140,190 L260,240 L420,140 L560,215 L700,150 L860,225 L1000,165 L1160,230 L1300,175 L1440,245 L1440,400 L0,400 Z"
          fill="rgba(70,40,120,.5)"
        />
      </motion.svg>

      <motion.svg
        className="absolute inset-x-0 bottom-0 h-[32vh] w-full"
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        style={reduceMotion ? undefined : nearRidge}
      >
        <path
          d="M0,200 L120,150 L280,205 L430,120 L590,195 L760,135 L920,200 L1080,145 L1240,205 L1440,160 L1440,300 L0,300 Z"
          fill="rgba(26,16,48,.85)"
        />
      </motion.svg>

      {/* ground haze */}
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{ background: "linear-gradient(180deg, transparent, rgba(255,152,46,.09) 60%, rgba(8,5,18,.5))" }}
      />
    </div>
  );
}
