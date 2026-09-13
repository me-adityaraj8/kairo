import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms — Kairo",
  description: "The terms you agree to by using Kairo.",
  alternates: { canonical: "/terms" },
};

const sections: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "What Kairo is",
    body: (
      <p>
        Kairo is a free personal project that turns tasks you set yourself into a progression system.
        It is not a company, there is nothing to pay for, and there is no subscription or in-app
        purchase of any kind. The gold, items and levels in the app have no value outside it and
        cannot be bought, sold or exchanged for anything.
      </p>
    ),
  },
  {
    heading: "Your account",
    body: (
      <>
        <p>
          You are responsible for keeping your password to yourself, and for everything done through
          your account. Use an email address you actually control, and do not sign up on someone
          else&apos;s behalf.
        </p>
        <p>
          Quests are whatever you type. Do not put anything unlawful in them, and do not use the app
          to store other people&apos;s personal information.
        </p>
      </>
    ),
  },
  {
    heading: "Fair use",
    body: (
      <p>
        Please do not attack the service — no attempts to break into other accounts, no automated
        traffic designed to overload it, and no scripting the API to inflate progress. Rewards are
        calculated on the server precisely so the game is the same for everyone. Accounts doing any
        of this may be removed without warning.
      </p>
    ),
  },
  {
    heading: "No guarantees",
    body: (
      <p>
        Kairo is provided as is. It may be offline, it may lose data, and it may change or shut down
        at any time without notice. Do not use it as the only record of anything you would be sorry
        to lose. To the extent the law allows, no liability is accepted for any loss arising from
        using it.
      </p>
    ),
  },
  {
    heading: "Ending it",
    body: (
      <p>
        You can stop using Kairo whenever you like. To have your account and everything in it
        deleted, email <a href="mailto:me.adityaraj8@gmail.com">me.adityaraj8@gmail.com</a>. Demo
        accounts delete themselves within about a day.
      </p>
    ),
  },
  {
    heading: "Changes",
    body: (
      <p>
        These terms may be updated as the project changes. Continuing to use Kairo after a change
        means the current version applies. See also the{" "}
        <Link href="/privacy">privacy page</Link> for what is stored.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-14">
      <Link href="/" className="text-sm font-semibold text-gold hover:underline">
        ← Kairo
      </Link>

      <h1 className="mt-6 font-display text-2xl text-gold text-glow-gold sm:text-3xl">Terms</h1>
      <p className="mt-2 text-sm text-dim">
        Kairo is free and run by one person. These are the plain-language terms for using it.
      </p>

      <div className="mt-8 flex flex-col gap-5">
        {sections.map((section) => (
          <section key={section.heading} className="panel p-5">
            <h2 className="font-display text-base text-text">{section.heading}</h2>
            <div className="mt-2 flex flex-col gap-2.5 text-sm leading-relaxed text-dim [&_a]:text-gold [&_a]:underline [&_strong]:text-text">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-xs text-dim">Last updated 13 September 2026.</p>
    </main>
  );
}
