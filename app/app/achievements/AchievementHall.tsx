"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Ambient from "@/components/game/Ambient";
import GameNav from "@/components/game/GameNav";
import WorldBackground from "@/components/game/WorldBackground";
import AudioControls from "@/components/game/AudioControls";
import Shimmer from "@/components/game/Shimmer";
import { RARITY, Rarity } from "@/lib/rarity";
import { riseIn, stagger } from "@/lib/motion";

type Achievement = {
  key: string;
  title: string;
  description: string;
  icon: string;
  rarity: Rarity;
  target: number;
  progress: number;
  complete: boolean;
  unlocked: boolean;
};

export default function AchievementHall() {
  const [list, setList] = useState<Achievement[] | null>(null);
  const [count, setCount] = useState({ unlocked: 0, total: 0 });

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login?from=/app/achievements";
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setList(d.achievements);
        setCount({ unlocked: d.unlockedCount, total: d.total });
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <WorldBackground />
      <Ambient count={12} />
      <GameNav />

      <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pl-28">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-gold text-glow-gold sm:text-2xl">Hall of Deeds</h1>
            <p className="mt-1 text-sm text-dim">
              {count.unlocked} of {count.total} earned
            </p>
          </div>
          <AudioControls />
        </header>

        {!list ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Shimmer key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={stagger(0.03)}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {list.map((a) => {
              const rarity = RARITY[a.rarity];
              const pct = Math.round((a.progress / a.target) * 100);

              return (
                <motion.li key={a.key} variants={riseIn}>
                  <div
                    className="relative h-full overflow-hidden rounded-2xl border p-3.5 backdrop-blur transition-colors"
                    style={{
                      borderColor: a.unlocked ? rarity.ring : "rgba(255,255,255,.08)",
                      background: a.unlocked ? rarity.sheen : "rgba(255,255,255,.025)",
                      boxShadow: a.unlocked ? `0 0 26px -16px ${rarity.color}` : undefined,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border text-xl ${a.unlocked ? "" : "grayscale"}`}
                        style={{
                          borderColor: a.unlocked ? rarity.ring : "rgba(255,255,255,.1)",
                          background: a.unlocked ? rarity.glow : "rgba(255,255,255,.04)",
                          opacity: a.unlocked ? 1 : 0.45,
                        }}
                      >
                        {a.unlocked ? a.icon : "🔒"}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 truncate text-[14px] font-bold text-text">{a.title}</p>
                          <span
                            className="shrink-0 text-[9px] font-extrabold uppercase tracking-wider"
                            style={{ color: rarity.color }}
                          >
                            {rarity.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-snug text-dim">{a.description}</p>

                        {!a.unlocked && (
                          <div className="mt-2 flex items-center gap-2">
                            <div
                              role="progressbar"
                              aria-label={a.title}
                              aria-valuenow={a.progress}
                              aria-valuemin={0}
                              aria-valuemax={a.target}
                              className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/40"
                            >
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: rarity.color, opacity: 0.75 }}
                              />
                            </div>
                            <span className="shrink-0 text-[10px] tabular-nums text-dim">
                              {a.progress}/{a.target}
                            </span>
                          </div>
                        )}

                        {a.unlocked && (
                          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-xp">
                            ✓ Earned
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>
    </>
  );
}
