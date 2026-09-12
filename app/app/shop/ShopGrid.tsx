"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PixelPanel from "@/components/PixelPanel";
import PixelButton from "@/components/PixelButton";
import GoldCounter from "@/components/GoldCounter";
import Skeleton from "@/components/Skeleton";
import Toast from "@/components/Toast";

type ShopItem = {
  slug: string;
  name: string;
  cost: number;
  payload: string;
  owned: boolean;
};

export default function ShopGrid() {
  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [gold, setGold] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [buying, setBuying] = useState<string | null>(null);

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

  async function buy(item: ShopItem) {
    setBuying(item.slug);
    try {
      const res = await fetch(`/api/shop/${item.slug}/buy`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setToast(data.error ?? "Purchase failed");
        return;
      }

      setGold(data.gold);
      setItems((prev) =>
        prev ? prev.map((i) => (i.slug === item.slug ? { ...i, owned: true } : i)) : prev
      );
      setAnnouncement(`Purchased ${item.name}. ${data.gold} gold remaining.`);
    } catch {
      setToast("Connection lost - purchase not saved");
    } finally {
      setBuying(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6">
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-pixel text-sm text-gold sm:text-base">Tavern Shop</h1>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-muted">
            Gold <GoldCounter value={gold} />
          </span>
          <Link href="/app" className="font-pixel text-[10px] text-muted underline hover:text-text">
            Quest Log
          </Link>
        </div>
      </header>

      {!items ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const affordable = gold >= item.cost;
            return (
              <li key={item.slug}>
                <PixelPanel className="h-full">
                  <div className="flex h-full flex-col items-center gap-3 text-center">
                    <span className="text-3xl" aria-hidden="true">
                      {item.payload}
                    </span>
                    <p className="font-mono text-sm text-text">{item.name}</p>
                    {item.owned ? (
                      <p className="mt-auto font-pixel text-[10px] text-xp">Owned</p>
                    ) : (
                      <>
                        <p
                          className={`font-pixel text-[10px] ${affordable ? "text-gold" : "text-danger"}`}
                        >
                          {item.cost} Gold
                        </p>
                        <PixelButton
                          className="mt-auto"
                          disabled={!affordable || buying === item.slug}
                          onClick={() => buy(item)}
                        >
                          {buying === item.slug ? "..." : "Buy"}
                        </PixelButton>
                      </>
                    )}
                  </div>
                </PixelPanel>
              </li>
            );
          })}
        </ul>
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}
