import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import AchievementHall from "./AchievementHall";

export const metadata: Metadata = {
  title: "Hall of Deeds",
  robots: { index: false },
};

export default async function AchievementsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?from=/app/achievements");

  return <AchievementHall />;
}
