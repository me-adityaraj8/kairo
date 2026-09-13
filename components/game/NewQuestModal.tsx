"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CharacterAttribute, Difficulty } from "@/lib/types";
import { REWARD_PREVIEW, RARITY_FOR_DIFFICULTY, RARITY, attributeIcon } from "@/lib/rarity";
import { SPRING } from "@/lib/motion";
import GameButton from "./GameButton";
import GameInput from "./GameInput";
import { useAudio } from "./AudioProvider";

const DIFFICULTIES: Difficulty[] = ["EASY", "NORMAL", "HARD", "EPIC"];

export default function NewQuestModal({
  attributes,
  onClose,
  onCreate,
}: {
  attributes: CharacterAttribute[];
  onClose: () => void;
  onCreate: (input: {
    title: string;
    attributeId: string;
    difficulty: Difficulty;
    minutes: number | null;
    dueOn: string | null;
  }) => Promise<void>;
}) {
  const reduceMotion = useReducedMotion();
  const [title, setTitle] = useState("");
  const [attributeId, setAttributeId] = useState(attributes[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>("NORMAL");
  const [minutes, setMinutes] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const { play } = useAudio();

  useEffect(() => {
    firstFieldRef.current?.focus();
    play("open");

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Every quest needs a name");
      return;
    }
    setPending(true);
    try {
      const mins = minutes.trim() ? Number(minutes) : null;
      await onCreate({
        title: title.trim(),
        attributeId,
        difficulty,
        minutes: mins && mins > 0 ? mins : null,
        // Treat the picked day as ending at local midnight, so a quest due
        // "today" is not already overdue the moment it is posted.
        dueOn: dueOn ? new Date(`${dueOn}T23:59:59`).toISOString() : null,
      });
      onClose();
    } catch {
      setError("Could not post the quest");
      setPending(false);
    }
  }

  const reward = REWARD_PREVIEW[difficulty];

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center overflow-y-auto bg-deep/85 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-quest-title"
        initial={reduceMotion ? { opacity: 0 } : { y: 60, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={SPRING.snappy}
        className="panel w-full max-w-md rounded-b-none p-5 sm:rounded-b-3xl"
      >
        <h2 id="new-quest-title" className="font-display text-base text-gold">
          New Quest
        </h2>
        <p className="mt-1 text-xs text-dim">Pick a target and a difficulty. Harder quests pay more.</p>

        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4" noValidate>
          <GameInput
            ref={firstFieldRef}
            label="Quest title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            error={error}
            maxLength={120}
            placeholder="Slay the inbox dragon"
          />

          <fieldset className="min-w-0">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-dim">
              Attribute
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {attributes.map((attr) => {
                const active = attr.id === attributeId;
                return (
                  <button
                    key={attr.id}
                    type="button"
                    onClick={() => setAttributeId(attr.id)}
                    aria-pressed={active}
                    className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors
                      ${active ? "border-xp/60 bg-xp/12 text-text" : "border-white/10 bg-white/[0.03] text-dim hover:bg-white/[0.07]"}`}
                  >
                    <span aria-hidden="true" className="text-base">
                      {attributeIcon(attr.name)}
                    </span>
                    <span className="min-w-0 truncate text-[13px] font-semibold">{attr.name}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-dim">
              Difficulty
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DIFFICULTIES.map((d) => {
                const rarity = RARITY[RARITY_FOR_DIFFICULTY[d]];
                const active = d === difficulty;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    aria-pressed={active}
                    className="rounded-xl border px-2 py-2 text-[10px] font-extrabold uppercase tracking-wider transition-all"
                    style={{
                      color: active ? rarity.color : "var(--text-dim)",
                      borderColor: active ? rarity.ring : "rgba(255,255,255,.1)",
                      background: active ? rarity.glow : "rgba(255,255,255,.03)",
                      boxShadow: active ? `0 0 18px -6px ${rarity.color}` : undefined,
                    }}
                  >
                    {rarity.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-dim">
                Minutes <span className="text-white/30">(opt.)</span>
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={600}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="25"
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm text-text
                  placeholder:text-white/25 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/25"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-dim">
                Due <span className="text-white/30">(opt.)</span>
              </span>
              <input
                type="date"
                value={dueOn}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDueOn(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm text-text
                  focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/25
                  [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert"
              />
            </label>
          </div>

          <p className="-mt-1 text-[10px] leading-relaxed text-dim">
            Minutes is your own estimate and the due date is a reminder. Neither changes the payout
            — difficulty decides that, on the server.
          </p>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2.5">
            <span className="text-[11px] font-bold text-xp">+{reward.xp} XP</span>
            <span className="text-dim">·</span>
            <span className="text-[11px] font-bold text-gold">+{reward.gold} Gold</span>
          </div>

          <div className="flex justify-end gap-2 pb-1">
            <GameButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </GameButton>
            <GameButton type="submit" variant="gold" disabled={pending || !title.trim()}>
              {pending ? "Posting…" : "Post Quest"}
            </GameButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
