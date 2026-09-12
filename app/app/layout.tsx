import AudioProvider from "@/components/game/AudioProvider";

/** Audio lives only on the game routes; the landing page stays lean. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AudioProvider>{children}</AudioProvider>;
}
