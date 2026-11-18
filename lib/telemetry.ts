/**
 * Turunan status telemetri hibrida 3-lapis — AGENTS.md §2.1.
 * Murni fungsi (tanpa React) agar bisa diuji dan dipakai lintas peran.
 * Tidak menyentuh data spektral sehingga aman untuk peran User.
 */
import { formatAge, formatShortWIB, isStale } from "./format";
import type { LinkStatus } from "./types";

/**
 * ok       → hijau  (sehat)
 * idle     → abu    (tidak aktif / terputus, tidak berbahaya)
 * backfill → amber  (ada antrean store-and-forward)
 * down     → merah  (HANYA bila ketiga lapis gagal / node tak terjangkau)
 * unknown  → abu    (belum pernah ada paket)
 */
export type LayerState = "ok" | "idle" | "backfill" | "down" | "unknown";

export interface LayerView {
  key: "cellular" | "buffer" | "apsta";
  title: string;
  state: LayerState;
  status: string;
  details: string[];
}

export interface TelemetryView {
  layers: [LayerView, LayerView, LayerView];
  /** Seluler terputus + store-and-forward menyimpan antrean → keterangan wajib. */
  degraded: boolean;
  /** Ketiga lapis gagal: node benar-benar tidak terjangkau. */
  unreachable: boolean;
  /** Antrean terus naik tanpa pernah turun (ditandai bridge) — anomali. */
  backlogAnomaly: boolean;
  hasData: boolean;
}

export const DEGRADED_NOTE = "Data terakhir dari store-and-forward — belum tentu kondisi terkini.";
export const BACKLOG_ANOMALY_NOTE =
  "Antrean store-and-forward terus bertambah tanpa berkurang — periksa sinkronisasi backfill.";

/** Pita rendah A7670E di Indonesia — proposal §5.5: Band 5 = 850 MHz, Band 8 = 900 MHz. */
const LTE_BANDS: Record<string, string> = { "850": "Band 5", "900": "Band 8" };

function formatBand(band: string | null | undefined): string {
  if (!band) return "Pita 850/900 MHz";
  const m = /^(\d{3,4})\s*mhz$/i.exec(band.trim());
  if (!m) return `Pita ${band}`;
  return LTE_BANDS[m[1]] ? `${LTE_BANDS[m[1]]} · ${m[1]} MHz` : `Pita ${m[1]} MHz`;
}

export function deriveTelemetry(input: {
  link: LinkStatus | null;
  lastSeenAt: string | null;
  backlogGrowing: boolean;
  now: number;
}): TelemetryView {
  const { link, lastSeenAt, backlogGrowing, now } = input;

  if (!link) {
    const waiting = (key: LayerView["key"], title: string): LayerView => ({
      key,
      title,
      state: "unknown",
      status: "Menunggu paket",
      details: [],
    });
    return {
      layers: [
        waiting("cellular", "Seluler 4G (A7670E)"),
        waiting("buffer", "Store-and-Forward"),
        waiting("apsta", "Wi-Fi APSTA Patroli"),
      ],
      degraded: false,
      unreachable: false,
      backlogAnomaly: false,
      hasData: false,
    };
  }

  const cellular = link.cellular ?? null;
  const buffer = link.buffer ?? null;
  const apsta = link.apsta ?? null;

  const contactStale = isStale(lastSeenAt, now);
  const cellularUp = cellular?.connected === true && cellular.mqtt_ok !== false;
  const apstaUp = apsta?.active === true;
  const rows = typeof buffer?.rows === "number" ? buffer.rows : null;
  const hasBacklog = rows !== null && rows > 0;

  // Dari sisi cloud, "ketiga lapis gagal" = tidak ada kontak > 10 menit DAN
  // status terakhir yang diketahui: seluler putus & APSTA mati.
  const unreachable = contactStale && !cellularUp && !apstaUp;

  // ── Lapis 1: Seluler ────────────────────────────────────────────
  // Urutan = prioritas (strip ringkas bisa terpotong di tablet).
  const cellularDetails: string[] = [];
  if (contactStale && lastSeenAt) cellularDetails.push(`kontak terakhir ${formatAge(lastSeenAt, now)}`);
  if (cellular?.mqtt_ok === true) cellularDetails.push("MQTT OK");
  else if (cellular?.mqtt_ok === false) cellularDetails.push("MQTT gagal");
  cellularDetails.push(formatBand(cellular?.band));

  const cellularView: LayerView = {
    key: "cellular",
    title: "Seluler 4G (A7670E)",
    state: unreachable ? "down" : cellularUp && !contactStale ? "ok" : "idle",
    status: cellular?.connected ? "Terhubung" : "Terputus",
    details: cellularDetails,
  };

  // ── Lapis 2: Store-and-Forward ─────────────────────────────────
  const syncText = buffer?.last_sync_at ? `sinkron terakhir ${formatShortWIB(buffer.last_sync_at)}` : null;
  const bufferView: LayerView = {
    key: "buffer",
    title: "Store-and-Forward",
    state: unreachable ? "down" : hasBacklog || backlogGrowing ? "backfill" : rows === 0 ? "ok" : "unknown",
    status:
      rows === null
        ? "Status antrean tidak dilaporkan"
        : rows === 0
          ? "Tersinkron"
          : `Tersimpan ${rows.toLocaleString("id-ID")} baris .CSV`,
    details: [...(syncText ? [syncText] : []), "LittleFS 16MB"],
  };

  // ── Lapis 3: Wi-Fi APSTA ───────────────────────────────────────
  const apstaView: LayerView = {
    key: "apsta",
    title: "Wi-Fi APSTA Patroli",
    state: unreachable ? "down" : apstaUp ? "ok" : "idle",
    status: apstaUp ? "Aktif" : "Nonaktif",
    details: apsta?.ssid ? [`SSID: ${apsta.ssid}`] : [],
  };

  return {
    layers: [cellularView, bufferView, apstaView],
    degraded: !cellularUp && hasBacklog,
    unreachable,
    backlogAnomaly: backlogGrowing,
    hasData: true,
  };
}
