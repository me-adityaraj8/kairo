"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Starts a throwaway account with some progress already on it and drops the
 * visitor straight into the app. It signs in through the normal credentials
 * provider, so there is no second way into a session to keep secure.
 */
export default function DemoButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      if (!res.ok) throw new Error();
      const { email, password } = await res.json();

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error();

      router.push("/app");
      router.refresh();
    } catch {
      setError("Could not start the demo. Try again?");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={start}
        disabled={pending}
        className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-white/10 disabled:opacity-60"
      >
        {pending ? "Setting up…" : "Try the demo"}
      </button>
      {error && <p className="mt-2 text-[11px] text-danger">{error}</p>}
    </div>
  );
}
