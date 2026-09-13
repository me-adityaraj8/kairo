"use client";

import { forwardRef } from "react";
import { seeded } from "@/lib/motion";

/**
 * The world behind the hero, in depth-sorted layers so GSAP can move each at
 * its own rate. Everything is drawn — no image ships — and every element is
 * deterministic, so the server and client render the same thing.
 */

const Layer = ({
  depth,
  children,
  className = "",
}: {
  depth: number;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    data-parallax={depth}
    className={`pointer-events-none absolute inset-0 ${className}`}
    aria-hidden="true"
  >
    {children}
  </div>
);

/** A floating island: a slab of rock with a lit top and a trailing underside. */
function Island({ x, y, w, tint, flip }: { x: number; y: number; w: number; tint: string; flip?: boolean }) {
  return (
    <svg
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%`, width: w, transform: flip ? "scaleX(-1)" : undefined }}
      viewBox="0 0 100 62"
      fill="none"
    >
      <path d="M12 22 H88 L74 40 L58 52 L40 52 L24 38 Z" fill="#140e26" />
      <path d="M24 38 L40 52 L34 62 L26 50 Z" fill="#0d0819" />
      <path d="M12 22 H88 L80 28 H18 Z" fill={tint} opacity={0.5} />
      <ellipse cx="50" cy="22" rx="38" ry="5" fill={tint} opacity={0.28} />
    </svg>
  );
}

const Backdrop = forwardRef<HTMLDivElement>(function Backdrop(_props, ref) {
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* deep sky wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 8%, rgba(124,58,237,.30) 0%, rgba(76,29,149,.14) 34%, transparent 68%)," +
            "radial-gradient(80% 60% at 80% 70%, rgba(255,160,50,.12) 0%, transparent 60%)",
        }}
      />

      {/* far starfield */}
      <Layer depth={0.08}>
        {Array.from({ length: 70 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${seeded(i, 1) * 100}%`,
              top: `${seeded(i, 2) * 88}%`,
              width: 1 + seeded(i, 3) * 1.6,
              height: 1 + seeded(i, 3) * 1.6,
              opacity: 0.18 + seeded(i, 4) * 0.5,
            }}
          />
        ))}
      </Layer>

      {/* distant spires */}
      <Layer depth={0.16}>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1200 300" preserveAspectRatio="none">
          <path
            d="M0 300 V200 L70 150 L110 190 L170 96 L215 170 L280 130 L330 186 L400 120 L455 178 L520 150 L580 200 L660 128 L720 182 L800 140 L870 196 L940 160 L1010 200 L1090 150 L1140 190 L1200 168 V300 Z"
            fill="#0f0a1f"
            opacity={0.85}
          />
        </svg>
      </Layer>

      {/* glowing orbs */}
      <Layer depth={0.3}>
        {[
          { x: 12, y: 30, r: 190, c: "rgba(124,58,237,.28)" },
          { x: 84, y: 22, r: 160, c: "rgba(76,159,254,.20)" },
          { x: 68, y: 66, r: 220, c: "rgba(255,160,50,.16)" },
        ].map((o, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              left: `${o.x}%`,
              top: `${o.y}%`,
              width: o.r,
              height: o.r,
              background: `radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
            }}
          />
        ))}
      </Layer>

      {/* mid islands */}
      <Layer depth={0.5}>
        <Island x={6} y={54} w={190} tint="#7c3aed" />
        <Island x={78} y={38} w={150} tint="#4c9ffe" flip />
        <Island x={58} y={70} w={110} tint="#ff972e" />
      </Layer>

      {/* near rocks framing the bottom */}
      <Layer depth={0.85}>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path d="M0 200 V120 L90 70 L180 116 L260 60 L340 120 L420 88 L500 140 L560 104 L640 150 L720 110 L800 148 L900 96 L1000 140 L1100 100 L1200 146 V200 Z" fill="#090615" />
        </svg>
      </Layer>

      {/* light trails */}
      <Layer depth={0.42}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            data-trail
            className="absolute h-px"
            style={{
              left: `${8 + seeded(i, 7) * 78}%`,
              top: `${14 + seeded(i, 8) * 52}%`,
              width: 60 + seeded(i, 9) * 130,
              background:
                "linear-gradient(90deg, transparent, rgba(192,132,252,.75), transparent)",
              transform: `rotate(${-28 + seeded(i, 10) * 46}deg)`,
            }}
          />
        ))}
      </Layer>

      {/* depth fog at the horizon */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-deep via-deep/60 to-transparent" />
    </div>
  );
});

export default Backdrop;
