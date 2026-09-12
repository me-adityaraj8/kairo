import type { Metadata } from "next";
import Link from "next/link";
import PixelPanel from "@/components/PixelPanel";

export const metadata: Metadata = {
  title: "Life RPG - Turn Your To-Do List Into a Quest Log",
  description:
    "Life RPG turns everyday tasks into quests that award XP and gold. Level up four attributes, hold a daily streak, and spend your earnings in the tavern shop.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Life RPG - Turn Your To-Do List Into a Quest Log",
    description:
      "Complete real tasks, earn XP and gold, level up your character. A habit tracker that plays like a 16-bit dungeon crawler.",
    type: "website",
    siteName: "Life RPG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Life RPG - Turn Your To-Do List Into a Quest Log",
    description:
      "Complete real tasks, earn XP and gold, level up your character. A habit tracker that plays like a 16-bit dungeon crawler.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Life RPG",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Any",
  description:
    "A gamified task tracker where real-world tasks are quests that award XP and gold, level up character attributes, and build daily streaks.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const features = [
  {
    title: "Quests, Not Chores",
    body: "Post a task, tag it to an attribute, pick a difficulty. Finishing it pays out XP and gold based on how hard it was - EPIC quests are worth fifteen times an easy one.",
  },
  {
    title: "Four Attributes",
    body: "Intellect, Strength, Discipline and Vitality each level independently. Your quest history becomes a visible record of where you actually spend your effort.",
  },
  {
    title: "Streaks That Pay",
    body: "Complete at least one quest a day to keep your streak. Every consecutive day adds a 5% XP bonus, up to 1.5x at ten days. Miss a day and it resets.",
  },
];

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
        <header className="mb-16 text-center">
          <h1 className="font-pixel text-xl leading-relaxed text-gold sm:text-3xl">Life RPG</h1>
          <p className="mx-auto mt-6 max-w-xl font-mono text-sm leading-relaxed text-text sm:text-base">
            Your to-do list already decides how your day goes. This one keeps score.
            Finish real tasks, earn XP and gold, and watch a character sheet fill in
            behind the work you were going to do anyway.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="border-[3px] border-gold bg-gold px-6 py-3 font-pixel text-[10px] uppercase tracking-wider text-bg transition-transform active:translate-y-[2px] hover:bg-[#ffd766]"
            >
              Create Your Adventurer
            </Link>
            <Link
              href="/login"
              className="border-[3px] border-border px-6 py-3 font-pixel text-[10px] uppercase tracking-wider text-text transition-transform active:translate-y-[2px] hover:bg-border/40"
            >
              Sign In
            </Link>
          </div>
        </header>

        <main>
          <h2 className="sr-only">How it works</h2>
          <section className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <PixelPanel key={feature.title} title={feature.title}>
                <p className="font-mono text-xs leading-relaxed text-text">{feature.body}</p>
              </PixelPanel>
            ))}
          </section>

          <section className="mt-16">
            <PixelPanel title="The Loop">
              <ol className="flex flex-col gap-3 font-mono text-xs leading-relaxed text-text">
                <li>
                  <span className="text-gold">1.</span> Post a quest and tag it to one of
                  your four attributes.
                </li>
                <li>
                  <span className="text-gold">2.</span> Do the thing in real life, then mark
                  it complete.
                </li>
                <li>
                  <span className="text-gold">3.</span> Collect XP and gold. Level up the
                  account and that attribute.
                </li>
                <li>
                  <span className="text-gold">4.</span> Spend gold in the tavern shop. Come
                  back tomorrow to keep the streak.
                </li>
              </ol>
            </PixelPanel>
          </section>
        </main>

        <footer className="mt-16 text-center">
          <p className="font-mono text-xs text-muted">
            Every number is calculated on the server. No amount of clicking the wrong
            button will forge you a level.
          </p>
        </footer>
      </div>
    </>
  );
}
