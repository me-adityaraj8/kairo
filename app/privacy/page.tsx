import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — Kairo",
  description: "What Kairo stores, why it stores it, and how to get rid of it.",
  alternates: { canonical: "/privacy" },
};

const sections: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "What is stored",
    body: (
      <>
        <p>Creating an account with an email and password stores:</p>
        <ul>
          <li>Your email address and the display name you chose.</li>
          <li>
            A bcrypt hash of your password. The password itself is never written down and cannot be
            recovered from the hash.
          </li>
        </ul>
        <p>
          Signing in with Google or GitHub stores your email address, your name, and the URL of your
          profile picture as supplied by that provider. No password is stored for these accounts,
          and Kairo never sees your Google or GitHub credentials.
        </p>
        <p>
          Everything else is what you do in the app: the quests you write, when you completed them,
          your level, XP, gold, streak, attributes, achievements, items, focus sessions and the days
          you were active.
        </p>
      </>
    ),
  },
  {
    heading: "What is not stored",
    body: (
      <p>
        There is no analytics, no advertising, and no third-party tracking script of any kind. Your
        data is not sold or shared, and nothing is sent anywhere except the services listed below
        that are needed to run the app.
      </p>
    ),
  },
  {
    heading: "Where it lives",
    body: (
      <p>
        The app is hosted on <strong>Vercel</strong> and the database is <strong>Neon</strong>{" "}
        (PostgreSQL), in the United States. Sessions are held in a signed cookie in your browser, not
        in the database. Your browser also stores your sound and display preferences locally; those
        never leave your device.
      </p>
    ),
  },
  {
    heading: "Demo accounts",
    body: (
      <p>
        Starting the demo creates a temporary account with a generated address that is not a real
        mailbox. It holds no personal information about you, and it is deleted automatically within
        about a day.
      </p>
    ),
  },
  {
    heading: "Deleting your data",
    body: (
      <p>
        Email <a href="mailto:me.adityaraj8@gmail.com">me.adityaraj8@gmail.com</a> and your account
        will be deleted. Deletion removes everything tied to it — quests, progress, items and
        companion — with nothing retained afterwards.
      </p>
    ),
  },
  {
    heading: "Changes",
    body: (
      <p>
        Kairo is a personal project, and this page will be updated if what it stores ever changes.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-14">
      <Link href="/" className="text-sm font-semibold text-gold hover:underline">
        ← Kairo
      </Link>

      <h1 className="mt-6 font-display text-2xl text-gold text-glow-gold sm:text-3xl">Privacy</h1>
      <p className="mt-2 text-sm text-dim">
        Kairo is a personal project. It keeps what it needs to show you your own progress, and
        nothing beyond that.
      </p>

      <div className="mt-8 flex flex-col gap-5">
        {sections.map((section) => (
          <section key={section.heading} className="panel p-5">
            <h2 className="font-display text-base text-text">{section.heading}</h2>
            <div className="mt-2 flex flex-col gap-2.5 text-sm leading-relaxed text-dim [&_a]:text-gold [&_a]:underline [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-text">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-xs text-dim">Last updated 13 September 2026.</p>
    </main>
  );
}
