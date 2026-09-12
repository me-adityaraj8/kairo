import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import Dashboard from "./Dashboard";

export const metadata: Metadata = {
  title: "Quest Log",
  robots: { index: false },
};

export default async function AppPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?from=/app");

  return <Dashboard />;
}
