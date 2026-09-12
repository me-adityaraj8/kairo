"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PixelPanel from "@/components/PixelPanel";
import PixelButton from "@/components/PixelButton";
import PixelInput from "@/components/PixelInput";

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

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setPending(false);

    if (res?.error) {
      setError("Wrong email or password");
      return;
    }
    router.push(returnTo);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center font-pixel text-base text-gold">Kairo</h1>
        <PixelPanel title="Enter the Tavern">
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <PixelInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <PixelInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && (
              <p role="alert" className="font-mono text-xs text-danger">
                {error}
              </p>
            )}
            <PixelButton type="submit" disabled={pending}>
              {pending ? "Entering..." : "Sign In"}
            </PixelButton>
          </form>
        </PixelPanel>
        <p className="mt-4 text-center font-mono text-xs text-muted">
          No adventurer yet?{" "}
          <Link href="/register" className="text-gold underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
