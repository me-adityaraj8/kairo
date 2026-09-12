"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { SPRING } from "@/lib/motion";

/** Inline marks so nothing is fetched from a third party. */
const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.56-5.17 3.56-8.87z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

const GitHubMark = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true" fill="currentColor">
    <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58l-.01-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3z" />
  </svg>
);

const PROVIDERS = {
  google: { label: "Continue with Google", Mark: GoogleMark, glow: "rgba(66,133,244,.5)" },
  github: { label: "Continue with GitHub", Mark: GitHubMark, glow: "rgba(255,255,255,.35)" },
} as const;

export default function OAuthButtons({
  enabled,
  callbackUrl,
}: {
  enabled: { google: boolean; github: boolean };
  callbackUrl: string;
}) {
  const reduceMotion = useReducedMotion();
  const [pending, setPending] = useState<string | null>(null);

  const available = (Object.keys(PROVIDERS) as (keyof typeof PROVIDERS)[]).filter((k) => enabled[k]);
  if (!available.length) return null;

  return (
    <div className="mt-5">
      {/* divider */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-dim">or</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {available.map((key, i) => {
          const { label, Mark, glow } = PROVIDERS[key];
          const busy = pending === key;

          return (
            <motion.button
              key={key}
              type="button"
              disabled={!!pending}
              onClick={() => {
                setPending(key);
                signIn(key, { callbackUrl });
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.snappy, delay: 0.05 + i * 0.06 }}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { y: 1, scale: 0.985 }}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl
                border border-white/14 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-text
                backdrop-blur transition-colors hover:bg-white/[0.11] disabled:opacity-60"
            >
              {/* sheen sweep on hover */}
              {!reduceMotion && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 -left-full w-1/2 skew-x-12
                    bg-gradient-to-r from-transparent via-white/18 to-transparent
                    transition-all duration-700 group-hover:left-full"
                />
              )}

              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ boxShadow: `inset 0 0 24px -10px ${glow}` }}
              />

              <span className="relative grid h-7 w-7 place-items-center rounded-lg bg-white/[0.08]">
                {busy ? (
                  <motion.span
                    className="block h-3.5 w-3.5 rounded-full border-2 border-white/25 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <Mark />
                )}
              </span>

              <span className="relative">{busy ? "Opening…" : label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
