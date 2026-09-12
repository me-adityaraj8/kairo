"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import GameButton from "@/components/game/GameButton";
import GameInput from "@/components/game/GameInput";
import { SPRING } from "@/lib/motion";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("from") || "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const res = await signIn("credentials", { email, password, redirect: false });
    setPending(false);

    if (res?.error) {
      setError("Wrong email or password");
      return;
    }
    router.push(returnTo);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.subtle}
        className="w-full max-w-sm"
      >
        <div className="mb-7 text-center">
          <span aria-hidden="true" className="inline-block animate-float text-4xl">
            🗝️
          </span>
          <h1 className="mt-3 font-display text-2xl text-gold text-glow-gold">Kairo</h1>
          <p className="mt-1.5 text-sm text-dim">Your quest log is waiting.</p>
        </div>

        <div className="panel p-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <GameInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <GameInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && (
              <p role="alert" className="text-xs font-medium text-danger">
                {error}
              </p>
            )}
            <GameButton type="submit" variant="gold" disabled={pending} className="mt-1 w-full">
              {pending ? "Entering…" : "Continue"}
            </GameButton>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-dim">
          No adventurer yet?{" "}
          <Link href="/register" className="font-semibold text-gold hover:underline">
            Create one
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
