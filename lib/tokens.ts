/**
 * Token warna PRANA-AI — salinan 1:1 DESIGN.md §2.
 * Satu sumber kebenaran: diimpor oleh tailwind.config.ts (kelas utilitas)
 * dan oleh komponen grafik SVG (Recharts butuh nilai hex mentah).
 */
export const colors = {
  // §2.1 Brand — identitas & aksi, BUKAN status
  brand: {
    DEFAULT: "#FB6717",
    amber: "#FCB925",
    deep: "#D1410A",
    tint: "#FFF7ED", // hover tombol sekunder & baris tabel
  },
  // §2.2 Netral
  app: "#FAFAF8",
  surface: { DEFAULT: "#FFFFFF", muted: "#F5F3EF" },
  line: "#E8E4DE",
  ink: { DEFAULT: "#1A1613", muted: "#78716C", disabled: "#A8A29E" },
  // §2.3 Status klasifikasi TinyML
  k1: { text: "#15803D", bg: "#ECFDF3", border: "#15803D" },
  k2: { text: "#B45309", bg: "#FFF7E6", border: "#FCB925" },
  k3: { text: "#B91C1C", bg: "#FEF2F2", border: "#DC2626" },
  // §2.4 Fungsional
  live: { text: "#15803D", dot: "#22C55E" },
  offline: { text: "#78716C", dot: "#A8A29E" },
  backfill: { dot: "#FCB925" },
  danger: { DEFAULT: "#DC2626" },
  series: {
    primary: "#FB6717", // seri utama — amplitudo CSI / nilai terkini
    baseline: "#0EA5E9", // baseline / referensi kalibrasi
    history: "#78716C", // histori / pembanding
    threshold: "#DC2626", // ambang bahaya / garis threshold
  },
  spectral: { bg: "#1C1917", grid: "#3A3330", axis: "#D6D3D1" },
} as const;

/** Area gradien grafik umum (DESIGN.md §3). */
export const areaGradient = { from: "rgba(251,103,23,0.18)", to: "rgba(251,103,23,0)" } as const;
/** Arsiran zona null subcarrier 22–27. */
export const nullZoneFill = "rgba(255,255,255,0.06)";

export const fontMono = "var(--font-jetbrains), ui-monospace, monospace";
