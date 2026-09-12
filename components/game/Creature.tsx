"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, type MotionValue } from "framer-motion";
import type { Mood } from "@/lib/companion";
import { speciesOf, type Palette, type SpeciesId } from "@/lib/characters";

/**
 * One pointer listener for the whole app, however many creatures are on
 * screen. Each one subscribes and works out its own gaze from the shared
 * coordinates rather than attaching a listener of its own.
 */
const watchers = new Set<(x: number, y: number) => void>();
let listening = false;

function handleMove(e: PointerEvent) {
  watchers.forEach((w) => w(e.clientX, e.clientY));
}

function watchPointer(fn: (x: number, y: number) => void) {
  watchers.add(fn);
  if (!listening && typeof window !== "undefined") {
    window.addEventListener("pointermove", handleMove, { passive: true });
    listening = true;
  }
  return () => {
    watchers.delete(fn);
    if (watchers.size === 0 && listening) {
      window.removeEventListener("pointermove", handleMove);
      listening = false;
    }
  };
}

/**
 * A companion drawn as layered SVG so its parts move independently.
 *
 * Everything is one 100x100 viewBox. Groups are named the same across every
 * species — tail, body, head, ears, eyes — so the mood table below drives all
 * six without knowing which one it is animating.
 */

type EyeShape = "open" | "happy" | "wide" | "closed";

type MoodSpec = {
  root: { y: number[]; rotate: number[] };
  body: { scaleX: number[]; scaleY: number[] };
  head: { y: number[]; rotate: number[] };
  ear: number[];
  tail: number[];
  eyes: EyeShape;
  sparkles: number;
  duration: number;
};

/** Body language per mood. Squash and stretch is what keeps it from reading
 *  as a picture being moved around. */
const MOOD: Record<Mood, MoodSpec> = {
  IDLE: {
    root: { y: [0, -2.5, 0], rotate: [0, 0.8, -0.8, 0] },
    body: { scaleX: [1, 1.025, 1], scaleY: [1, 0.975, 1] },
    head: { y: [0, -1.2, 0], rotate: [0, 1.5, -1.5, 0] },
    ear: [0, 4, -2, 0],
    tail: [0, 10, -6, 0],
    eyes: "open",
    sparkles: 0,
    duration: 3.8,
  },
  HAPPY: {
    root: { y: [0, -7, 0], rotate: [0, 3, -3, 0] },
    body: { scaleX: [1, 0.94, 1.06, 1], scaleY: [1, 1.08, 0.94, 1] },
    head: { y: [0, -3, 0], rotate: [0, 5, -5, 0] },
    ear: [0, 14, -6, 0],
    tail: [0, 26, -14, 0],
    eyes: "happy",
    sparkles: 3,
    duration: 1.5,
  },
  EXCITED: {
    root: { y: [0, -13, 0, -6, 0], rotate: [0, 6, -6, 0] },
    body: { scaleX: [1, 0.88, 1.1, 1], scaleY: [1, 1.14, 0.9, 1] },
    head: { y: [0, -5, 0], rotate: [0, 8, -8, 0] },
    ear: [0, 22, -10, 0],
    tail: [0, 34, -20, 0],
    eyes: "wide",
    sparkles: 5,
    duration: 0.95,
  },
  FOCUSED: {
    root: { y: [0, -1.2, 0], rotate: [0, 0, 0] },
    body: { scaleX: [1, 1.015, 1], scaleY: [1, 0.985, 1] },
    head: { y: [0, -0.6, 0], rotate: [0, 0, 0] },
    ear: [0, 2, 0],
    tail: [0, 5, -3, 0],
    eyes: "open",
    sparkles: 0,
    duration: 5.4,
  },
  CELEBRATING: {
    root: { y: [0, -18, 0, -10, 0], rotate: [0, 10, -10, 0] },
    body: { scaleX: [1, 0.84, 1.14, 1], scaleY: [1, 1.2, 0.88, 1] },
    head: { y: [0, -7, 0], rotate: [0, 12, -12, 0] },
    ear: [0, 28, -14, 0],
    tail: [0, 42, -26, 0],
    eyes: "happy",
    sparkles: 8,
    duration: 0.85,
  },
  SLEEPY: {
    root: { y: [0, -1.5, 0], rotate: [0, -2, 0] },
    body: { scaleX: [1, 1.03, 1], scaleY: [1, 0.97, 1] },
    head: { y: [0, 1.5, 0], rotate: [0, -5, -3, -5] },
    ear: [0, -8, -6, -8],
    tail: [0, 4, 0],
    eyes: "closed",
    sparkles: 0,
    duration: 5.8,
  },
  STARSTRUCK: {
    root: { y: [0, -9, 0], rotate: [0, -4, 4, 0] },
    body: { scaleX: [1, 1.08, 1], scaleY: [1, 1.08, 1] },
    head: { y: [0, -3, 0], rotate: [0, -3, 3, 0] },
    ear: [0, 18, -8, 0],
    tail: [0, 20, -12, 0],
    eyes: "wide",
    sparkles: 6,
    duration: 1.2,
  },
};

