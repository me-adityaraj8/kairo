"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING } from "@/lib/motion";
import type { ActivityDay } from "./Heatmap";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

const NavBtn = ({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="rounded-lg px-2 py-1 text-dim transition-colors hover:bg-white/10 hover:text-text disabled:opacity-25 disabled:hover:bg-transparent"
  >
    {children}
  </button>
);

export default function ActivityCalendar({
  activity,
  today,
}: {
  activity: ActivityDay[];
  today: string;
}) {
  const byDay = useMemo(() => new Map(activity.map((a) => [a.day, a])), [activity]);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const view = useMemo(() => {
    const base = new Date(`${today}T00:00:00Z`);
    base.setUTCDate(1);
    base.setUTCMonth(base.getUTCMonth() + offset);
    return base;
  }, [today, offset]);

  const cells = useMemo(() => {
    const year = view.getUTCFullYear();
    const month = view.getUTCMonth();
    const first = new Date(Date.UTC(year, month, 1));
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const out: (string | null)[] = Array(first.getUTCDay()).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(new Date(Date.UTC(year, month, d)).toISOString().slice(0, 10));
    }
    return out;
  }, [view]);

  const monthTotals = useMemo(() => {
    let quests = 0;
    let xp = 0;
    let focus = 0;
    for (const c of cells) {
      if (!c) continue;
      const d = byDay.get(c);
      if (!d) continue;
      quests += d.quests;
      xp += d.xp;
      focus += d.focusMinutes;
    }
    return { quests, xp, focus };
  }, [cells, byDay]);

  const detail = selected ? byDay.get(selected) : undefined;

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-1">
        <div className="flex items-center gap-0.5">
          <NavBtn label="Previous year" onClick={() => setOffset((o) => o - 12)}>
            «
          </NavBtn>
          <NavBtn label="Previous month" onClick={() => setOffset((o) => o - 1)}>
            ‹
          </NavBtn>
        </div>

        <button
          onClick={() => setOffset(0)}
          className="min-w-0 rounded-lg px-2 py-1 text-center transition-colors hover:bg-white/10"
          title="Jump to this month"
        >
          <span className="block truncate text-[12px] font-bold text-text">
            {MONTHS[view.getUTCMonth()]} {view.getUTCFullYear()}
          </span>
          {offset !== 0 && <span className="block text-[9px] text-dim">tap for today</span>}
        </button>

        <div className="flex items-center gap-0.5">
          <NavBtn label="Next month" onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset >= 0}>
            ›
          </NavBtn>
          <NavBtn label="Next year" onClick={() => setOffset((o) => Math.min(0, o + 12))} disabled={offset >= -11}>
            »
          </NavBtn>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DOW.map((d, i) => (
          <span key={i} className="pb-1 text-[10px] font-bold text-dim">
            {d}
          </span>
        ))}

        {cells.map((day, i) => {
          if (!day) return <span key={`x${i}`} />;
          const d = byDay.get(day);
          const active = !!d && (d.quests > 0 || d.focusMinutes > 0);
          const isToday = day === today;
          const num = Number(day.slice(-2));

          return (
            <button
              key={day}
              onClick={() => setSelected(selected === day ? null : day)}
              aria-pressed={selected === day}
              className="relative grid aspect-square place-items-center rounded-lg text-[11px] transition-colors"
              style={{
                background: active ? "rgba(76,230,207,.16)" : "rgba(255,255,255,.03)",
                color: active ? "var(--xp)" : "var(--text-dim)",
                outline: isToday ? "1px solid var(--gold)" : selected === day ? "1px solid var(--xp)" : undefined,
              }}
            >
              {num}
              {active && (
                <span
                  className="absolute bottom-1 h-1 w-1 rounded-full"
                  style={{ background: "var(--xp)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {detail ? (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING.snappy}
            className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
          >
            <p className="text-[11px] font-bold text-text">{selected}</p>
            <p className="mt-0.5 text-[11px] text-dim">
              {detail.quests} quests · {detail.xp} XP · {detail.focusMinutes}m focus
            </p>
          </motion.div>
        ) : (
          <motion.p
            key="totals"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-center text-[11px] text-dim"
          >
            This month: {monthTotals.quests} quests · {monthTotals.xp} XP · {monthTotals.focus}m focus
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
