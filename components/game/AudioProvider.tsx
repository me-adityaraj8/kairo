"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AudioSettings, DEFAULT_SETTINGS, Sfx, audio } from "@/lib/audio";
import { AmbientId, ambient } from "@/lib/ambient";

const SETTINGS_KEY = "kairo.audio";
const MIX_KEY = "kairo.focusMix";

export type FocusMix = Partial<Record<AmbientId, { on: boolean; level: number }>>;

type Value = {
  settings: AudioSettings;
  update: (patch: Partial<AudioSettings>) => void;
  play: (sound: Sfx) => void;
  ready: boolean;
  mix: FocusMix;
  toggleAmbient: (id: AmbientId) => void;
  setAmbientLevel: (id: AmbientId, level: number) => void;
  stopAllAmbient: () => void;
  resumeMix: () => void;
};

const Ctx = createContext<Value>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
  play: () => {},
  ready: false,
  mix: {},
  toggleAmbient: () => {},
  setAmbientLevel: () => {},
  stopAllAmbient: () => {},
  resumeMix: () => {},
});

export const useAudio = () => useContext(Ctx);

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_SETTINGS);
  const [mix, setMix] = useState<FocusMix>({});
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      const rawMix = localStorage.getItem(MIX_KEY);
      if (rawMix) setMix(JSON.parse(rawMix));
    } catch {}
    loaded.current = true;
  }, []);

  useEffect(() => {
    audio.setSettings(settings);
    if (!loaded.current) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(MIX_KEY, JSON.stringify(mix));
    } catch {}
  }, [mix]);

  // audio may only start after a real gesture
  useEffect(() => {
    const unlock = () => {
      audio.unlock();
      audio.setSettings(settings);
      setReady(true);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback((sound: Sfx) => audio.play(sound), []);

  const toggleAmbient = useCallback((id: AmbientId) => {
    setMix((prev) => {
      const current = prev[id];
      const on = !current?.on;
      const level = current?.level ?? 0.5;
      if (on) ambient.start(id, level);
      else ambient.stop(id);
      return { ...prev, [id]: { on, level } };
    });
  }, []);

  const setAmbientLevel = useCallback((id: AmbientId, level: number) => {
    setMix((prev) => {
      const entry = prev[id];
      if (entry?.on) ambient.setLevel(id, level);
      return { ...prev, [id]: { on: entry?.on ?? false, level } };
    });
  }, []);

  const stopAllAmbient = useCallback(() => {
    ambient.stopAll();
    setMix((prev) => {
      const next: FocusMix = {};
      for (const [k, v] of Object.entries(prev)) next[k as AmbientId] = { ...v!, on: false };
      return next;
    });
  }, []);

  /** Re-start whatever the player had enabled, used when Focus Mode opens. */
  const resumeMix = useCallback(() => {
    audio.unlock();
    Object.entries(mix).forEach(([id, entry]) => {
      if (entry?.on && !ambient.isPlaying(id as AmbientId)) {
        ambient.start(id as AmbientId, entry.level);
      }
    });
  }, [mix]);

  // muting kills ambient too
  useEffect(() => {
    if (settings.muted) ambient.stopAll();
  }, [settings.muted]);

  return (
    <Ctx.Provider
      value={{ settings, update: (p) => setSettings((s) => ({ ...s, ...p })), play, ready, mix, toggleAmbient, setAmbientLevel, stopAllAmbient, resumeMix }}
    >
      {children}
    </Ctx.Provider>
  );
}