/* ------------------------------------------------------------------ eyes */

function Eyes({
  shape,
  palette,
  blink,
  gazeX,
  gazeY,
}: {
  shape: EyeShape;
  palette: Palette;
  blink: boolean;
  gazeX: MotionValue<number>;
  gazeY: MotionValue<number>;
}) {
  const closed = shape === "closed" || blink;
  const y = 42;

  if (closed) {
    return (
      <g stroke={palette.accent} strokeWidth={2.4} strokeLinecap="round" fill="none">
        <path d={`M35 ${y} q5 4 10 0`} />
        <path d={`M55 ${y} q5 4 10 0`} />
      </g>
    );
  }

  if (shape === "happy") {
    return (
      <g stroke={palette.accent} strokeWidth={2.6} strokeLinecap="round" fill="none">
        <path d={`M35 ${y + 1} q5 -6 10 0`} />
        <path d={`M55 ${y + 1} q5 -6 10 0`} />
      </g>
    );
  }

  const r = shape === "wide" ? 5.4 : 4.4;
  return (
    <g>
      {[40, 60].map((cx) => (
        <g key={cx}>
          {/* The eye itself is fixed; only the glint inside it travels, which
              is what reads as the pupil following the pointer. Its range is
              kept inside the eye so it never slides off the edge. */}
          <ellipse cx={cx} cy={y} rx={r} ry={r * 1.12} fill="#1b1526" />
          <motion.g style={{ x: gazeX, y: gazeY }}>
            <circle cx={cx + 1.5} cy={y - 1.6} r={r * 0.34} fill="#fff" opacity={0.95} />
            <circle cx={cx - 1.7} cy={y + 1.8} r={r * 0.17} fill="#fff" opacity={0.55} />
          </motion.g>
        </g>
      ))}
    </g>
  );
}

/* -------------------------------------------------------------- geometry */

