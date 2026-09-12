"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CursorField, FieldQuality } from "@/lib/cursorField";
import { useSettings } from "./SettingsProvider";

type Tone = "xp" | "gold" | "violet" | "blue";

type CursorApi = {
  /** Burst at a screen position, or at the cursor when omitted. */
  burst: (tone?: Tone, at?: { x: number; y: number }) => void;
  enabled: boolean;
};

const Ctx = createContext<CursorApi>({ burst: () => {}, enabled: false });
export const useCursor = () => useContext(Ctx);

const INTERACTIVE = "a,button,input,select,textarea,[role=button],[tabindex]:not([tabindex='-1'])";

export default function CursorLayer({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<CursorField | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const [fine, setFine] = useState(false);
  const { settings } = useSettings();

  // fine pointer = mouse/trackpad. Touch devices keep ambient only.
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setFine(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const quality: FieldQuality = (() => {
    if (settings.reducedMotion || settings.cursorEffects === "off") return "off";
    if (!fine) return "low";
    return settings.cursorEffects === "low" ? "low" : "high";
  })();

  useEffect(() => {
    if (!canvasRef.current) return;
    const field = new CursorField(canvasRef.current);
    fieldRef.current = field;
    field.setQuality(quality);
    field.start();

    const onResize = () => field.resize();
    window.addEventListener("resize", onResize);

    const onVisibility = () => (document.hidden ? field.stop() : field.start());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      field.destroy();
      fieldRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fieldRef.current?.setQuality(quality);
  }, [quality]);

  useEffect(() => {
    if (quality === "off" || !fine) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointerRef.current = { x: e.clientX, y: e.clientY };
      fieldRef.current?.pointer(e.clientX, e.clientY);

      const el = e.target as Element | null;
      fieldRef.current?.setHovering(!!el?.closest?.(INTERACTIVE));
    };
    const onDown = () => fieldRef.current?.setPressed(true);
    const onUp = () => fieldRef.current?.setPressed(false);
    const onLeave = () => fieldRef.current?.pointer(-9999, -9999);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [quality, fine]);

  const burst = useCallback(
    (tone: Tone = "gold", at?: { x: number; y: number }) => {
      const p = at ?? pointerRef.current;
      if (p.x < -9000) {
        fieldRef.current?.burst(window.innerWidth / 2, window.innerHeight / 2, tone, 30);
        return;
      }
      fieldRef.current?.burst(p.x, p.y, tone, 30);
    },
    []
  );

  const hideNativeCursor = quality === "high" && fine;

  return (
    <Ctx.Provider value={{ burst, enabled: quality !== "off" }}>
      {hideNativeCursor && (
        <style>{`body, body * { cursor: none !important; }`}</style>
      )}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[90]"
        style={{ mixBlendMode: "screen" }}
      />
      {children}
    </Ctx.Provider>
  );
}
