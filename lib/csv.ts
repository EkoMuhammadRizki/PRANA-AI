/**
 * Ekspor .CSV 17 kolom — AGENTS.md §7.
 *
 * ⚠️ SPESIFIKASI BELUM TERSEDIA.
 * Struktur kolom HARUS identik dengan file .CSV store-and-forward yang ditulis
 * firmware Edge-Gateway ke LittleFS (urutan & nama kolom). Spesifikasi itu belum
 * diberikan, jadi kolom TIDAK dikarang di sini. Selama CSV_SPEC = null, tombol
 * unduh dinonaktifkan dan /api/export/csv membalas 501.
 *
 * Cara mengisi setelah spesifikasi firmware tersedia:
 *   export const CSV_SPEC: CsvColumn[] = [
 *     { header: "<nama_kolom_1>", value: (r) => r.recorded_at },
 *     ... // tepat 17 entri, urutan sama dengan firmware
 *   ];
 * `r` adalah baris readings yang di-embed dengan reading_diagnostics (lihat route).
 */

export type CsvRow = Record<string, unknown> & {
  reading_diagnostics?: Record<string, unknown> | null;
};

export interface CsvColumn {
  header: string;
  value: (row: CsvRow) => unknown;
}

export const CSV_COLUMN_COUNT = 17;

export const CSV_SPEC: CsvColumn[] | null = null;

export function isCsvReady(): boolean {
  return CSV_SPEC !== null && CSV_SPEC.length === CSV_COLUMN_COUNT;
}

/** Escape RFC 4180. Angka ditulis apa adanya (titik desimal) agar bisa digabung dengan data lapangan. */
function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: CsvRow[], spec: CsvColumn[]): string {
  const lines = [spec.map((c) => cell(c.header)).join(",")];
  for (const r of rows) lines.push(spec.map((c) => cell(c.value(r))).join(","));
  return `${lines.join("\r\n")}\r\n`;
}
