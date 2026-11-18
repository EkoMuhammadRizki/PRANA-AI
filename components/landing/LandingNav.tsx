"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cx } from "@/components/ui/primitives";

const SECTIONS = [
  { id: "masalah", label: "Masalah" },
  { id: "cara-kerja", label: "Cara Kerja" },
  { id: "bukti", label: "Bukti Uji" },
  { id: "kelas", label: "Tiga Kelas" },
  { id: "telemetri", label: "Telemetri" },
  { id: "antarmuka", label: "Antarmuka" },
];

export function LandingNav({ signedIn }: { signedIn: boolean }) {
  const [active, setActive] = useState<string>("");
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <header
      className={cx(
        "sticky top-0 z-40 transition-colors duration-300",
        solid ? "border-b border-line bg-surface/95 backdrop-blur" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-topbar max-w-[1200px] items-center gap-4 px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/prana-ai-mark.png"
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9 object-contain"
          />
          <span className="text-card-title font-bold tracking-tight text-ink">PRANA-AI</span>
        </Link>

        <nav aria-label="Bagian halaman" className="mx-auto hidden items-center gap-1 lg:flex">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={active === s.id ? "true" : undefined}
              className={cx(
                "rounded-btn px-3 py-2 text-caption font-medium transition-colors",
                active === s.id ? "bg-brand-tint text-brand-deep" : "text-ink-muted hover:text-ink",
              )}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <Link
          href={signedIn ? "/dashboard" : "/login"}
          className="ml-auto shrink-0 rounded-btn bg-brand-gradient px-4 py-2.5 text-caption font-semibold text-white transition-colors hover:bg-none hover:bg-brand-deep lg:ml-0"
        >
          {signedIn ? "Buka Dashboard" : "Masuk Dashboard"}
        </Link>
      </div>
    </header>
  );
}
