"use client";

/**
 * KAIRO, set large as the hero's centrepiece.
 *
 * Each letter is its own element so the entrance can stagger them and the
 * hover can tilt them individually. The gradient is painted through the text
 * with background-clip, and the glow is a filter on a duplicate layer
 * underneath — cheaper than a text-shadow stack and it blurs evenly.
 */
export default function KairoWordmark({ className = "" }: { className?: string }) {
  const letters = "KAIRO".split("");

  return (
    <div
      data-wordmark
      className={`relative select-none ${className}`}
      style={{ perspective: "800px" }}
    >
      {/* glow bed */}
      <div
        aria-hidden="true"
        data-wordmark-glow
        className="pointer-events-none absolute inset-0 flex justify-center blur-[22px]"
      >
        {letters.map((l, i) => (
          <span
            key={i}
            className="font-display leading-none"
            style={{
              fontSize: "inherit",
              letterSpacing: "0.02em",
              color: i % 2 ? "#ffb02e" : "#c084fc",
              opacity: 0.85,
            }}
          >
            {l}
          </span>
        ))}
      </div>

      {/* the letters themselves */}
      <h1 className="relative flex justify-center font-display leading-none" aria-label="Kairo">
        {letters.map((l, i) => (
          <span
            key={i}
            data-wordmark-letter
            aria-hidden="true"
            className="inline-block bg-clip-text text-transparent"
            style={{
              fontSize: "inherit",
              letterSpacing: "0.02em",
              backgroundImage:
                "linear-gradient(168deg,#ffffff 4%,#e9d5ff 26%,#c084fc 52%,#ffd469 78%,#ff972e 100%)",
              willChange: "transform",
            }}
          >
            {l}
          </span>
        ))}
      </h1>

      {/* sheen that sweeps across on load and hover */}
      <div
        aria-hidden="true"
        data-wordmark-sheen
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "linear-gradient(105deg,transparent 38%,rgba(255,255,255,.75) 50%,transparent 62%)",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
