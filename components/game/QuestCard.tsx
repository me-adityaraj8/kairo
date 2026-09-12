"use client";

import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Quest } from "@/lib/types";
import { REWARD_PREVIEW, attributeIcon, rarityOf } from "@/lib/rarity";
import { SPRING } from "@/lib/motion";
import GameButton from "./GameButton";

type QuestCardProps = {
  quest: Quest;
  busy: boolean;
  onComplete: () => void;
  onDelete: () => void;
};

// forwardRef because AnimatePresence mode="popLayout" hands a ref to each child.
const QuestCard = forwardRef<HTMLLIElement, QuestCardProps>(function QuestCard(
  { quest, busy, onComplete, onDelete },
  ref
) {
  const reduceMotion = useReducedMotion();
  const rarity = rarityOf(quest.difficulty);
  const reward = REWARD_PREVIEW[quest.difficulty];

  if (quest.done) {
    return (
      <motion.li
        ref={ref}
        layout
        initial={false}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-3.5 py-3"
      >
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-xp/15 text-sm text-xp"
        >
          ✓
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-dim line-through">{quest.title}</span>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider" style={{ color: rarity.color }}>
          {rarity.label}
        </span>
        <button
          onClick={onDelete}
          aria-label={`Remove quest: ${quest.title}`}
          className="shrink-0 rounded-lg px-2 py-1 text-dim transition-colors hover:bg-white/10 hover:text-danger"
        >
          ✕
        </button>
      </motion.li>
    );
  }

  return (
    <motion.li
      ref={ref}
      id={`quest-${quest.id}`}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, x: 40 }}
      transition={SPRING.subtle}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className="group relative overflow-hidden rounded-2xl border bg-white/[0.05] p-3.5 backdrop-blur"
      style={{
        borderColor: rarity.ring,
        boxShadow: `0 0 0 1px ${rarity.glow} inset, 0 16px 34px -24px rgba(0,0,0,.95)`,
      }}
    >
      {/* rarity sheen */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: rarity.sheen }} />
      {/* rarity spine */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1"
        style={{ background: rarity.color, boxShadow: `0 0 14px ${rarity.color}` }}
      />

      <div className="relative flex items-start gap-3">
        <motion.span
          aria-hidden="true"
          whileHover={reduceMotion ? undefined : { rotate: [0, -10, 8, 0] }}
          transition={{ duration: 0.5 }}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 text-xl"
          style={{ background: `linear-gradient(150deg, ${rarity.glow}, rgba(255,255,255,.03))` }}
        >
          {attributeIcon(quest.attributeName)}
        </motion.span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className="rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em]"
              style={{ color: rarity.color, background: rarity.glow }}
            >
              {rarity.label}
            </span>
            <span className="text-[11px] font-medium text-dim">{quest.attributeName}</span>
          </div>

          <p className="mt-1 break-words text-[15px] font-semibold leading-snug text-text">
            {quest.title}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Reward tint="var(--xp)" bg="rgba(76,230,207,.14)" label={`+${reward.xp} XP`} />
            <Reward tint="var(--gold)" bg="rgba(255,197,66,.14)" label={`+${reward.gold} Gold`} />
          </div>
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-end gap-2">
        <button
          onClick={onDelete}
          aria-label={`Abandon quest: ${quest.title}`}
          className="rounded-lg px-2.5 py-2 text-sm text-dim transition-colors hover:bg-white/10 hover:text-danger"
        >
          ✕
        </button>
        <GameButton size="sm" onClick={onComplete} disabled={busy}>
          {busy ? "…" : "Complete"}
        </GameButton>
      </div>
    </motion.li>
  );
});

export default QuestCard;

const Reward = ({ tint, bg, label }: { tint: string; bg: string; label: string }) => (
  <span
    className="rounded-lg px-2 py-0.5 text-[11px] font-bold"
    style={{ color: tint, background: bg }}
  >
    {label}
  </span>
);
