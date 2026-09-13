"use client";

/**
 * The Kairo mark: a K cut from three angled prisms, reading as both a
 * letter and an upward step. Drawn rather than imported so it can be animated and
 * recoloured, and so no raster asset ships.
 */
export default function KairoMark({
  size = 64,
  animated = true,
  className,
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const id = "kairo-mark";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Kairo"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`${id}-stem`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id={`${id}-upper`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#f0abfc" />
        </linearGradient>
        <linearGradient id={`${id}-lower`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb02e" />
          <stop offset="100%" stopColor="#ffd469" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#${id}-glow)`}>
        {/* stem */}
        <path d="M18 12 L34 18 L34 88 L18 82 Z" fill={`url(#${id}-stem)`} />
        {/* upper arm, rising */}
        <path d="M38 48 L74 10 L86 20 L48 56 Z" fill={`url(#${id}-upper)`} />
        {/* lower arm, the payoff */}
        <path d="M48 50 L84 84 L72 94 L38 58 Z" fill={`url(#${id}-lower)`} />
        {/* facet highlight */}
        <path d="M38 48 L74 10 L78 14 L42 51 Z" fill="#fff" opacity={0.22} />
      </g>

      {/* orbiting spark */}
      {animated && (
        <g>
          <circle r="2.4" fill="#ffd469">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path="M50 6 a44 30 0 1 0 0.1 0"
            />
          </circle>
        </g>
      )}
    </svg>
  );
}
