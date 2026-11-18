/**
 * Formatter angka & waktu terpusat — AGENTS.md §6.
 * Locale id-ID (koma desimal), waktu ditampilkan dalam WIB (Asia/Jakarta).
 */

const MINUS = "−"; // tanda minus tipografis, bukan tanda hubung
export const EMPTY = "—"; // "—"
export const STALE_AFTER_MS = 10 * 60 * 1000; // > 10 menit = data tertunda

const nfCache = new Map<string, Intl.NumberFormat>();
function nf(decimals: number, grouping: boolean): Intl.NumberFormat {
  const key = `${decimals}:${grouping}`;
  let f = nfCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouping,
    });
    nfCache.set(key, f);
  }
  return f;
}

export interface MetricOptions {
  /** Jumlah digit desimal (default 2). */
  decimals?: number;
  /**
   * Tanda eksplisit + / −. WAJIB untuk β_CSI dan ΔR —
   * inversi tanda adalah inti deteksi degradasi hidrofobik.
   */
  signed?: boolean;
  /** Pemisah ribuan (default true). Dimatikan untuk nilai ADC. */
  grouping?: boolean;
}

/** Format angka metrik. Nilai kosong/tidak valid → "—", tidak pernah ditebak. */
export function formatMetric(value: number | null | undefined, opts: MetricOptions = {}): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EMPTY;
  const { decimals = 2, signed = false, grouping = true } = opts;
  const body = nf(decimals, grouping).format(Math.abs(value));
  if (value < 0) return MINUS + body;
  if (signed) return (value > 0 ? "+" : "±") + body;
  return body;
}

type Maybe = number | null | undefined;

/** Preset per metrik domain agar presisi konsisten di seluruh aplikasi. */
export const fmt = {
  betaCsi: (v: Maybe) => formatMetric(v, { decimals: 4, signed: true }),
  deltaRdb: (v: Maybe) => formatMetric(v, { decimals: 2, signed: true }),
  rssiDbm: (v: Maybe) => formatMetric(v, { decimals: 2 }),
  rssiSd: (v: Maybe) => formatMetric(v, { decimals: 2 }),
  tempEdgeC: (v: Maybe) => formatMetric(v, { decimals: 2 }),
  moisturePct: (v: Maybe) => formatMetric(v, { decimals: 1 }),
  adcFc28: (v: Maybe) => formatMetric(v, { decimals: 0, grouping: false }),
  pdrPct: (v: Maybe) => formatMetric(v, { decimals: 1 }),
  confidence: (v: Maybe) => formatMetric(v, { decimals: 1 }),
  latencyMs: (v: Maybe) => formatMetric(v, { decimals: 0 }),
  batteryV: (v: Maybe) => formatMetric(v, { decimals: 2 }),
  amplitude: (v: Maybe) => formatMetric(v, { decimals: 2 }),
  int: (v: Maybe) => formatMetric(v, { decimals: 0 }),
};

const TZ = "Asia/Jakarta";
const dtFull = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const dtShort = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const dtClock = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const dtClockSec = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "12 Mei 2026, 14.14.03 WIB" */
export function formatWIB(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? `${dtFull.format(d)} WIB` : EMPTY;
}

/** "12 Mei, 14.14 WIB" */
export function formatShortWIB(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? `${dtShort.format(d)} WIB` : EMPTY;
}

/** "14.14" — untuk sumbu grafik (epoch ms). */
export function formatClockWIB(ms: number): string {
  return dtClock.format(new Date(ms));
}

/** "14.14.03 WIB" */
export function formatTimeWIB(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? `${dtClockSec.format(d)} WIB` : EMPTY;
}

/** Umur relatif singkat: "baru saja", "4 mnt lalu", "2 jam lalu", "3 hari lalu". */
export function formatAge(iso: string | null | undefined, now: number): string {
  const d = parse(iso);
  if (!d) return EMPTY;
  const s = Math.max(0, Math.round((now - d.getTime()) / 1000));
  if (s < 45) return "baru saja";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} jam lalu`;
  return `${Math.round(h / 24)} hari lalu`;
}

/** true bila recorded_at > 10 menit atau tidak ada. */
export function isStale(iso: string | null | undefined, now: number): boolean {
  const d = parse(iso);
  return !d || now - d.getTime() > STALE_AFTER_MS;
}
