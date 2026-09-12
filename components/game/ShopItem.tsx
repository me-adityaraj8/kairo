"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RARITY, Rarity, rarityForCost } from "@/lib/rarity";
import { burst } from "@/lib/motion";
import GameButton from "./GameButton";

export type ShopEntry = {
  slug: string;
  name: string;
  cost: number;
  payload: string;
  owned: boolean;
  rarity?: string;
  slot?: string;
};

const FLAVOUR: Record<string, string> = {
  torch: "Burns steady in the damp. Somebody has to go first.",
  "shield-badge": "Dented, honest, and still between you and the floor.",
  quill: "Writes faster than doubt can catch up.",
  potion: "Tastes of pine and bad decisions. Works anyway.",
  crown: "Not valuable. Just very hard to ignore.",
  sword: "Plain iron, kept sharp. That is the whole trick.",
  wings: "Light enough to lift a very stubborn person.",
  dragon: "Worn only by those who finished what they started.",
};

const COINS = burst(10, 70);

export default function ShopItem({
  item,
  affordable,
  busy,
  onBuy,
}: {
  item: ShopEntry;
  affordable: boolean;
  busy: boolean;
  onBuy: (origin: DOMRect | null) => void;
}) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [coins, setCoins] = useState(false);

  // stored rarity is authoritative; cost is only a fallback for older rows
  const rarity = RARITY[(item.rarity as Rarity) ?? rarityForCost(item.cost)] ?? RARITY.COMMON;

  function onPointerMove(e: React.PointerEvent) {
    if (reduceMotion) return;
    const box = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - box.left) / box.width - 0.5;
    const py = (e.clientY - box.top) / box.height - 0.5;
    setTilt({ x: -py * 12, y: px * 14 });
  }

  function handleBuy() {
    setCoins(true);
    setTimeout(() => setCoins(false), 1000);
    onBuy(cardRef.current?.getBoundingClientRect() ?? null);
  }

  return (
    <motion.li layout className="min-w-0 [perspective:1000px]">
      <motion.div
        ref={cardRef}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        whileHover={reduceMotion ? undefined : { y: -6 }}
        transition={{ type: "spring", stiffness: 240, damping: 18 }}
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white/[0.05] p-4 backdrop-blur [transform-style:preserve-3d]"
        style={{
          borderColor: item.owned ? "rgba(76,230,207,.5)" : rarity.ring,
          boxShadow: `0 0 26px -14px ${rarity.color}, 0 18px 38px -26px rgba(0,0,0,.95)`,
        }}
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: rarity.sheen }} />

        {/* pedestal glow */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-14 h-24 w-32 -translate-x-1/2 rounded-[50%] blur-xl"
          style={{ background: rarity.glow }}
          animate={reduceMotion ? undefined : { opacity: [0.5, 0.95, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative flex items-center justify-between gap-2">
          <span
            className="rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em]"
            style={{ color: rarity.color, background: rarity.glow }}
          >
            {rarity.label}
          </span>
          {item.owned && (
            <span className="rounded-md bg-xp/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-xp">
              Owned
            </span>
          )}
        </div>

        {/* artwork */}
        <motion.div
          className="relative mx-auto my-4 grid h-20 w-20 place-items-center"
          animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transform: "translateZ(40px)" }}
        >
          <span className="text-5xl drop-shadow-[0_8px_16px_rgba(0,0,0,.6)]">{item.payload}</span>

          <AnimatePresence>
            {coins &&
              COINS.map((c, i) => (
                <motion.span
                  key={i}
                  className="absolute h-3 w-3 rounded-full"
                  style={{
                    background: "linear-gradient(180deg,#ffd469,#ff972e)",
                    boxShadow: "0 0 10px rgba(255,180,60,.9)",
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                  animate={{ x: c.x, y: c.y, opacity: 0, scale: 1.1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.85, delay: c.delay, ease: "easeOut" }}
                />
              ))}
          </AnimatePresence>
        </motion.div>

        <p className="relative text-center text-[15px] font-bold text-text">{item.name}</p>
        <p className="relative mt-1 min-h-[32px] text-center text-[11px] leading-snug text-dim">
          {FLAVOUR[item.slug] ?? "A curiosity from the back shelf."}
        </p>

        <div className="relative mt-4 flex items-center justify-center">
          {item.owned ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-xp">✓ In your collection</span>
          ) : (
            <GameButton
              size="sm"
              variant={affordable ? "gold" : "ghost"}
              disabled={!affordable || busy}
              onClick={handleBuy}
              className="w-full"
            >
              {busy ? "…" : (
                <>
                  <span aria-hidden="true">🪙</span>
                  <span style={{ color: affordable ? undefined : "var(--danger)" }}>{item.cost}</span>
                </>
              )}
            </GameButton>
          )}
        </div>
      </motion.div>
    </motion.li>
  );
}
