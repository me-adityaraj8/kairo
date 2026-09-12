import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Return to your quest log and keep your streak alive.",
  robots: { index: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
