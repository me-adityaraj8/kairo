import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create Your Adventurer",
  description: "Roll a new character and start turning your tasks into quests.",
  robots: { index: false },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