/** Parts are returned in paint order; every species fills the same slots. */
function geometry(id: SpeciesId, p: Palette) {
  const rim = "rgba(255,255,255,.35)";

  // shared chibi body: wide base, narrow shoulders
  const body = (
    <>
      <path
        d="M50 52 C64 52 71 62 71 72 C71 84 62 90 50 90 C38 90 29 84 29 72 C29 62 36 52 50 52 Z"
        fill={p.coat}
      />
      <path
        d="M50 60 C58 60 63 67 63 75 C63 84 57 88 50 88 C43 88 37 84 37 75 C37 67 42 60 50 60 Z"
        fill={p.belly}
        opacity={0.92}
      />
      <path d="M33 60 C38 54 44 52 50 52" stroke={rim} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </>
  );

  const paws = (
    <>
      <ellipse cx={39} cy={88} rx={6} ry={4} fill={p.accent} opacity={0.85} />
      <ellipse cx={61} cy={88} rx={6} ry={4} fill={p.accent} opacity={0.85} />
    </>
  );

  const headBase = (
    <>
      <ellipse cx={50} cy={38} rx={26} ry={23} fill={p.coat} />
      <path d="M28 32 C33 22 42 16 50 16" stroke={rim} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </>
  );

  const muzzle = (
    <>
      <ellipse cx={50} cy={50} rx={11} ry={8} fill={p.belly} />
      <ellipse cx={50} cy={47} rx={2.6} ry={2} fill={p.accent} />
      <path d="M50 49 q0 3 -3 4" stroke={p.accent} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <path d="M50 49 q0 3 3 4" stroke={p.accent} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </>
  );

  switch (id) {
    case "fox":
      return {
        tail: (
          <path
            d="M72 78 C88 74 94 58 88 46 C86 58 80 66 70 70 Z"
            fill={p.coat}
            stroke={p.coatDeep}
            strokeWidth={1}
          />
        ),
        tailTip: <path d="M88 46 C92 52 92 58 89 62 C86 56 86 50 88 46 Z" fill={p.belly} />,
        back: null,
        body: (
          <>
            {body}
            {paws}
          </>
        ),
        ears: (
          <>
            <path d="M30 24 L26 4 L44 18 Z" fill={p.coat} />
            <path d="M31 22 L30 11 L39 18 Z" fill={p.belly} />
            <path d="M70 24 L74 4 L56 18 Z" fill={p.coat} />
            <path d="M69 22 L70 11 L61 18 Z" fill={p.belly} />
          </>
        ),
        head: (
          <>
            {headBase}
            <path d="M24 40 C22 46 24 52 29 55 C27 48 26 44 27 40 Z" fill={p.belly} opacity={0.8} />
            <path d="M76 40 C78 46 76 52 71 55 C73 48 74 44 73 40 Z" fill={p.belly} opacity={0.8} />
            {muzzle}
          </>
        ),
        accent: null,
      };

    case "owl":
      return {
        tail: <path d="M42 86 L50 96 L58 86 Z" fill={p.coatDeep} />,
        tailTip: null,
        back: null,
        body: (
          <>
            <path
              d="M50 48 C66 48 74 60 74 72 C74 85 63 92 50 92 C37 92 26 85 26 72 C26 60 34 48 50 48 Z"
              fill={p.coat}
            />
            <path
              d="M50 58 C59 58 65 66 65 75 C65 85 58 89 50 89 C42 89 35 85 35 75 C35 66 41 58 50 58 Z"
              fill={p.belly}
              opacity={0.9}
            />
            {/* wings */}
            <path d="M27 58 C20 66 20 78 26 86 C30 78 30 66 30 60 Z" fill={p.coatDeep} />
            <path d="M73 58 C80 66 80 78 74 86 C70 78 70 66 70 60 Z" fill={p.coatDeep} />
            <ellipse cx={43} cy={92} rx={5} ry={3} fill={p.accent} opacity={0.85} />
            <ellipse cx={57} cy={92} rx={5} ry={3} fill={p.accent} opacity={0.85} />
          </>
        ),
        ears: (
          <>
            <path d="M32 22 L28 8 L42 17 Z" fill={p.coat} />
            <path d="M68 22 L72 8 L58 17 Z" fill={p.coat} />
          </>
        ),
        head: (
          <>
            <ellipse cx={50} cy={38} rx={27} ry={24} fill={p.coat} />
            {/* facial disc */}
            <circle cx={40} cy={41} r={11} fill={p.belly} opacity={0.55} />
            <circle cx={60} cy={41} r={11} fill={p.belly} opacity={0.55} />
            <path d="M50 44 L45 50 L50 54 L55 50 Z" fill={p.accent} />
            <path d="M25 32 C30 22 40 16 50 16" stroke={rim} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          </>
        ),
        accent: null,
      };

    case "dragon":
      return {
        tail: (
          <path
            d="M70 80 C86 80 92 68 90 56 C86 66 80 72 68 72 Z"
            fill={p.coat}
            stroke={p.coatDeep}
            strokeWidth={1}
          />
        ),
        tailTip: <path d="M90 56 L97 50 L92 62 Z" fill={p.glow} />,
        back: (
          <>
            <path d="M28 62 C14 56 12 42 20 34 C22 46 28 54 34 58 Z" fill={p.coatDeep} opacity={0.9} />
            <path d="M72 62 C86 56 88 42 80 34 C78 46 72 54 66 58 Z" fill={p.coatDeep} opacity={0.9} />
          </>
        ),
        body: (
          <>
            {body}
            {/* belly ridges */}
            <path d="M42 68 h16 M43 74 h14 M44 80 h12" stroke={p.accent} strokeWidth={1.2} opacity={0.35} />
            {paws}
          </>
        ),
        ears: (
          <>
            <path d="M32 20 L24 6 L42 16 Z" fill={p.accent} />
            <path d="M68 20 L76 6 L58 16 Z" fill={p.accent} />
          </>
        ),
        head: (
          <>
            {headBase}
            {/* horns */}
            <path d="M38 18 C36 10 38 6 42 4 C41 9 41 14 42 18 Z" fill={p.glow} />
            <path d="M62 18 C64 10 62 6 58 4 C59 9 59 14 58 18 Z" fill={p.glow} />
            <ellipse cx={50} cy={51} rx={12} ry={8} fill={p.belly} />
            <ellipse cx={46} cy={48} rx={1.8} ry={1.4} fill={p.accent} />
            <ellipse cx={54} cy={48} rx={1.8} ry={1.4} fill={p.accent} />
            <path d="M44 54 q6 4 12 0" stroke={p.accent} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          </>
        ),
        accent: null,
      };

    case "cat":
      return {
        tail: (
          <path
            d="M70 82 C84 82 90 70 86 58 C84 68 78 74 68 74"
            fill="none"
            stroke={p.coat}
            strokeWidth={7}
            strokeLinecap="round"
          />
        ),
        tailTip: null,
        back: null,
        body: (
          <>
            {body}
            {paws}
          </>
        ),
        ears: (
          <>
            <path d="M31 23 L27 5 L45 17 Z" fill={p.coat} />
            <path d="M32 21 L31 12 L40 17 Z" fill={p.belly} opacity={0.7} />
            <path d="M69 23 L73 5 L55 17 Z" fill={p.coat} />
            <path d="M68 21 L69 12 L60 17 Z" fill={p.belly} opacity={0.7} />
          </>
        ),
        head: (
          <>
            {headBase}
            <ellipse cx={50} cy={50} rx={10} ry={7} fill={p.belly} opacity={0.85} />
            <path d="M50 47 l-2.5 2 h5 Z" fill={p.glow} />
            <path d="M50 49 q0 3 -3 4" stroke={p.accent} strokeWidth={1.3} fill="none" strokeLinecap="round" />
            <path d="M50 49 q0 3 3 4" stroke={p.accent} strokeWidth={1.3} fill="none" strokeLinecap="round" />
            {/* whiskers */}
            <g stroke={p.belly} strokeWidth={1} opacity={0.75} strokeLinecap="round">
              <path d="M38 48 L26 45" />
              <path d="M38 51 L26 52" />
              <path d="M62 48 L74 45" />
              <path d="M62 51 L74 52" />
            </g>
          </>
        ),
        accent: null,
      };

    case "rabbit":
      return {
        tail: <circle cx={74} cy={80} r={7} fill={p.belly} />,
        tailTip: null,
        back: null,
        body: (
          <>
            {body}
            {paws}
          </>
        ),
        ears: (
          <>
            <ellipse cx={40} cy={8} rx={6} ry={17} fill={p.coat} transform="rotate(-10 40 8)" />
            <ellipse cx={40} cy={9} rx={3} ry={12} fill={p.accent} opacity={0.45} transform="rotate(-10 40 9)" />
            <ellipse cx={60} cy={8} rx={6} ry={17} fill={p.coat} transform="rotate(10 60 8)" />
            <ellipse cx={60} cy={9} rx={3} ry={12} fill={p.accent} opacity={0.45} transform="rotate(10 60 9)" />
          </>
        ),
        head: (
          <>
            {headBase}
            <ellipse cx={50} cy={50} rx={10} ry={7} fill={p.belly} />
            <path d="M50 47 l-2.5 2 h5 Z" fill={p.accent} />
            <path d="M50 49 v3" stroke={p.accent} strokeWidth={1.3} strokeLinecap="round" />
            <path d="M50 52 q-3 2 -5 1" stroke={p.accent} strokeWidth={1.2} fill="none" strokeLinecap="round" />
            <path d="M50 52 q3 2 5 1" stroke={p.accent} strokeWidth={1.2} fill="none" strokeLinecap="round" />
            <circle cx={32} cy={47} r={4} fill={p.accent} opacity={0.22} />
            <circle cx={68} cy={47} r={4} fill={p.accent} opacity={0.22} />
          </>
        ),
        accent: null,
      };

    case "deer":
      return {
        tail: <ellipse cx={72} cy={80} rx={5} ry={6} fill={p.belly} />,
        tailTip: null,
        back: null,
        body: (
          <>
            {body}
            {/* dapples */}
            <circle cx={42} cy={68} r={2.2} fill={p.belly} opacity={0.55} />
            <circle cx={57} cy={72} r={2} fill={p.belly} opacity={0.5} />
            <circle cx={48} cy={64} r={1.8} fill={p.belly} opacity={0.45} />
            {paws}
          </>
        ),
        ears: (
          <>
            <ellipse cx={27} cy={26} rx={8} ry={5} fill={p.coat} transform="rotate(-22 27 26)" />
            <ellipse cx={73} cy={26} rx={8} ry={5} fill={p.coat} transform="rotate(22 73 26)" />
          </>
        ),
        head: (
          <>
            {/* antlers sit behind the head fill */}
            <g stroke={p.accent} strokeWidth={2.6} fill="none" strokeLinecap="round">
              <path d="M40 20 C36 12 34 8 35 3" />
              <path d="M37 12 C33 9 31 8 28 8" />
              <path d="M60 20 C64 12 66 8 65 3" />
              <path d="M63 12 C67 9 69 8 72 8" />
            </g>
            {headBase}
            {muzzle}
          </>
        ),
        accent: null,
      };
  }
}

