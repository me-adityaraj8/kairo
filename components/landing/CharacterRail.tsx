"use client";

import { useEffect, useRef } from "react";
import Creature from "@/components/game/Creature";
import { SPECIES } from "@/lib/characters";

/**
 * The six companions, on a rail you can throw.
 *
 * Draggable is a GSAP bonus plugin and is not in the free package, so the
 * throw is done with pointer events over a natively scrollable track. That
 * keeps the wheel, trackpad, touch and keyboard behaviour browsers already
 * give us, and adds grab-and-fling on top.
 */
export default function CharacterRail({ reduced }: { reduced: boolean }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el || reduced) return;

    let down = false;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let velocity = 0;
    let raf = 0;

    const glide = () => {
      velocity *= 0.94;
      el.scrollLeft -= velocity;
      if (Math.abs(velocity) > 0.4) raf = requestAnimationFrame(glide);
    };

    const onDown = (e: PointerEvent) => {
      down = true;
      startX = lastX = e.clientX;
      startScroll = el.scrollLeft;
      velocity = 0;
      cancelAnimationFrame(raf);
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      el.scrollLeft = startScroll - (e.clientX - startX);
      velocity = e.clientX - lastX;
      lastX = e.clientX;
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      el.releasePointerCapture(e.pointerId);
      el.style.cursor = "grab";
      raf = requestAnimationFrame(glide);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [reduced]);

  return (
    <div
      ref={track}
      className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ cursor: reduced ? undefined : "grab" }}
      role="list"
      aria-label="Companions you can choose"
    >
      {SPECIES.map((s) => (
        <article
          key={s.id}
          role="listitem"
          data-tilt
          className="group relative w-[210px] shrink-0 snap-center overflow-hidden rounded-2xl border p-5 text-center"
          style={{
            borderColor: `${s.palette.glow}44`,
            background: `linear-gradient(165deg, ${s.palette.glow}14 0%, rgba(9,6,21,.9) 60%)`,
          }}
        >
          <div
            data-tilt-glow
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(260px circle at var(--gx,50%) var(--gy,50%), ${s.palette.glow}2e, transparent 65%)`,
            }}
          />
          <div className="relative grid place-items-center">
            <Creature species={s.id} size={120} />
          </div>
          <h3 className="relative mt-2 font-display text-sm" style={{ color: s.palette.glow }}>
            {s.name}
          </h3>
          <p className="relative text-[11px] font-bold uppercase tracking-[0.14em] text-dim">
            {s.title}
          </p>
          <p className="relative mt-2 text-[12px] leading-relaxed text-dim">{s.blurb}</p>
        </article>
      ))}
    </div>
  );
}
