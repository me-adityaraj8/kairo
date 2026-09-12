"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SPRING } from "@/lib/motion";
import GameButton from "./GameButton";

export const SHORTCUTS: [string, string][] = [
  ["N", "New quest"],
  ["Q", "Quest log"],
  ["S", "Tavern shop"],
  ["A", "Hall of deeds"],
  ["C", "Character"],
  ["B", "Bag"],
  ["F", "Focus mode"],
  ["G", "Open a chest"],
  [",", "Settings"],
  ["H", "This help"],
  ["Esc", "Close"],
];

type Handlers = {
  newQuest: () => void;
  focus: () => void;
  chest: () => void;
  settings: () => void;
  help: () => void;
};

/** Global hotkeys. Ignored while typing or with a modifier held. */
export function useShortcuts(handlers: Handlers) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);
      if (typing) return;

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          handlers.newQuest();
          break;
        case "q":
          router.push("/app");
          break;
        case "s":
          router.push("/app/shop");
          break;
        case "a":
          router.push("/app/achievements");
          break;
        case "b":
          router.push("/app/bag");
          break;
        case "c":
          router.push("/app/character");
          break;
        case "f":
          e.preventDefault();
          handlers.focus();
          break;
        case "g":
          e.preventDefault();
          handlers.chest();
          break;
        case ",":
          e.preventDefault();
          handlers.settings();
          break;
        case "h":
        case "?":
          e.preventDefault();
          handlers.help();
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers, router]);
}

export function ShortcutHelp({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[88] grid place-items-center bg-deep/85 p-5 backdrop-blur-sm">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-title"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={SPRING.snappy}
        className="panel w-full max-w-sm p-5"
      >
        <h2 id="shortcut-title" className="font-display text-base text-gold">
          Controls
        </h2>
        <ul className="mt-4 flex flex-col gap-1.5">
          {SHORTCUTS.map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-dim">{label}</span>
              <kbd className="rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] font-bold text-text">
                {key}
              </kbd>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-end">
          <GameButton variant="ghost" onClick={onClose}>
            Close
          </GameButton>
        </div>
      </motion.div>
    </div>
  );
}
