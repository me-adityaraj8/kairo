"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import GameButton from "./GameButton";
import FocusSounds from "./FocusSounds";
import { useAudio } from "./AudioProvider";
import { SPRING } from "@/lib/motion";

type ActiveSession = { id: string; minutes: number; startedAt: string };

const PRESETS = [15, 25, 45];

export default function FocusMode({
  open,
  onClose,
  onFinished,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  onFinished: (result: { xpGained: number; goldGained: number; minutes: number; leveledUp: boolean; events: unknown[]; user: { level: number; xp: number; xpToNext: number; gold: number } }) => void;
  onStarted: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [minutes, setMinutes] = useState(25);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [soundsOpen, setSoundsOpen] = useState(false);
  const claiming = useRef(false);
  const { play, mix, resumeMix, stopAllAmbient } = useAudio();

  const activeSounds = Object.values(mix).filter((m) => m?.on).length;

  // recover an in-flight session so a refresh does not lose it
  useEffect(() => {
    if (!open) return;
    fetch("/api/focus")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.active && setSession(d.active))
      .catch(() => {});
  }, [open]);

  const finish = useCallback(
    async (id: string) => {
      if (claiming.current) return;
      claiming.current = true;
      try {
        const res = await fetch("/api/focus", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const data = await res.json();
        if (res.ok) {
          setSession(null);
          play("focusEnd");
          stopAllAmbient(); // soundscape fades out with the session
          onFinished(data);
        } else {
          setError(data.error ?? "Could not finish the session");
        }
      } catch {
        setError("Connection lost");
      } finally {
        claiming.current = false;
      }
    },
    [onFinished]
  );

  // countdown driven by wall clock, so tab throttling cannot skew it
  useEffect(() => {
    if (!session) return;
    const endsAt = new Date(session.startedAt).getTime() + session.minutes * 60_000;

    const tick = () => {
      const left = Math.max(0, endsAt - Date.now());
      setRemaining(left);
      if (left === 0) finish(session.id);
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [session, finish]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !session && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, session]);

  async function start() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes }),
      });
      const data = await res.json();
      if (res.ok) {
        setSession(data);
        play("focusStart");
        resumeMix(); // fade the player's soundscape back in
        onStarted();
      } else setError(data.error ?? "Could not start");
    } catch {
      setError("Connection lost");
    } finally {
      setBusy(false);
    }
  }

  async function abandon() {
    setSession(null);
    stopAllAmbient();
    await fetch("/api/focus", { method: "DELETE" }).catch(() => {});
  }

  if (!open) return null;

  const total = (session?.minutes ?? minutes) * 60_000;
  const pct = session ? ((total - remaining) / total) * 100 : 0;
  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Focus mode"
        className="fixed inset-0 z-[80] grid place-items-center px-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-deep/95 backdrop-blur-md" />

        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={SPRING.snappy}
          className="relative w-full max-w-sm text-center"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-dim">Focus Session</p>

          {/* dial */}
          <div className="relative mx-auto mt-6 h-52 w-52">
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
              <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
              <motion.circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="var(--xp)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 88}
                initial={false}
                animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - pct / 100) }}
                transition={{ duration: 0.5, ease: "linear" }}
                style={{ filter: "drop-shadow(0 0 8px var(--xp))" }}
              />
            </svg>

            <div className="absolute inset-0 grid place-items-center">
              {session ? (
                <div>
                  <p className="font-display text-4xl text-text tabular-nums">
                    {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-[11px] text-dim">stay with it</p>
                </div>
              ) : (
                <div>
                  <p className="font-display text-4xl text-text">{minutes}</p>
                  <p className="mt-1 text-[11px] text-dim">minutes</p>
                </div>
              )}
            </div>
          </div>

          {!session && (
            <div className="mt-6 flex justify-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setMinutes(p)}
                  aria-pressed={minutes === p}
                  className={`rounded-xl border px-4 py-2 text-xs font-bold transition-colors
                    ${minutes === p ? "border-xp/60 bg-xp/12 text-xp" : "border-white/12 bg-white/[0.04] text-dim hover:text-text"}`}
                >
                  {p}m
                </button>
              ))}
            </div>
          )}

          {error && <p className="mt-4 text-xs text-danger">{error}</p>}

          <div className="mt-7 flex justify-center gap-3">
            {session ? (
              <GameButton variant="ghost" onClick={abandon}>
                Give up
              </GameButton>
            ) : (
              <>
                <GameButton variant="ghost" onClick={onClose}>
                  Close
                </GameButton>
                <GameButton variant="primary" onClick={start} disabled={busy}>
                  {busy ? "Starting…" : "Begin focus"}
                </GameButton>
              </>
            )}
          </div>

          <p className="mt-5 text-[11px] leading-relaxed text-dim">
            {session
              ? "Rewards are paid when the timer reaches zero."
              : `${minutes} minutes earns about ${Math.round(minutes * 2.5)} XP and ${Math.round(minutes * 0.8)} gold.`}
          </p>

          {/* compact sound mixer, tucked away so it never crowds the timer */}
          <div className="relative mt-5">
            <FocusSounds open={soundsOpen} onClose={() => setSoundsOpen(false)} />
            <button
              onClick={() => setSoundsOpen((v) => !v)}
              aria-expanded={soundsOpen}
              className="mx-auto flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-xs font-semibold text-text backdrop-blur transition-colors hover:bg-white/[0.1]"
            >
              <span aria-hidden="true">🎧</span>
              Focus sounds
              {activeSounds > 0 && (
                <span className="rounded-md bg-xp/20 px-1.5 py-0.5 text-[10px] font-bold text-xp">
                  {activeSounds}
                </span>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
