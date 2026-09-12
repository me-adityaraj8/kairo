"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type ActivityDay = { day: string; quests: number; xp: number; focusMinutes: number };

const WEEKS = 26;
const DAY_MS = 86400000;

/** Intensity buckets tuned so a normal day lands mid-scale. */
function level(d: ActivityDay | undefined) {
  if (!d) return 0;
  const score = d.quests * 2 + d.xp / 120 + d.focusMinutes / 20;
  if (score <= 0) return 0;
  if (score < 2) return 1;
  if (score < 5) return 2;
  if (score < 10) return 3;
  return 4;
}

const TINTS = [
  "rgba(255,255,255,.05)",
  "rgba(76,230,207,.28)",
  "rgba(76,230,207,.5)",
  "rgba(76,230,207,.75)",
  "rgba(255,197,66,.92)",
];

export default function Heatmap({ activity, today }: { activity: ActivityDay[]; today: string }) {
  const reduceMotion = useReducedMotion();
  const [hover, setHover] = useState<{ day: string; d?: ActivityDay } | null>(null);

  const byDay = useMemo(() => new Map(activity.map((a) => [a.day, a])), [activity]);

  // build a grid ending on today, aligned so each column is a week
  const days = useMemo(() => {
    const end = new Date(`${today}T00:00:00Z`);
    const total = WEEKS * 7;
    const start = new Date(end.getTime() - (total - 1) * DAY_MS);
    // shift back to the most recent Sunday on or before start
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());

    const out: string[] = [];
    for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
      out.push(new Date(t).toISOString().slice(0, 10));
    }
    return out;
  }, [today]);

  const columns = useMemo(() => {
    const cols: string[][] = [];
    for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));
    return cols;
  }, [days]);

  const activeDays = activity.filter((a) => a.quests > 0 || a.focusMinutes > 0).length;

  return (
    <div className="panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-dim">Activity</h2>
        <span className="text-[11px] text-dim">{activeDays} active days</span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex gap-[3px]" style={{ minWidth: columns.length * 15 }}>
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((day) => {
                const d = byDay.get(day);
                const lv = level(d);
                const future = day > today;
                return (
                  <motion.div
                    key={day}
                    onMouseEnter={() => setHover({ day, d })}
                    onMouseLeave={() => setHover(null)}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                    animate={{ opacity: future ? 0.25 : 1, scale: 1 }}
                    transition={{ delay: Math.min(0.4, ci * 0.006) }}
                    className="h-3 w-3 rounded-[3px]"
                    style={{
                      background: future ? "rgba(255,255,255,.03)" : TINTS[lv],
                      boxShadow: lv >= 3 ? `0 0 8px ${TINTS[lv]}` : undefined,
                    }}
                    title={`${day}: ${d?.quests ?? 0} quests, ${d?.xp ?? 0} XP, ${d?.focusMinutes ?? 0}m focus`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-h-[16px] text-[11px] text-dim">
          {hover ? (
            <>
              <span className="text-text">{hover.day}</span>
              {" · "}
              {hover.d
                ? `${hover.d.quests} quests · ${hover.d.xp} XP · ${hover.d.focusMinutes}m focus`
                : "nothing logged"}
            </>
          ) : (
            "Hover a day for detail"
          )}
        </p>

        <div className="flex shrink-0 items-center gap-1">
          <span className="text-[10px] text-dim">less</span>
          {TINTS.map((t, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: t }} />
          ))}
          <span className="text-[10px] text-dim">more</span>
        </div>
      </div>
    </div>
  );
}
