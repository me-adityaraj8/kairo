import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { oauthEnabled } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Return to your quest log and keep your streak alive.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm oauth={oauthEnabled} />
    </Suspense>
  );
}
