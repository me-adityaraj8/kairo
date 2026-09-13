"use client";

import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import Creature from "@/components/game/Creature";
import DemoButton from "@/components/game/DemoButton";
import KairoMark from "./KairoMark";
import Backdrop from "./Backdrop";
import CharacterRail from "./CharacterRail";
import { useLandingMotion } from "./useLandingMotion";

const FEATURES = [
  {
    icon: "⚔️",
    tint: "#b15cff",
    rarity: "Legendary",
    title: "Quests, not chores",
    body: "Tag a task to an attribute and pick a difficulty. Legendary quests pay fifteen times what a common one does.",
  },
  {
    icon: "🧬",
    tint: "#4c9ffe",
    rarity: "Epic",
    title: "Four attributes",
    body: "Intellect, Strength, Discipline and Vitality level independently, so your log shows where your effort actually went.",
  },
  {
    icon: "🔥",
    tint: "#ffb02e",
    rarity: "Rare",
    title: "Streaks that pay",
    body: "Every consecutive day adds a 5% XP bonus, up to 1.5x at ten days. Miss a day and it starts over.",
  },
  {
    icon: "🎁",
    tint: "#4ce6cf",
    rarity: "Epic",
    title: "Chests that pay out",
    body: "Level-ups, streak milestones, achievements and daily challenges all drop chests. Every one grants a real item.",
  },
];

const LOOP = [
  { n: "01", t: "Post a quest", d: "Name a real task, tag it to an attribute, pick a difficulty." },
  { n: "02", t: "Do the thing", d: "In real life. Kairo is the scoreboard, not the work." },
  { n: "03", t: "Collect", d: "XP, gold and attribute progress, multiplied by your streak and combo." },
  { n: "04", t: "Come back", d: "Chests, challenges and a companion that grows on what you actually did." },
];

const FAQ = [
  {
    q: "Is it free?",
    a: "Yes, entirely. There is nothing to buy and no subscription. Gold and items exist only inside the app.",
  },
  {
    q: "Can I try it without signing up?",
    a: "Yes. Try the demo hands you a real account with progress already on it. It deletes itself after about a day.",
  },
  {
    q: "Can I cheat my way to a high level?",
    a: "Not from the browser. Every reward is calculated on the server, and the completion endpoint accepts no request body at all — it reads the difficulty from the stored quest.",
  },
  {
    q: "What happens if I miss a day?",
    a: "The streak resets to zero and your streak bonus goes with it. Your longest streak is kept on your record.",
  },
];

