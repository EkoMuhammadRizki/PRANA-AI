import type { PeatClass } from "./types";

/**
 * Metadata 3 kelas TinyML — AGENTS.md §1.2 + warna DESIGN.md §2.3.
 * Nama kelas Tailwind ditulis lengkap (bukan dirangkai) agar terdeteksi JIT.
 */
export const CLASS_META: Record<
  PeatClass,
  {
    label: string;
    short: string;
    meaning: string;
    text: string;
    bg: string;
    border: string;
    borderLeft: string;
  }
> = {
  KELAS_1: {
    label: "Normal Hidrofilik",
    short: "Normal",
    meaning: "Gambut lembap sehat, β_CSI negatif.",
    text: "text-k1-text",
    bg: "bg-k1-bg",
    border: "border-k1-border",
    borderLeft: "border-l-k1-border",
  },
  KELAS_2: {
    label: "Waspada Degradasi Hidrofobik",
    short: "Waspada",
    meaning: "Inversi β_CSI positif — permukaan menipu sensor titik.",
    text: "text-k2-text",
    bg: "bg-k2-bg",
    border: "border-k2-border",
    borderLeft: "border-l-k2-border",
  },
  KELAS_3: {
    label: "Bahaya Anomali Inti Bara",
    short: "Bahaya",
    meaning: "Lonjakan daya terima + inversi slope — kantong panas di inti lintasan.",
    text: "text-k3-text",
    bg: "bg-k3-bg",
    border: "border-k3-border",
    borderLeft: "border-l-k3-border",
  },
};

export function isPeatClass(v: unknown): v is PeatClass {
  return v === "KELAS_1" || v === "KELAS_2" || v === "KELAS_3";
}

/** Batas subcarrier L-LTF — DESIGN.md §3 & §5.2. */
export const SUBCARRIER_COUNT = 52;
export const LOWER_BAND = [1, 21] as const;
export const NULL_ZONE = [22, 27] as const;
export const UPPER_BAND = [28, 52] as const;
export const WIFI_CHANNEL = 6;
export const WIFI_FREQ_MHZ = 2437;

/** Rentang waktu filter tabel paket mentah Lapis 2. */
export const RANGES = {
  "1h": { label: "1 jam", ms: 60 * 60 * 1000 },
  "6h": { label: "6 jam", ms: 6 * 60 * 60 * 1000 },
  "24h": { label: "24 jam", ms: 24 * 60 * 60 * 1000 },
  "7d": { label: "7 hari", ms: 7 * 24 * 60 * 60 * 1000 },
} as const;
export type RangeKey = keyof typeof RANGES;

export function parseRange(v: unknown): RangeKey {
  return typeof v === "string" && v in RANGES ? (v as RangeKey) : "24h";
}
