import Link from "next/link";
import PixelPanel from "@/components/PixelPanel";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-6 font-pixel text-2xl text-gold">404</h1>
        <PixelPanel title="Wrong Turn">
          <p className="font-mono text-sm leading-relaxed text-text">
            This corridor leads nowhere. The map you are holding was drawn by a
            liar.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block border-[3px] border-gold bg-gold px-6 py-3 font-pixel text-[10px] uppercase tracking-wider text-bg transition-transform active:translate-y-[2px] hover:bg-[#ffd766]"
          >
            Back to Safety
          </Link>
        </PixelPanel>
      </div>
    </main>
  );
}
