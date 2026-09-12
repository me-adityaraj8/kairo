"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Ambient from "@/components/game/Ambient";
import GameNav from "@/components/game/GameNav";
import WorldBackground from "@/components/game/WorldBackground";
import AudioControls from "@/components/game/AudioControls";
import Shimmer from "@/components/game/Shimmer";
import CharacterStage from "@/components/game/CharacterStage";
import AttributeOrbs from "@/components/game/AttributeOrbs";
import Heatmap, { ActivityDay } from "@/components/game/Heatmap";
import ActivityCalendar from "@/components/game/ActivityCalendar";
import { RARITY, Rarity } from "@/lib/rarity";
import { TIERS, nextTier, tierFor } from "@/lib/evolution";
import { STAGES } from "@/lib/companion";
import Creature from "@/components/game/Creature";
import { STREAK_CHESTS } from "@/lib/chests";
import { riseIn, stagger } from "@/lib/motion";

type Stats = {
  today: string;
  user: {
    displayName: string; level: number; xp: number; xpToNext: number; gold: number;
    streak: number; longestStreak: number; totalXpEarned: number; questsCompleted: number;
    focusMinutes: number; chestsOpened: number; joinedAt: string;
  };
  attributes: { id: string; name: string; level: number; xp: number; xpToNext: number }[];
  companion: { name: string; species: string; stage: string; stageTitle: string; face: string; tint: string; bond: number; personality: string } | null;
  owned: { slug: string; name: string; payload: string; rarity: string; slot: string; equipped: boolean }[];
  activity: ActivityDay[];
  questsByDifficulty: Record<string, number>;
  focusSessions: number;
  achievements: { unlocked: number; total: number; recent: { key: string; title: string; icon: string; rarity: string }[] };
};

const MILESTONES = Object.keys(STREAK_CHESTS).map(Number).sort((a, b) => a - b);

