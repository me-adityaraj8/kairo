import type { Metadata } from "next";
import { Press_Start_2P, IBM_Plex_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
  display: "swap",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s · Kairo",
    default: "Kairo",
  },
  description: "Turn your real-world tasks into quests. Earn XP, level up, keep your streak alive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pixelFont.variable} ${monoFont.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
