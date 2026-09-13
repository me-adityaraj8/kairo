"use client";

/**
 * The pointer's own light. Two layers with different lag so the trail bends
 * behind fast movement, plus a canvas for sparks thrown on click.
 *
 * Everything is positioned by GSAP in useLandingMotion — this file only
 * supplies the surfaces. Hidden from pointer events and from assistive tech,
 * and not rendered at all under reduced motion or on coarse pointers.
 */
export default function CursorAura() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 hidden lg:block">
      <div
        data-aura-far
        className="absolute -left-40 -top-40 h-80 w-80 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,.22) 0%, rgba(124,58,237,.08) 40%, transparent 70%)",
        }}
      />
      <div
        data-aura-near
        className="absolute -left-16 -top-16 h-32 w-32 rounded-full blur-xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,212,105,.28) 0%, rgba(255,160,50,.10) 45%, transparent 72%)",
        }}
      />
      <canvas data-spark-canvas className="absolute inset-0 h-full w-full" />
    </div>
  );
}
