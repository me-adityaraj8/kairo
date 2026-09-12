"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Ambient from "@/components/game/Ambient";
import GameNav from "@/components/game/GameNav";
import Counter from "@/components/game/Counter";
import Shimmer from "@/components/game/Shimmer";
import Toast from "@/components/game/Toast";
import ShopItem, { ShopEntry } from "@/components/game/ShopItem";
import RewardFlight, { Flight } from "@/components/game/RewardFlight";
import WorldBackground from "@/components/game/WorldBackground";
import AudioControls from "@/components/game/AudioControls";
import { useAudio } from "@/components/game/AudioProvider";
import { riseIn, stagger } from "@/lib/motion";

export default function ShopGrid() {
  const [items, setItems] = useState<ShopEntry[] | null>(null);
  const [gold, setGold] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [buying, setBuying] = useState<string | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);

  const goldAnchor = useRef<HTMLDivElement>(null);
  const flightId = useRef(0);
  const { play } = useAudio();

  const load = useCallback(async () => {
    const res = await fetch("/api/shop");
    if (res.status === 401) {
      window.location.href = "/login?from=/app/shop";
      return;
    }
    const data = await res.json();
    setItems(data.items);
    setGold(data.gold);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function buy(item: ShopEntry, origin: DOMRect | null) {
    setBuying(item.slug);
    try {
      const res = await fetch(`/api/shop/${item.slug}/buy`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        play("error");
        setToast(data.error ?? "Purchase failed");
        return;
      }

      play("purchase");

      const goldBox = goldAnchor.current?.getBoundingClientRect();
      if (origin && goldBox) {
        const id = ++flightId.current;
        setFlights((prev) => [
          ...prev,
          {
            id,
            from: { x: origin.left + origin.width / 2, y: origin.top + origin.height / 2 },
            toGold: { x: goldBox.left + goldBox.width / 2, y: goldBox.top + goldBox.height / 2 },
            toXp: { x: goldBox.left + goldBox.width / 2, y: goldBox.top + goldBox.height / 2 },
            xp: 0,
            gold: item.cost,
          },
        ]);
      }

      setGold(data.gold);
      setItems((prev) => (prev ? prev.map((i) => (i.slug === item.slug ? { ...i, owned: true } : i)) : prev));
      setAnnouncement(`Purchased ${item.name}. ${data.gold} gold remaining.`);
    } catch {
      play("error");
      setToast("Connection lost — purchase not saved");
    } finally {
      setBuying(null);
    }
  }

  return (
    <>
      <WorldBackground />
      <Ambient count={12} />
      <GameNav />

      <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pl-28">
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>

        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-gold text-glow-gold sm:text-2xl">Tavern Shop</h1>
            <p className="mt-1 text-sm text-dim">Trophies for the work you already finished.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div
              ref={goldAnchor}
              className="flex items-center gap-2 rounded-xl border border-gold/35 bg-gold/12 px-3.5 py-2 backdrop-blur"
            >
              <span aria-hidden="true">🪙</span>
              <Counter value={gold} className="text-base" />
            </div>
            <AudioControls />
          </div>
        </header>

        {!items ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Shimmer key={i} className="h-64" />
            ))}
          </div>
        ) : (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={stagger(0.05)}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {items.map((item) => (
              <motion.div key={item.slug} variants={riseIn} className="contents">
                <ShopItem
                  item={item}
                  affordable={gold >= item.cost}
                  busy={buying === item.slug}
                  onBuy={(origin) => buy(item, origin)}
                />
              </motion.div>
            ))}
          </motion.ul>
        )}
      </div>

      <RewardFlight flights={flights} onDone={(id) => setFlights((p) => p.filter((f) => f.id !== id))} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
