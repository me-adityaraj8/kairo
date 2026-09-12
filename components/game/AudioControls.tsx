"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAudio } from "./AudioProvider";
import { SPRING } from "@/lib/motion";

export default function AudioControls() {
  const { settings, update, play, ready } = useAudio();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClickAway = (e: MouseEvent) => {
      if (
        !panelRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickAway);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickAway);
    };
  }, [open]);

  const muted = settings.muted;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          setOpen((v) => !v);
          play("click");
        }}
        aria-expanded={open}
        aria-label={muted ? "Audio settings (currently muted)" : "Audio settings"}
        className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[0.06] text-base backdrop-blur transition-colors hover:bg-white/[0.12]"
      >
        <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="group"
            aria-label="Audio settings"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={SPRING.snappy}
            className="panel absolute right-0 z-50 mt-2 w-60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-dim">Audio</p>
              <button
                onClick={() => {
                  update({ muted: !muted });
                  if (muted) play("click");
                }}
                aria-pressed={muted}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors
                  ${muted ? "bg-danger/20 text-danger" : "bg-xp/15 text-xp"}`}
              >
                {muted ? "Muted" : "On"}
              </button>
            </div>

            <Slider
              label="Music"
              value={settings.music}
              disabled={muted}
              onChange={(v) => update({ music: v })}
            />
            <Slider
              label="Effects"
              value={settings.sfx}
              disabled={muted}
              onChange={(v) => update({ sfx: v })}
              onCommit={() => play("coin")}
            />

            {!ready && (
              <p className="mt-3 text-[10px] leading-relaxed text-dim">
                Sound starts after your first tap.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Slider({
  label,
  value,
  disabled,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  onCommit?: () => void;
}) {
  return (
    <label className={`mt-4 block ${disabled ? "opacity-40" : ""}`}>
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-text">
        {label}
        <span className="text-dim">{Math.round(value * 100)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        onKeyUp={onCommit}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-gold
          [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
      />
    </label>
  );
}
