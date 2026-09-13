"use client";

import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import Creature from "@/components/game/Creature";
import DemoButton from "@/components/game/DemoButton";
import KairoMark from "./KairoMark";
import KairoWordmark from "./KairoWordmark";
import CursorAura from "./CursorAura";
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
  {
    n: "01",
    icon: "📜",
    tint: "#b15cff",
    t: "Post a quest",
    d: "Name a real task, tag it to an attribute, pick a difficulty.",
    chips: ["Common", "Rare", "Epic", "Legendary"],
  },
  {
    n: "02",
    icon: "⚔️",
    tint: "#4c9ffe",
    t: "Do the thing",
    d: "In real life. Kairo is the scoreboard, not the work.",
    chips: ["Away from the app"],
  },
  {
    n: "03",
    icon: "✨",
    tint: "#4ce6cf",
    t: "Collect",
    d: "XP, gold and attribute progress, multiplied by your streak and combo.",
    chips: ["+XP", "+Gold", "×Streak", "×Combo"],
  },
  {
    n: "04",
    icon: "🎁",
    tint: "#ffb02e",
    t: "Come back",
    d: "Chests, challenges and a companion that grows on what you actually did.",
    chips: ["Chest", "Challenge", "Bond"],
  },
];

const CREDITS = [
  { name: "Aditya Raj", tint: "rgba(192,132,252,.45)" },
  { name: "Naman Singh", tint: "rgba(76,159,254,.45)" },
  { name: "Varun Sharma", tint: "rgba(255,176,46,.45)" },
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
      {!reduced && <CursorAura />}

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

            <KairoWordmark className="text-[clamp(3.4rem,13vw,9rem)]" />

            <p
              data-hero-tag
              className="mt-3 text-[11px] font-bold uppercase tracking-[0.42em] text-dim"
            >
              Productivity, played
            </p>

            <p className="mt-5 font-display text-[clamp(1.5rem,4.4vw,2.9rem)] leading-[1.02] text-text">
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
            </p>

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
                  data-card-icon
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
      <section data-loop className="relative flex min-h-screen items-center overflow-hidden px-5">
        {/* section ambience, so the pinned frame is never bare */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            data-loop-orb
            className="absolute left-[8%] top-[18%] h-72 w-72 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,.20), transparent 70%)" }}
          />
          <div
            data-loop-orb
            className="absolute right-[10%] bottom-[14%] h-80 w-80 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(255,160,50,.14), transparent 70%)" }}
          />
        </div>

        <div className="relative mx-auto w-full max-w-4xl py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-xl text-gold text-glow-gold sm:text-2xl">The loop</h2>
            <span
              data-loop-count
              className="font-display text-[11px] uppercase tracking-[0.2em] text-dim"
            >
              01 / 04
            </span>
          </div>

          <div className="relative mt-9 pl-12 sm:pl-16">
            {/* the spine, and the light that climbs it */}
            <span
              aria-hidden="true"
              className="absolute left-[19px] top-2 bottom-2 w-px bg-white/10 sm:left-[27px]"
            />
            <span
              data-loop-spine
              aria-hidden="true"
              className="absolute left-[19px] top-2 w-px origin-top scale-y-0 bg-gradient-to-b from-gold via-epic to-transparent sm:left-[27px]"
              style={{ bottom: "0.5rem" }}
            />
            {/* the companion rides the spine */}
            <span
              data-loop-rider
              aria-hidden="true"
              className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full sm:left-[8px]"
              style={{ background: "radial-gradient(circle, rgba(255,176,46,.35), transparent 70%)" }}
            >
              <Creature species="fox" size={38} />
            </span>

            <div className="flex flex-col gap-9 sm:gap-11">
              {LOOP.map((step) => (
                <div key={step.n} data-loop-step className="relative">
                  <span
                    data-loop-node
                    aria-hidden="true"
                    className="absolute -left-12 top-0 grid h-10 w-10 place-items-center rounded-xl border text-base sm:-left-16"
                    style={{
                      borderColor: `${step.tint}55`,
                      background: `${step.tint}18`,
                    }}
                  >
                    {step.icon}
                  </span>

                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-lg sm:text-xl" style={{ color: step.tint }}>
                      {step.n}
                    </span>
                    <h3 className="font-display text-base text-text sm:text-lg">{step.t}</h3>
                  </div>
                  <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-dim sm:text-sm">
                    {step.d}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {step.chips.map((c) => (
                      <span
                        key={c}
                        data-loop-chip
                        className="rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{
                          borderColor: `${step.tint}44`,
                          background: `${step.tint}12`,
                          color: step.tint,
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <span
                    data-loop-rail
                    className="mt-4 block h-px w-full origin-left scale-x-0"
                    style={{ background: `linear-gradient(90deg, ${step.tint}aa, transparent)` }}
                  />
                </div>
              ))}
            </div>
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

      </section>

      {/* ---------------------------------------------------------- footer */}
      <footer data-footer className="relative overflow-hidden px-5 pb-14">
        <div className="mx-auto w-full max-w-3xl">
          {/* a line that draws itself across as the footer arrives */}
          <span
            data-footer-rule
            aria-hidden="true"
            className="block h-px w-full origin-center scale-x-0"
            style={{
              background:
                "linear-gradient(90deg,transparent,rgba(192,132,252,.55),rgba(255,180,60,.55),transparent)",
            }}
          />

          <div className="mt-10 flex flex-col items-center text-center">
            <span data-footer-mark className="inline-block">
              <KairoMark size={38} animated={false} />
            </span>

            <p className="mt-5 text-sm text-dim">
              Made with{" "}
              <span
                data-footer-heart
                aria-label="love"
                role="img"
                className="inline-block align-middle text-base"
              >
                ❤️
              </span>{" "}
              by
            </p>

            <ul data-footer-names className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
              {CREDITS.map((person, i) => (
                <li key={person.name} className="flex items-center gap-2">
                  <span
                    data-footer-name
                    data-magnetic
                    className="relative cursor-default font-display text-[15px] text-text transition-colors hover:text-gold sm:text-base"
                  >
                    <span
                      aria-hidden="true"
                      data-footer-name-glow
                      className="pointer-events-none absolute -inset-x-3 -inset-y-2 rounded-lg opacity-0 blur-lg"
                      style={{ background: person.tint }}
                    />
                    <span className="relative">{person.name}</span>
                  </span>
                  {i < CREDITS.length - 1 && (
                    <span aria-hidden="true" className="text-dim/50">
                      ·
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <p className="mt-7 text-xs text-dim">
              <Link href="/privacy" className="hover:text-text hover:underline">
                Privacy
              </Link>
              <span className="mx-2">·</span>
              <Link href="/terms" className="hover:text-text hover:underline">
                Terms
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
