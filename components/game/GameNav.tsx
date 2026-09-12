"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { useAudio } from "./AudioProvider";

const LINKS = [
  { href: "/app", label: "Quests", icon: "⚔️" },
  { href: "/app/character", label: "Legend", icon: "🧭" },
  { href: "/app/bag", label: "Bag", icon: "🎒" },
  { href: "/app/achievements", label: "Deeds", icon: "🏆" },
  { href: "/app/shop", label: "Shop", icon: "🏺" },
];

export default function GameNav({ onFocus }: { onFocus?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { play } = useAudio();

  // Focus lives in the nav now. Off the dashboard it routes there and opens.
  const focus = () => {
    play("open");
    if (onFocus) onFocus();
    else router.push("/app?focus=1");
  };

  return (
    <>
      {/* desktop rail */}
      <nav
        aria-label="Main"
        className="fixed left-0 top-0 z-40 hidden h-full w-20 flex-col items-center gap-2 border-r border-white/8 bg-white/[0.03] py-6 backdrop-blur-xl lg:flex"
      >
        <span className="mb-4 font-display text-sm text-gold">K</span>
        {LINKS.map((link) => (
          <NavItem
            key={link.href}
            {...link}
            active={pathname === link.href}
            reduceMotion={!!reduceMotion}
            stacked
          />
        ))}

        <ActionItem icon="🧘" label="Focus" onClick={focus} stacked />

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-auto flex w-14 flex-col items-center gap-1 rounded-xl py-2 text-dim transition-colors hover:bg-white/8 hover:text-text"
        >
          <span aria-hidden="true" className="text-lg">
            ⏻
          </span>
          <span className="text-[10px] font-semibold">Exit</span>
        </button>
      </nav>

      {/* mobile bottom bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-deep/85 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="no-scrollbar mx-auto flex max-w-xl items-stretch justify-between gap-0.5 overflow-x-auto px-1.5 py-1.5">
          {LINKS.map((link) => (
            <NavItem
              key={link.href}
              {...link}
              active={pathname === link.href}
              reduceMotion={!!reduceMotion}
            />
          ))}

          <ActionItem icon="🧘" label="Focus" onClick={focus} />

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex min-w-[52px] shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-dim transition-colors hover:text-text"
          >
            <span aria-hidden="true" className="text-lg">
              ⏻
            </span>
            <span className="text-[10px] font-semibold">Exit</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function ActionItem({
  icon,
  label,
  onClick,
  stacked,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  stacked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-dim transition-colors hover:text-text
        ${stacked ? "w-14 py-2" : "min-w-[52px]"}`}
    >
      <span aria-hidden="true" className="text-lg">
        {icon}
      </span>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
  reduceMotion,
  stacked,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  reduceMotion: boolean;
  stacked?: boolean;
}) {
  const { play } = useAudio();

  return (
    <Link
      href={href}
      onClick={() => play("navigate")}
      onPointerEnter={() => play("hover")}
      aria-current={active ? "page" : undefined}
      className={`relative flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors
        ${stacked ? "w-14 py-2" : "min-w-[52px]"} ${active ? "text-gold" : "text-dim hover:text-text"}`}
    >
      {active && (
        <motion.span
          layoutId={stacked ? "nav-rail" : "nav-bar"}
          className="absolute inset-0 rounded-xl border border-gold/35 bg-gold/12"
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <motion.span
        aria-hidden="true"
        className="relative text-lg"
        animate={active && !reduceMotion ? { y: [0, -3, 0] } : undefined}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.span>
      <span className="relative text-[10px] font-semibold">{label}</span>
    </Link>
  );
}