export default function LandingExperience() {
  const reduced = !!useReducedMotion();
  useLandingMotion(!reduced);

  return (
    <div className="relative">
      {/* ------------------------------------------------------------ hero */}
      <section
        data-hero
        className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-5 py-20"
      >
        <Backdrop />

        <div data-hero-copy className="relative z-10 w-full max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <div data-hero-mark className="mb-5">
              <KairoMark size={84} animated={!reduced} />
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-dim">
              Productivity, played
            </p>

            <h1 className="mt-4 font-display text-[clamp(2.2rem,7vw,4.6rem)] leading-[0.95] text-text">
              <span className="block overflow-hidden">
                <span data-hero-line className="block">
                  Your to-do list,
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-hero-line className="block text-gold text-glow-gold">
                  but it keeps score
                </span>
              </span>
            </h1>

            <p
              data-hero-sub
              className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-dim sm:text-base"
            >
              Kairo turns the things you were going to do anyway into quests. Finish them, earn XP
              and gold, and watch a character sheet fill in behind your real life.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                data-hero-cta
                data-magnetic
                href="/register"
                className="rounded-xl bg-gradient-to-b from-[#ffd469] to-[#ff972e] px-7 py-3.5 text-sm font-bold text-deep shadow-[0_14px_40px_-12px_rgba(255,180,60,.95)]"
              >
                Create your adventurer
              </Link>
              <span data-hero-cta data-magnetic className="inline-block">
                <DemoButton />
              </span>
            </div>

            <p data-hero-cta className="mt-3 text-[12px] text-dim">
              The demo is a real account with progress already on it. No signup, nothing to enter.
            </p>
          </div>

          {/* the companion, standing in the world */}
          <div data-hero-char className="relative z-10 mt-10 flex justify-center">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -bottom-3 left-1/2 h-8 w-44 -translate-x-1/2 rounded-[50%] blur-2xl"
                style={{ background: "radial-gradient(ellipse, rgba(255,176,46,.55), transparent 70%)" }}
              />
              <Creature species="fox" size={190} />
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.3em] text-dim"
        >
          Scroll to explore
        </div>
      </section>

      {/* -------------------------------------------------------- features */}
      <section className="relative mx-auto w-full max-w-6xl px-5 py-20">
        <h2 data-reveal className="font-display text-xl text-gold text-glow-gold sm:text-2xl">
          What you get
        </h2>
        <div data-reveal-stagger className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              data-tilt
              className="group relative overflow-hidden rounded-2xl border p-5"
              style={{
                borderColor: `${f.tint}3a`,
                background: `linear-gradient(165deg, ${f.tint}12 0%, rgba(9,6,21,.92) 62%)`,
              }}
            >
              <div
                data-tilt-glow
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(240px circle at var(--gx,50%) var(--gy,50%), ${f.tint}2e, transparent 65%)`,
                }}
              />
              <div className="relative flex items-start justify-between">
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl text-xl"
                  style={{ background: `${f.tint}22`, boxShadow: `0 0 22px -8px ${f.tint}` }}
                >
                  {f.icon}
                </span>
                <span
                  className="rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em]"
                  style={{ color: f.tint, background: `${f.tint}1e` }}
                >
                  {f.rarity}
                </span>
              </div>
              <h3 className="relative mt-4 font-display text-[15px] text-text">{f.title}</h3>
              <p className="relative mt-1.5 text-[13px] leading-relaxed text-dim">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ loop */}
      <section data-loop className="relative flex min-h-screen items-center px-5">
        <div className="mx-auto w-full max-w-4xl">
          <h2 className="font-display text-xl text-gold text-glow-gold sm:text-2xl">The loop</h2>
          <div className="mt-8 flex flex-col gap-6">
            {LOOP.map((s) => (
              <div
                key={s.n}
                data-loop-step
                className="flex items-start gap-5 opacity-25"
                style={{ transform: "translateX(-24px)" }}
              >
                <span className="font-display text-2xl text-gold sm:text-3xl">{s.n}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base text-text sm:text-lg">{s.t}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-dim sm:text-sm">{s.d}</p>
                  <span
                    data-loop-rail
                    className="mt-3 block h-px w-full origin-left scale-x-0 bg-gradient-to-r from-gold/70 to-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ characters */}
      <section className="relative mx-auto w-full max-w-6xl px-5 py-20">
        <div data-reveal>
          <h2 className="font-display text-xl text-gold text-glow-gold sm:text-2xl">
            Pick a companion
          </h2>
          <p className="mt-2 max-w-xl text-sm text-dim">
            One of six, chosen when you sign up. It stands on your dashboard and reacts to what you
            do — posting a quest, levelling, opening a chest. Drag to look around.
          </p>
        </div>
        <div data-reveal className="mt-7">
          <CharacterRail reduced={reduced} />
        </div>
      </section>

      {/* ------------------------------------------------------------- faq */}
      <section className="relative mx-auto w-full max-w-3xl px-5 py-20">
        <h2 data-reveal className="font-display text-xl text-gold text-glow-gold sm:text-2xl">
          Questions
        </h2>
        <div data-reveal-stagger className="mt-7 flex flex-col gap-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-text marker:hidden">
                <span className="mr-2 text-gold transition-transform group-open:rotate-90 inline-block">
                  ▸
                </span>
                {f.q}
              </summary>
              <p className="mt-2.5 pl-5 text-[13px] leading-relaxed text-dim">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="relative mx-auto w-full max-w-3xl px-5 pb-24">
        <div
          data-reveal
          className="relative overflow-hidden rounded-3xl border border-white/10 p-9 text-center"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 0%, rgba(124,58,237,.26) 0%, rgba(9,6,21,.95) 62%)",
          }}
        >
          <KairoMark size={52} animated={false} className="mx-auto" />
          <h2 className="mt-4 font-display text-xl text-text sm:text-2xl">Start at level one</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-dim">
            Everything ahead of you. Every number calculated on the server — no amount of clicking
            the wrong button will forge you a level.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              data-magnetic
              href="/register"
              className="rounded-xl bg-gradient-to-b from-[#ffd469] to-[#ff972e] px-7 py-3.5 text-sm font-bold text-deep shadow-[0_14px_40px_-12px_rgba(255,180,60,.95)]"
            >
              Create your adventurer
            </Link>
            <Link
              data-magnetic
              href="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-text"
            >
              Sign in
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-dim">
          <Link href="/privacy" className="hover:text-text hover:underline">
            Privacy
          </Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:text-text hover:underline">
            Terms
          </Link>
        </p>
      </section>
    </div>
  );
}
