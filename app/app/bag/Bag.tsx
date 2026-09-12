"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Ambient from "@/components/game/Ambient";
import GameNav from "@/components/game/GameNav";
import WorldBackground from "@/components/game/WorldBackground";
import AudioControls from "@/components/game/AudioControls";
import Shimmer from "@/components/game/Shimmer";
import Toast from "@/components/game/Toast";
import GameButton from "@/components/game/GameButton";
import { RARITY, Rarity } from "@/lib/rarity";
import { riseIn, stagger } from "@/lib/motion";
import { useAudio } from "@/components/game/AudioProvider";
import { useCursor } from "@/components/game/CursorLayer";

type BagItem = {
  slug: string;
  name: string;
  payload: string;
  rarity: string;
  slot: string;
  cost: number;
  equipped: boolean;
};

const SLOTS = ["WEAPON", "ARMOR", "COSMETIC", "COMPANION", "TRINKET"] as const;
const SLOT_ICON: Record<string, string> = {
  WEAPON: "⚔️",
  ARMOR: "🛡️",
  COSMETIC: "👑",
  COMPANION: "🐾",
  TRINKET: "🔮",
};

const ORDER: Record<string, number> = { LEGENDARY: 0, EPIC: 1, RARE: 2, COMMON: 3 };

export default function Bag() {
  const [items, setItems] = useState<BagItem[] | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const { play } = useAudio();
  const { burst } = useCursor();

  const load = useCallback(() => {
    fetch("/api/inventory")
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login?from=/app/bag";
          return null;
        }
        return r.json();
      })
      .then((d) => d && setItems(d.items))
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  async function toggle(item: BagItem) {
    setBusy(item.slug);
    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: item.slug, equipped: !item.equipped }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error ?? "Could not equip that");
        play("error");
        return;
      }
      setItems(data.items);
      if (!item.equipped) {
        play("purchase");
        burst(item.rarity === "LEGENDARY" ? "gold" : "violet");
        setAnnounce(`${item.name} equipped.`);
      } else {
        play("click");
        setAnnounce(`${item.name} unequipped.`);
      }
    } catch {
      play("error");
      setToast("Connection lost");
    } finally {
      setBusy(null);
    }
  }

  const equipped = items?.filter((i) => i.equipped) ?? [];
  const shown =
    items
      ?.filter((i) => filter === "ALL" || i.slot === filter)
      .sort((a, b) => (ORDER[a.rarity] ?? 9) - (ORDER[b.rarity] ?? 9)) ?? [];

  return (
    <>
      <WorldBackground />
      <Ambient count={10} />
      <GameNav />

      <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pl-28">
        <div aria-live="polite" className="sr-only">
          {announce}
        </div>

        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-gold text-glow-gold sm:text-2xl">Bag</h1>
            <p className="mt-1 text-sm text-dim">
              {items ? `${items.length} item${items.length === 1 ? "" : "s"} collected` : "Loading…"}
            </p>
          </div>
          <AudioControls />
        </header>

        {/* equipment slots */}
        <section aria-label="Equipped" className="panel mb-5 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-dim">Equipped</p>
          <div className="grid grid-cols-5 gap-2">
            {SLOTS.map((slot) => {
              const worn = equipped.find((i) => i.slot === slot);
              const rarity = worn ? RARITY[worn.rarity as Rarity] : null;
              return (
                <div key={slot} className="flex flex-col items-center gap-1.5">
                  <div
                    className="grid aspect-square w-full place-items-center rounded-xl border text-2xl transition-colors"
                    style={{
                      borderColor: rarity?.ring ?? "rgba(255,255,255,.1)",
                      background: rarity?.glow ?? "rgba(255,255,255,.03)",
                      boxShadow: rarity ? `0 0 20px -8px ${rarity.color}` : undefined,
                    }}
                    title={worn?.name ?? `Empty ${slot.toLowerCase()} slot`}
                  >
                    {worn ? worn.payload : <span className="opacity-25">{SLOT_ICON[slot]}</span>}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-dim">
                    {slot.slice(0, 6)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* filters */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {["ALL", ...SLOTS].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors
                ${filter === f ? "border-gold/60 bg-gold/15 text-gold" : "border-white/12 bg-white/[0.04] text-dim hover:text-text"}`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {!items ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Shimmer key={i} className="h-24" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="panel px-6 py-12 text-center">
            <span aria-hidden="true" className="block animate-float text-5xl">
              🎒
            </span>
            <p className="mt-4 font-display text-base text-text">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-dim">
              Buy something in the shop, or finish quests to earn chests.
            </p>
          </div>
        ) : (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={stagger(0.04)}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {shown.map((item) => {
                const rarity = RARITY[item.rarity as Rarity] ?? RARITY.COMMON;
                return (
                  <motion.li key={item.slug} layout variants={riseIn}>
                    <div
                      className="flex h-full items-center gap-3 rounded-2xl border p-3 backdrop-blur"
                      style={{
                        borderColor: item.equipped ? rarity.ring : "rgba(255,255,255,.09)",
                        background: item.equipped ? rarity.sheen : "rgba(255,255,255,.03)",
                        boxShadow: item.equipped ? `0 0 24px -14px ${rarity.color}` : undefined,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border text-2xl"
                        style={{ borderColor: rarity.ring, background: rarity.glow }}
                      >
                        {item.payload}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-text">{item.name}</p>
                        <p
                          className="text-[9px] font-extrabold uppercase tracking-wider"
                          style={{ color: rarity.color }}
                        >
                          {rarity.label} · {item.slot.toLowerCase()}
                        </p>
                      </div>

                      <GameButton
                        size="sm"
                        variant={item.equipped ? "ghost" : "gold"}
                        disabled={busy === item.slug}
                        onClick={() => toggle(item)}
                      >
                        {busy === item.slug ? "…" : item.equipped ? "Remove" : "Equip"}
                      </GameButton>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
