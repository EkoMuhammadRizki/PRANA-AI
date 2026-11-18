/**
 * Konversi baris Postgres (snake_case, numeric bisa datang sebagai string)
 * ke tipe domain camelCase. Dipakai oleh query server dan payload Realtime.
 * Nilai kosong tetap null — tidak pernah diisi nilai dugaan.
 */
import type {
  Alert,
  Diagnostics,
  LinkStatus,
  NodeInfo,
  PeatClass,
  RawPacket,
  Reading,
  ReadingSource,
  Spectrum,
  SpectrumBaseline,
} from "./types";

type Row = Record<string, unknown>;

export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** Elemen tak valid menjadi NaN (digambar sebagai celah), bukan 0. */
function numArray(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => num(x) ?? Number.NaN);
}

export function toNode(r: Row): NodeInfo {
  return {
    id: String(r.id),
    name: str(r.name) ?? String(r.id),
    lokasi: str(r.lokasi),
    depthCm: num(r.depth_cm),
    lastSeenAt: str(r.last_seen_at),
    link: (r.link as LinkStatus | null) ?? null,
    linkRecordedAt: str(r.link_recorded_at),
    bufferBacklogGrowing: r.buffer_backlog_growing === true,
    batteryV: num(r.battery_v),
  };
}

export function toReading(r: Row): Reading {
  return {
    id: Number(r.id),
    nodeId: String(r.node_id),
    seq: Number(r.seq),
    recordedAt: String(r.recorded_at),
    receivedAt: String(r.received_at),
    source: (r.source as ReadingSource) ?? "live",
    peatClass: r.class as PeatClass,
    confidence: num(r.confidence) ?? Number.NaN,
    latencyMs: num(r.latency_ms) ?? Number.NaN,
    tempEdgeC: num(r.temp_edge_c),
    adcFc28: num(r.adc_fc28),
    moisturePct: num(r.moisture_pct),
    betaCsi: num(r.beta_csi) ?? Number.NaN,
    deltaRdb: num(r.delta_r_db) ?? Number.NaN,
    rssiDbm: num(r.rssi_dbm) ?? Number.NaN,
  };
}

export function toDiagnostics(r: Row): Diagnostics {
  return {
    readingId: Number(r.reading_id),
    recordedAt: String(r.recorded_at),
    rssiSd: num(r.rssi_sd),
    pdrPct: num(r.pdr_pct),
    packetsTx: num(r.packets_tx),
    packetsRx: num(r.packets_rx),
  };
}

export function toSpectrum(r: Row): Spectrum {
  return {
    readingId: Number(r.reading_id),
    nodeId: String(r.node_id),
    recordedAt: String(r.recorded_at),
    amplitudes: numArray(r.amplitudes),
    channel: num(r.channel) ?? 6,
    freqMhz: num(r.freq_mhz) ?? 2437,
  };
}

export function toBaseline(r: Row): SpectrumBaseline {
  return {
    amplitudes: numArray(r.amplitudes),
    capturedAt: String(r.captured_at),
    note: str(r.note),
  };
}

export function toAlert(r: Row): Alert {
  return {
    id: Number(r.id),
    nodeId: String(r.node_id),
    readingId: Number(r.reading_id),
    peatClass: r.class as PeatClass,
    previousClass: (r.previous_class as PeatClass | null) ?? null,
    recommendation: Array.isArray(r.recommendation) ? (r.recommendation as string[]) : [],
    recordedAt: String(r.recorded_at),
    acknowledgedAt: str(r.acknowledged_at),
  };
}

/** Embed satu-ke-satu PostgREST bisa berupa objek atau array. */
export function oneEmbed(v: unknown): Row | null {
  if (Array.isArray(v)) return (v[0] as Row) ?? null;
  return (v as Row) ?? null;
}

/** readings + embed reading_diagnostics(pdr_pct) */
export function toRawPacket(r: Row): RawPacket {
  const diag = oneEmbed(r.reading_diagnostics);
  return { ...toReading(r), pdrPct: diag ? num(diag.pdr_pct) : null };
}

/** Sisipkan & urutkan berdasarkan recorded_at (waktu perangkat), buang duplikat id. */
export function mergeByRecordedAt<T extends { id: number; recordedAt: string }>(
  list: T[],
  incoming: T,
  order: "asc" | "desc",
): T[] {
  const next = list.filter((x) => x.id !== incoming.id);
  next.push(incoming);
  next.sort((a, b) => {
    const d = Date.parse(a.recordedAt) - Date.parse(b.recordedAt);
    return order === "asc" ? d : -d;
  });
  return next;
}

/** Pilih pembacaan terbaru menurut recorded_at (data backfill bisa lebih tua). */
export function newer<T extends { recordedAt: string }>(current: T | null, incoming: T): T {
  if (!current) return incoming;
  return Date.parse(incoming.recordedAt) >= Date.parse(current.recordedAt) ? incoming : current;
}
