"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PixelPanel from "@/components/PixelPanel";
import PixelButton from "@/components/PixelButton";
import PixelInput from "@/components/PixelInput";

type FieldErrors = { email?: string; password?: string; displayName?: string };

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
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center font-pixel text-base text-gold">Kairo</h1>
        <PixelPanel title="Roll a New Character">
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <PixelInput
              label="Adventurer name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={errors.displayName}
              maxLength={40}
              autoComplete="nickname"
            />
            <PixelInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <PixelInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
            />
            <PixelButton type="submit" disabled={pending}>
              {pending ? "Rolling..." : "Begin"}
            </PixelButton>
          </form>
        </PixelPanel>
        <p className="mt-4 text-center font-mono text-xs text-muted">
          Already have a character?{" "}
          <Link href="/login" className="text-gold underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
