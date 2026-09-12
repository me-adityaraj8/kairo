import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import Bag from "./Bag";

export const metadata: Metadata = {
  title: "Bag",
  robots: { index: false },
};

export default async function BagPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?from=/app/bag");

  return <Bag />;
}
