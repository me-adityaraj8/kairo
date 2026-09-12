"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import GameButton from "@/components/game/GameButton";
import GameInput from "@/components/game/GameInput";
import { SPRING } from "@/lib/motion";
import { attributeIcon } from "@/lib/rarity";

type FieldErrors = { email?: string; password?: string; displayName?: string };

const STARTERS = ["Intellect", "Strength", "Discipline", "Vitality"];

export default function RegisterForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  function validate() {
    const next: FieldErrors = {};
    if (!displayName.trim()) next.displayName = "Pick a name for your adventurer";
    if (!email.trim()) next.email = "Email is required";
    if (password.length < 8) next.password = "At least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setPending(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Something went wrong" }));
      setPending(false);
      setErrors({ email: data.error });
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    setPending(false);
    router.push("/app");
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
          <motion.span
            aria-hidden="true"
            className="inline-block text-4xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            ⚔️
          </motion.span>
          <h1 className="mt-3 font-display text-2xl text-gold text-glow-gold">Roll a character</h1>
          <p className="mt-1.5 text-sm text-dim">Level 1. Everything ahead of you.</p>
        </div>

        <div className="panel p-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <GameInput
              label="Adventurer name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={errors.displayName}
              maxLength={40}
              autoComplete="nickname"
              placeholder="What should we call you?"
            />
            <GameInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <GameInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-dim">
                You start with
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STARTERS.map((name) => (
                  <span
                    key={name}
                    className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1 text-[11px] font-semibold text-text"
                  >
                    <span aria-hidden="true">{attributeIcon(name)}</span>
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <GameButton type="submit" variant="gold" disabled={pending} className="w-full">
              {pending ? "Rolling…" : "Begin"}
            </GameButton>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-dim">
          Already have a character?{" "}
          <Link href="/login" className="font-semibold text-gold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