export default function CharacterScreen() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login?from=/app/character";
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((d) => d?.user && setStats(d))
      .catch(() => {});
  }, []);

  return (
    <>
      <WorldBackground />
      <Ambient count={10} />
      <GameNav />

      <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pl-28">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-gold text-glow-gold sm:text-2xl">Character</h1>
            <p className="mt-1 text-sm text-dim">Your record so far.</p>
          </div>
          <AudioControls />
        </header>

        {!stats ? (
          <div className="flex flex-col gap-4">
            <Shimmer className="h-80" />
            <Shimmer className="h-40" />
            <Shimmer className="h-48" />
          </div>
        ) : (
          <motion.div initial="hidden" animate="show" variants={stagger(0.07)} className="flex flex-col gap-5">
            {/* hero + evolution ladder */}
            <motion.section variants={riseIn} className="panel overflow-hidden">
              <CharacterStage
                displayName={stats.user.displayName}
                level={stats.user.level}
                owned={stats.owned}
                celebrate={false}
              />

              <div className="border-t border-white/8 p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-dim">Evolution</p>
                <ol className="flex flex-wrap items-center gap-2">
                  {TIERS.map((t) => {
                    const reached = stats.user.level >= t.minLevel;
                    const current = tierFor(stats.user.level).title === t.title;
                    return (
                      <li
                        key={t.title}
                        className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5"
                        style={{
                          borderColor: current ? t.ring : reached ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.06)",
                          background: current ? `${t.tint}1f` : "transparent",
                          opacity: reached ? 1 : 0.4,
                        }}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: reached ? t.tint : "rgba(255,255,255,.2)" }}
                        />
                        <span
                          className="text-[11px] font-bold"
                          style={{ color: current ? t.tint : "var(--text-dim)" }}
                        >
                          {t.title}
                        </span>
                        <span className="text-[10px] text-dim">Lv {t.minLevel}</span>
                      </li>
                    );
                  })}
                </ol>
                {nextTier(stats.user.level) && (
                  <p className="mt-2 text-[11px] text-dim">
                    {nextTier(stats.user.level)!.minLevel - stats.user.level} levels to{" "}
                    {nextTier(stats.user.level)!.title}
                  </p>
                )}
              </div>
            </motion.section>

            {/* stat grid */}
            <motion.section variants={riseIn}>
              <h2 className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-dim">Record</h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                <Stat label="Total XP" value={stats.user.totalXpEarned.toLocaleString()} icon="✨" tint="var(--xp)" />
                <Stat label="Quests done" value={stats.user.questsCompleted} icon="⚔️" tint="var(--epic)" />
                <Stat label="Gold" value={stats.user.gold.toLocaleString()} icon="🪙" tint="var(--gold)" />
                <Stat label="Current streak" value={`${stats.user.streak}d`} icon="🔥" tint="var(--danger)" />
                <Stat label="Longest streak" value={`${stats.user.longestStreak}d`} icon="🏅" tint="var(--legendary)" />
                <Stat label="Focus time" value={`${Math.floor(stats.user.focusMinutes / 60)}h ${stats.user.focusMinutes % 60}m`} icon="🧘" tint="var(--xp)" />
                <Stat label="Focus sessions" value={stats.focusSessions} icon="🎯" tint="var(--blue)" />
                <Stat label="Chests opened" value={stats.user.chestsOpened} icon="🎁" tint="var(--gold)" />
                <Stat label="Items owned" value={stats.owned.length} icon="🎒" tint="var(--rare)" />
                <Stat
                  label="Achievements"
                  value={`${stats.achievements.unlocked}/${stats.achievements.total}`}
                  icon="🏆"
                  tint="var(--legendary)"
                />
              </div>
            </motion.section>

            {/* attributes */}
            <motion.section variants={riseIn}>
              <h2 className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-dim">Attributes</h2>
              <AttributeOrbs attributes={stats.attributes} flashId={null} />
            </motion.section>

            {/* quests by rarity */}
            <motion.section variants={riseIn} className="panel p-4">
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-dim">
                Completed by rarity
              </h2>
              <div className="flex flex-col gap-2">
                {(["EASY", "NORMAL", "HARD", "EPIC"] as const).map((diff) => {
                  const label = { EASY: "COMMON", NORMAL: "RARE", HARD: "EPIC", EPIC: "LEGENDARY" }[diff] as Rarity;
                  const r = RARITY[label];
                  const count = stats.questsByDifficulty[diff] ?? 0;
                  const max = Math.max(1, ...Object.values(stats.questsByDifficulty));
                  return (
                    <div key={diff} className="flex items-center gap-2.5">
                      <span className="w-[76px] shrink-0 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: r.color }}>
                        {r.label}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/40">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: r.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / max) * 100}%` }}
                          transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-dim">{count}</span>
                    </div>
                  );
                })}
              </div>
            </motion.section>

            {/* streak milestones */}
            <motion.section variants={riseIn} className="panel p-4">
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-dim">
                Streak milestones
              </h2>
              <ol className="flex flex-wrap gap-2">
                {MILESTONES.map((m) => {
                  const reached = stats.user.longestStreak >= m;
                  const rarity = RARITY[STREAK_CHESTS[m] as Rarity];
                  return (
                    <li
                      key={m}
                      className="flex items-center gap-2 rounded-xl border px-3 py-2"
                      style={{
                        borderColor: reached ? rarity.ring : "rgba(255,255,255,.08)",
                        background: reached ? rarity.glow : "rgba(255,255,255,.02)",
                        opacity: reached ? 1 : 0.5,
                      }}
                    >
                      <span aria-hidden="true">{reached ? "🎁" : "🔒"}</span>
                      <span className="text-[12px] font-bold text-text">{m} days</span>
                      <span className="text-[9px] font-extrabold uppercase" style={{ color: rarity.color }}>
                        {rarity.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </motion.section>

            {/* companion */}
            {stats.companion && (
              <motion.section variants={riseIn} className="panel p-4">
                <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-dim">Companion</h2>
                <div className="flex items-center gap-4">
                  <Creature species={stats.companion.species} size={64} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-text">{stats.companion.name}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: stats.companion.tint }}>
                      {stats.companion.stageTitle} · {stats.companion.personality.toLowerCase()}
                    </p>
                    <p className="mt-1 text-[11px] text-dim">{stats.companion.bond} bond</p>
                  </div>
                </div>
                <ol className="mt-3 flex flex-wrap gap-1.5">
                  {STAGES.map((s) => {
                    const reached = stats.companion!.bond >= s.bond;
                    return (
                      <li
                        key={s.stage}
                        className="flex items-center gap-1.5 rounded-lg border px-2 py-1"
                        style={{
                          borderColor: reached ? `${s.tint}88` : "rgba(255,255,255,.07)",
                          opacity: reached ? 1 : 0.4,
                        }}
                      >
                        <span className="text-sm">{s.face}</span>
                        <span className="text-[10px] font-bold" style={{ color: reached ? s.tint : "var(--text-dim)" }}>
                          {s.title}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </motion.section>
            )}

            <motion.div variants={riseIn}>
              <Heatmap activity={stats.activity} today={stats.today} />
            </motion.div>

            <motion.div variants={riseIn}>
              <ActivityCalendar activity={stats.activity} today={stats.today} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </>
  );
}

const Stat = ({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  tint: string;
}) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
    <span aria-hidden="true" className="text-base">
      {icon}
    </span>
    <p className="mt-1 font-display text-sm" style={{ color: tint }}>
      {value}
    </p>
    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-dim">{label}</p>
  </div>
);
