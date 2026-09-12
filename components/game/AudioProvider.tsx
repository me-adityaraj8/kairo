"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AudioSettings, DEFAULT_SETTINGS, Sfx, audio } from "@/lib/audio";

const STORAGE_KEY = "kairo.audio";

type AudioContextValue = {
  settings: AudioSettings;
  update: (patch: Partial<AudioSettings>) => void;
  play: (sound: Sfx) => void;
  ready: boolean;
};

const Ctx = createContext<AudioContextValue>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
  play: () => {},
  ready: false,
});

export const useAudio = () => useContext(Ctx);

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  // restore saved preferences
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {}
    loaded.current = true;
  }, []);

  // push settings into the engine and persist them
  useEffect(() => {
    audio.setSettings(settings);
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // browsers only allow audio after a real gesture
  useEffect(() => {
    const unlock = () => {
      audio.unlock();
      audio.setSettings(settings);
      audio.setMusicEnabled(!settings.muted && settings.music > 0);
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

  // react to music being turned on/off after unlock
  useEffect(() => {
    if (!ready) return;
    audio.setMusicEnabled(!settings.muted && settings.music > 0);
  }, [ready, settings.muted, settings.music]);

  const update = useCallback((patch: Partial<AudioSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const play = useCallback((sound: Sfx) => {
    audio.play(sound);
  }, []);

  return <Ctx.Provider value={{ settings, update, play, ready }}>{children}</Ctx.Provider>;
}
