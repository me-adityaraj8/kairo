"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSettings } from "./SettingsProvider";
import { useAudio } from "./AudioProvider";
import { SPRING } from "@/lib/motion";
import GameButton from "./GameButton";

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, update } = useSettings();
  const { settings: audio, update: updateAudio } = useAudio();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const f = ref.current?.querySelectorAll<HTMLElement>("button,input,select");
      if (!f?.length) return;
      const first = f[0];
      const last = f[f.length - 1];
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
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[88] flex items-end justify-center bg-deep/85 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={SPRING.snappy}
        className="panel max-h-[85vh] w-full max-w-md overflow-y-auto rounded-b-none p-5 sm:rounded-b-3xl"
      >
        <h2 id="settings-title" className="font-display text-base text-gold">
          Settings
        </h2>

        <Group label="Appearance">
          <Choice
            label="Theme"
            value={settings.theme}
            options={[
              ["dark", "Dark"],
              ["light", "Light"],
            ]}
            onChange={(v) => update({ theme: v as "dark" | "light" })}
          />
        </Group>

        <Group label="Environment">
          <Choice
            label="Cursor effects"
            value={settings.cursorEffects}
            options={[
              ["high", "Full"],
              ["low", "Subtle"],
              ["off", "Off"],
            ]}
            onChange={(v) => update({ cursorEffects: v as "high" | "low" | "off" })}
          />
          <Toggle
            label="Reduced motion"
            hint="Stops idle animation and particles"
            checked={settings.reducedMotion}
            onChange={(v) => update({ reducedMotion: v, ...(v ? { cursorEffects: "off" as const } : {}) })}
          />
          <Choice
            label="Chaos mode"
            value={settings.chaos}
            options={[
              ["off", "Off"],
              ["mild", "Mild"],
              ["moderate", "More"],
              ["extreme", "Max"],
            ]}
            onChange={(v) => update({ chaos: v as never })}
          />
        </Group>

        <Group label="Audio">
          <Toggle
            label="Sound"
            hint="Music and effects"
            checked={!audio.muted}
            onChange={(v) => updateAudio({ muted: !v })}
          />
          <Range
            label="Focus ambience"
            value={audio.ambient}
            disabled={audio.muted}
            onChange={(v) => updateAudio({ ambient: v })}
          />
          <Range
            label="Effects"
            value={audio.sfx}
            disabled={audio.muted}
            onChange={(v) => updateAudio({ sfx: v })}
          />
        </Group>

        <div className="mt-6 flex justify-end">
          <GameButton variant="gold" onClick={onClose}>
            Done
          </GameButton>
        </div>
      </motion.div>
    </div>
  );
}

const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <section className="mt-5">
    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-dim">{label}</p>
    <div className="flex flex-col gap-3">{children}</div>
  </section>
);

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold text-text">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, text]) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            aria-pressed={value === v}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors
              ${value === v ? "border-gold/60 bg-gold/15 text-gold" : "border-white/12 bg-white/[0.04] text-dim hover:text-text"}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-text">{label}</span>
        {hint && <span className="block text-[11px] text-dim">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-xp/70" : "bg-white/15"}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${checked ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  );
}

function Range({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className={`block ${disabled ? "opacity-40" : ""}`}>
      <span className="mb-1 flex items-center justify-between text-[13px] font-semibold text-text">
        {label}
        <span className="text-[11px] text-dim">{Math.round(value * 100)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-gold
          [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
      />
    </label>
  );
}