/* ------------------------------------------------------------- component */

export default function Creature({
  species,
  mood = "IDLE",
  size = 128,
  className,
}: {
  species: string;
  mood?: Mood;
  size?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const s = speciesOf(species);
  const p = s.palette;
  const spec = MOOD[mood] ?? MOOD.IDLE;
  const g = geometry(s.id, p);

  // Blinking runs on its own clock — tying it to the mood loop would make it
  // metronomic, and real blinks are irregular.
  /*
   * Gaze. Written to motion values rather than state, so following the
   * pointer never re-renders the component, and sprung so the eyes ease
   * across instead of snapping.
   */
  const svgRef = useRef<SVGSVGElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const gazeX = useSpring(rawX, { stiffness: 260, damping: 24, mass: 0.35 });
  const gazeY = useSpring(rawY, { stiffness: 260, damping: 24, mass: 0.35 });

  useEffect(() => {
    if (reduceMotion) return;
    let frame = 0;
    let px = 0;
    let py = 0;

    // One measurement per frame at most — reading layout on every pointer
    // event would thrash.
    const apply = () => {
      frame = 0;
      const el = svgRef.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      if (!box.width) return;

      const eyeX = box.left + box.width / 2;
      const eyeY = box.top + box.height * 0.42;
      const dx = px - eyeX;
      const dy = py - eyeY;
      const dist = Math.hypot(dx, dy) || 1;
      // Reaches full deflection about a head's width away, then holds.
      const reach = Math.min(1, dist / (box.width * 1.6));

      // Small, because the glint travels inside the eye rather than with it.
      rawX.set((dx / dist) * reach * 1.3);
      rawY.set((dy / dist) * reach * 1.15);
    };

    return watchPointer((x, y) => {
      px = x;
      py = y;
      if (!frame) frame = requestAnimationFrame(apply);
    });
  }, [reduceMotion, rawX, rawY]);

  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (reduceMotion || spec.eyes === "closed") return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true);
        timer = setTimeout(() => {
          setBlink(false);
          schedule();
        }, 120);
      }, 2200 + Math.random() * 4000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [reduceMotion, spec.eyes]);

  const loop = { duration: spec.duration, repeat: Infinity, ease: "easeInOut" as const };
  const still = reduceMotion;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${s.name}, ${s.title}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`aura-${s.id}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={p.glow} stopOpacity={0.45} />
          <stop offset="70%" stopColor={p.glow} stopOpacity={0.08} />
          <stop offset="100%" stopColor={p.glow} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* aura */}
      <motion.circle
        cx={50}
        cy={50}
        r={46}
        fill={`url(#aura-${s.id})`}
        animate={still ? undefined : { opacity: [0.6, 1, 0.6], scale: [1, 1.06, 1] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />

      {/* Contact shadow, tied to the bob so the hop reads as weight. Scaled
          rather than animated on rx, which is not an animatable attribute. */}
      <motion.ellipse
        cx={50}
        cy={94}
        rx={22}
        ry={4}
        fill="rgba(0,0,0,.45)"
        animate={still ? undefined : { scaleX: [1, 0.86, 1], opacity: [0.45, 0.3, 0.45] }}
        transition={loop}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />

      <motion.g
        animate={still ? undefined : { y: spec.root.y, rotate: spec.root.rotate }}
        transition={loop}
        style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
      >
        {/* tail, behind the body */}
        <motion.g
          animate={still ? undefined : { rotate: spec.tail }}
          transition={loop}
          style={{ transformOrigin: "68px 76px" }}
        >
          {g.tail}
          {g.tailTip}
        </motion.g>

        {g.back}

        <motion.g
          animate={still ? undefined : { scaleX: spec.body.scaleX, scaleY: spec.body.scaleY }}
          transition={loop}
          style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
        >
          {g.body}
        </motion.g>

        <motion.g
          animate={still ? undefined : { y: spec.head.y, rotate: spec.head.rotate }}
          transition={loop}
          style={{ transformOrigin: "50px 56px" }}
        >
          <motion.g
            animate={still ? undefined : { rotate: spec.ear }}
            transition={loop}
            style={{ transformOrigin: "50px 30px" }}
          >
            {g.ears}
          </motion.g>
          {g.head}
          <Eyes shape={spec.eyes} palette={p} blink={blink} gazeX={gazeX} gazeY={gazeY} />
        </motion.g>
      </motion.g>

      {/* sparkles, only for the moods that earn them */}
      {!still &&
        spec.sparkles > 0 &&
        Array.from({ length: spec.sparkles }).map((_, i) => {
          const angle = (i / spec.sparkles) * Math.PI * 2;
          const r = 40;
          return (
            <motion.circle
              key={i}
              cx={50 + Math.cos(angle) * r}
              cy={46 + Math.sin(angle) * r * 0.8}
              r={1.8}
              fill={p.glow}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay: i * 0.12,
                ease: "easeOut",
              }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          );
        })}

      {/* sleepy z's */}
      {!still &&
        spec.eyes === "closed" &&
        [0, 1, 2].map((i) => (
          <motion.text
            key={i}
            x={72 + i * 5}
            y={26 - i * 6}
            fill={p.glow}
            fontSize={8 - i}
            fontWeight={700}
            animate={{ opacity: [0, 0.9, 0], y: [26 - i * 6, 14 - i * 6] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
          >
            z
          </motion.text>
        ))}
    </svg>
  );
}
