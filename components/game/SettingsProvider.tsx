"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ChaosLevel = "off" | "mild" | "moderate" | "extreme";

export type Settings = {
  theme: "dark" | "light";
  cursorEffects: "high" | "low" | "off";
  particles: boolean;
  reducedMotion: boolean;
  chaos: ChaosLevel;
};

const DEFAULTS: Settings = {
  theme: "dark",
  cursorEffects: "high",
  particles: true,
  reducedMotion: false,
  chaos: "off",
};

const KEY = "kairo.settings";

const Ctx = createContext<{
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}>({ settings: DEFAULTS, update: () => {} });

export const useSettings = () => useContext(Ctx);

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const loaded = useRef(false);

  useEffect(() => {
    let next = DEFAULTS;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) next = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {}

    // honour the OS preference unless the player already chose
    if (!localStorage.getItem(KEY) && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      next = { ...next, reducedMotion: true, cursorEffects: "off" };
    }

    setSettings(next);
    loaded.current = true;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? "true" : "false";
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}
