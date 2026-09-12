import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import CharacterScreen from "./CharacterScreen";

export const metadata: Metadata = {
  title: "Character",
  robots: { index: false },
};

export default async function CharacterPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?from=/app/character");

  return <CharacterScreen />;
}
