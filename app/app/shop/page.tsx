import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import ShopGrid from "./ShopGrid";

export const metadata: Metadata = {
  title: "Tavern Shop",
  robots: { index: false },
};

export default async function ShopPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?from=/app/shop");

  return <ShopGrid />;
}
