import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { ScrollProgress } from "@/components/landing/Parallax";
import {
  Classes,
  Closing,
  Evidence,
  Hero,
  HowItWorks,
  Interface,
  LandingFooter,
  Problem,
  Targets,
  Telemetry,
} from "@/components/landing/Sections";
import { SplashScreen } from "@/components/landing/SplashScreen";
import { getProfile } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "PRANA-AI · Sentinel Deteksi Dini Kebakaran Gambut",
  description:
    "Stasiun sentinel sekat kanal yang memindai volume gambut dengan gelombang mikro 2,4 GHz dan matriks 52-Subcarrier Wi-Fi CSI, diklasifikasikan di perangkat oleh Physics-Informed TinyML. PKM-KC 2026, Universitas Pendidikan Indonesia.",
};

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // Landing tetap bisa dibuka walau Supabase belum dikonfigurasi.
  const signedIn = hasSupabaseEnv() ? (await getProfile()) !== null : false;

  return (
    <>
      <SplashScreen />
      <ScrollProgress />
      <LandingNav signedIn={signedIn} />
      <main>
        <Hero signedIn={signedIn} />
        <Problem />
        <HowItWorks />
        <Evidence />
        <Classes />
        <Telemetry />
        <Interface />
        <Targets />
        <Closing signedIn={signedIn} />
      </main>
      <LandingFooter />
    </>
  );
}
