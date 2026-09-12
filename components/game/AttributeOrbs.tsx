"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CharacterAttribute } from "@/lib/types";
import { attributeIcon } from "@/lib/rarity";
import { SPRING } from "@/lib/motion";

const TINTS: Record<string, string> = {
  Intellect: "#4c9ffe",
  Strength: "#ff5c74",
  Discipline: "#b15cff",
  Vitality: "#4ce6cf",
};

export default function AttributeOrbs({
  attributes,
  flashId,
}: {
  attributes: CharacterAttribute[];
  flashId: string | null;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
      {attributes.map((attr) => (
        <Orb key={attr.id} attr={attr} tint={TINTS[attr.name] ?? "#b15cff"} flash={flashId === attr.id} />
      ))}
    </ul>
  );
}

function Orb({
  attr,
  tint,
  flash,
}: {
  attr: CharacterAttribute;
  tint: string;
  flash: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const pct = attr.xpToNext > 0 ? Math.min(100, (attr.xp / attr.xpToNext) * 100) : 0;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  return (
    <li>
      <motion.div
        animate={flash && !reduceMotion ? { scale: [1, 1.07, 1] } : undefined}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 backdrop-blur"
        style={flash ? { borderColor: tint, boxShadow: `0 0 22px -4px ${tint}` } : undefined}
      >
        <div className="relative h-[54px] w-[54px] shrink-0">
          <svg viewBox="0 0 54 54" className="h-full w-full -rotate-90">
            <circle cx="27" cy="27" r={radius} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="5" />
            <motion.circle
              cx="27"
              cy="27"
              r={radius}
              fill="none"
              stroke={tint}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={false}
              animate={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
              transition={reduceMotion ? { duration: 0 } : SPRING.dramatic}
              style={{ filter: `drop-shadow(0 0 5px ${tint})` }}
            />
          </svg>
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center text-lg"
          >
            {attributeIcon(attr.name)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-text" title={attr.name}>
            {attr.name}
          </p>
          <p className="font-display text-[11px]" style={{ color: tint }}>
            LV {attr.level}
          </p>
          <span className="sr-only">
            <span
              role="progressbar"
              aria-label={`${attr.name}: ${attr.xp} of ${attr.xpToNext} XP`}
              aria-valuenow={attr.xp}
              aria-valuemin={0}
              aria-valuemax={attr.xpToNext}
            />
          </span>
        </div>
      </motion.div>
    </li>
  );
}
