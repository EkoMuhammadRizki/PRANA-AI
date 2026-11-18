"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SPLASH_SESSION_KEY } from "./splash-key";

/**
 * Splash screen pembuka landing page.
 *
 * Animasi digerakkan CSS (`.splash` di globals.css) dengan `forwards`, sehingga
 * overlay tetap menghilang walau JavaScript gagal dimuat. JavaScript hanya
 * menambahkan dua hal: tombol lewati, dan penanda agar splash tampil sekali
 * per sesi browser. Pengguna dengan "reduce motion" tidak melihatnya sama sekali.
 *
 * Konten landing tetap dirender di bawah overlay — bukan ditunda — supaya
 * terbaca mesin pencari dan pembaca layar.
 */
/** Ditandai saat splash benar-benar selesai, bukan saat mulai. */
function markSeen() {
  try {
    sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
  } catch {
    // Mode privat / penyimpanan diblokir — splash tetap jalan, hanya tidak diingat.
  }
}

export function SplashScreen() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const seen = (() => {
      try {
        return sessionStorage.getItem(SPLASH_SESSION_KEY) === "1";
      } catch {
        return false;
      }
    })();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (seen || reduced) {
      root.dataset.splash = "seen";
      setDone(true);
      return;
    }

    // Penandaan dilakukan di akhir, bukan di awal: React Strict Mode menjalankan
    // effect ini dua kali saat pengembangan, dan menandai di awal membuat splash
    // langsung dianggap sudah tampil pada mount kedua.
    // Lepas dari DOM setelah animasi keluar selesai (1,9s + 0,6s).
    const t = setTimeout(() => {
      markSeen();
      setDone(true);
    }, 2600);
    return () => clearTimeout(t);
  }, []);

  if (done) return null;

  return (
    <div className="splash" aria-hidden="true">
      <div className="relative grid place-items-center px-6 text-center">
        {/* Gelombang mikro yang memancar dari antena */}
        <span className="splash__ring" />
        <span className="splash__ring" style={{ animationDelay: "0.5s" }} />
        <span className="splash__ring" style={{ animationDelay: "1s" }} />

        <div className="splash__logo relative">
          <Image
            src="/prana-ai-mark.png"
            alt=""
            width={132}
            height={132}
            priority
            className="h-24 w-24 object-contain sm:h-32 sm:w-32"
          />
        </div>

        <div className="splash__text relative mt-6">
          <p className="text-[28px] font-bold leading-none tracking-tight text-ink sm:text-[34px]">PRANA-AI</p>
          <p className="mt-2 text-body text-ink-muted">Sentinel deteksi dini kebakaran gambut</p>
          <p className="mt-1 text-caption text-ink-disabled">
            PKM-KC 2026 · Universitas Pendidikan Indonesia
          </p>
          <div className="mx-auto mt-6 h-0.5 w-40 overflow-hidden rounded-full bg-line">
            <div className="splash__bar h-full w-full bg-brand-gradient" />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          markSeen();
          setDone(true);
        }}
        className="absolute bottom-8 right-8 rounded-btn px-3 py-1.5 text-caption font-medium text-ink-muted transition-colors hover:text-ink"
      >
        Lewati
      </button>
    </div>
  );
}
