import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LandingBoot } from "@/components/landing/LandingBoot";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "PRANA-AI · Sentinel Gambut", template: "%s · PRANA-AI" },
  description: "Dashboard deteksi dini kebakaran gambut berbasis 52-Subcarrier Wi-Fi CSI.",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light", // Light mode global (DESIGN.md §1)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: skrip boot landing menambah data-js / data-splash
    // ke <html> sebelum React hydrate (pola yang sama dipakai skrip tema).
    <html lang="id" className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="min-h-screen">
        {/* Elemen pertama di <body>: dieksekusi parser sebelum konten dirender. */}
        <LandingBoot />
        {children}
      </body>
    </html>
  );
}
