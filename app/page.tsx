import type { Metadata } from "next";
import Link from "next/link";
import DemoButton from "@/components/game/DemoButton";

export const metadata: Metadata = {
  title: "Kairo - Turn Your To-Do List Into a Quest Log",
  description:
    "Kairo turns everyday tasks into quests that award XP and gold. Level up four attributes, hold a daily streak, and spend your earnings in the tavern shop.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kairo - Turn Your To-Do List Into a Quest Log",
    description:
      "Complete real tasks, earn XP and gold, level up your character. A habit tracker that plays like a game.",
    type: "website",
    siteName: "Kairo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kairo - Turn Your To-Do List Into a Quest Log",
    description:
      "Complete real tasks, earn XP and gold, level up your character. A habit tracker that plays like a game.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Kairo",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Any",
  description:
    "A gamified task tracker where real-world tasks are quests that award XP and gold, level up character attributes, and build daily streaks.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const features = [
  {
    icon: "⚔️",
    tint: "var(--epic)",
    title: "Quests, not chores",
    body: "Tag a task to an attribute and pick a difficulty. Legendary quests pay fifteen times what a common one does.",
  },
  {
    icon: "🧬",
    tint: "var(--blue)",
    title: "Four attributes",
    body: "Intellect, Strength, Discipline and Vitality level independently, so your log shows where your effort actually went.",
  },
  {
    icon: "🔥",
    tint: "var(--gold)",
    title: "Streaks that pay",
    body: "Every consecutive day adds a 5% XP bonus, up to 1.5x at ten days. Miss a day and it starts over.",
  },
];

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:py-20">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-dim">
            <span aria-hidden="true">✦</span> Productivity, played
          </span>

          <h1 className="mt-6 font-display text-3xl leading-tight text-text sm:text-5xl">
            Your to-do list,
            <br />
            <span className="text-gold text-glow-gold">but it keeps score</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-dim sm:text-base">
            Kairo turns the things you were going to do anyway into quests. Finish them, earn XP and
            gold, and watch a character sheet fill in behind your real life.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-b from-[#ffd469] to-[#ff972e] px-6 py-3 text-sm font-bold text-deep shadow-[0_10px_30px_-10px_rgba(255,180,60,.9)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
            >
              Create your adventurer
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-white/10"
            >
              Sign in
            </Link>
            <DemoButton />
          </div>

          <p className="mt-3 text-[12px] text-dim">
            The demo is a real account with some progress already on it. No signup, nothing to
            enter — it disappears after a day.
          </p>
        </header>

        <main className="mt-16">
          <h2 className="sr-only">How it works</h2>

          <section className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="panel p-5">
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 text-xl"
                  style={{ background: `color-mix(in srgb, ${feature.tint} 18%, transparent)` }}
                >
                  {feature.icon}
                </span>
                <h3 className="mt-4 text-base font-bold text-text">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-dim">{feature.body}</p>
              </article>
            ))}
          </section>

          <section className="panel mt-6 p-6 sm:p-8">
            <h3 className="font-display text-base text-gold">The loop</h3>
            <ol className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Post a quest and tag it to an attribute.",
                "Do the thing in real life, then mark it done.",
                "Collect XP and gold. Level the account and that attribute.",
                "Spend gold in the shop. Come back tomorrow for the streak.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gold/15 font-display text-[11px] text-gold">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-dim">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </main>

        <footer className="mt-14 text-center">
          <p className="text-xs text-dim">
            Every number is calculated on the server. No amount of clicking the wrong button will forge
            you a level.
          </p>
          <p className="mt-3 text-xs text-dim">
            <Link href="/privacy" className="hover:text-text hover:underline">
              Privacy
            </Link>
            <span className="mx-2">·</span>
            <Link href="/terms" className="hover:text-text hover:underline">
              Terms
            </Link>
          </p>
        </footer>
      </div>
    </>
  );
}
