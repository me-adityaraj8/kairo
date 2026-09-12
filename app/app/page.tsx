import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PixelPanel from "@/components/PixelPanel";

export const metadata: Metadata = {
  title: "Quest Log",
  robots: { index: false },
};

export default async function AppPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?from=/app");

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 font-pixel text-base text-gold">Quest Log</h1>
      <PixelPanel title="Adventurer">
        <p className="font-mono text-sm">Signed in as {user.name}</p>
      </PixelPanel>
    </main>
  );
}
