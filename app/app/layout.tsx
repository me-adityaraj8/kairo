import AudioProvider from "@/components/game/AudioProvider";
import SettingsProvider from "@/components/game/SettingsProvider";
import CursorLayer from "@/components/game/CursorLayer";

/** Audio, settings and the cursor field live only on the game routes. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AudioProvider>
        <CursorLayer>{children}</CursorLayer>
      </AudioProvider>
    </SettingsProvider>
  );
}
