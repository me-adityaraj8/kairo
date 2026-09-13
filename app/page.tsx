import type { Metadata } from "next";
import LandingExperience from "@/components/landing/LandingExperience";

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

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingExperience />
    </>
  );
}
