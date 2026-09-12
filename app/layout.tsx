import type { Metadata } from "next";
import { Bungee, Outfit } from "next/font/google";
import Providers from "@/components/Providers";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const displayFont = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const sansFont = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
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
      <body className={`atmosphere ${displayFont.variable} ${sansFont.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
