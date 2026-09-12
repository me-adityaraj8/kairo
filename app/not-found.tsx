import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md text-center">
        <span aria-hidden="true" className="inline-block animate-float text-6xl">
          🗺️
        </span>
        <h1 className="mt-5 font-display text-5xl text-gold text-glow-gold">404</h1>
        <p className="mt-4 text-base font-bold text-text">This corridor leads nowhere</p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-dim">
          The map you are holding was drawn by a liar. Nothing here but dust.
        </p>
        <Link
          href="/"
          className="mt-7 inline-block rounded-xl bg-gradient-to-b from-[#ffd469] to-[#ff972e] px-6 py-3 text-sm font-bold text-deep shadow-[0_10px_30px_-10px_rgba(255,180,60,.9)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
        >
          Back to safety
        </Link>
      </div>
    </main>
  );
}
