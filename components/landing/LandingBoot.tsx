import { SPLASH_SESSION_KEY } from "./splash-key";

/**
 * Skrip boot landing — Server Component, bukan komponen klien.
 *
 * Penting: `<script>` hanya dieksekusi saat ikut terkirim di HTML dari server.
 * Kalau komponen ini berada di file ber-"use client", React akan merendernya di
 * browser dan skripnya tidak pernah jalan.
 *
 * Dijalankan sebelum paint pertama untuk dua hal:
 *  1. `data-js="on"` — penanda bahwa skrip hidup, sehingga animasi masuk boleh
 *     dipasang. Tanpa ini konten landing tampil apa adanya, tidak transparan.
 *  2. `data-splash="seen"` — mencegah splash berkedip saat pengguna kembali ke
 *     landing dalam sesi browser yang sama.
 */
export function LandingBoot() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          `var d=document.documentElement;d.dataset.js='on';` +
          `try{if(sessionStorage.getItem('${SPLASH_SESSION_KEY}')==='1')d.dataset.splash='seen'}catch(e){}`,
      }}
    />
  );
}
