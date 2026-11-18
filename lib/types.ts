/** Kontrak tetap — AGENTS.md §1.2. Jangan menambah/mengganti nama kelas. */
export type PeatClass = "KELAS_1" | "KELAS_2" | "KELAS_3";
export const PEAT_CLASSES: readonly PeatClass[] = ["KELAS_1", "KELAS_2", "KELAS_3"];

export type UserRole = "user" | "analis";
export type ReadingSource = "live" | "backfill";

/** Status telemetri hibrida 3-lapis — AGENTS.md §4.2 `link`. */
export interface LinkStatus {
  cellular?: { connected: boolean; band?: string | null; mqtt_ok?: boolean | null } | null;
  buffer?: { rows: number; last_sync_at?: string | null } | null;
  apsta?: { active: boolean; ssid?: string | null } | null;
}

export interface Profile {
  userId: string;
  role: UserRole;
  fullName: string | null;
  email: string | null;
}

export interface NodeInfo {
  id: string;
  name: string;
  lokasi: string | null;
  depthCm: number | null;
  lastSeenAt: string | null;
  link: LinkStatus | null;
  linkRecordedAt: string | null;
  bufferBacklogGrowing: boolean;
  batteryV: number | null;
}

/** Metrik Lapis 1 — boleh dilihat semua peran. */
export interface Reading {
  id: number;
  nodeId: string;
  seq: number;
  recordedAt: string;
  receivedAt: string;
  source: ReadingSource;
  peatClass: PeatClass;
  confidence: number;
  latencyMs: number;
  tempEdgeC: number | null;
  adcFc28: number | null;
  moisturePct: number | null;
  betaCsi: number;
  deltaRdb: number;
  rssiDbm: number;
}

/** Metrik diagnostik Lapis 2 — RLS: analis saja. */
export interface Diagnostics {
  readingId: number;
  recordedAt: string;
  rssiSd: number | null;
  pdrPct: number | null;
  packetsTx: number | null;
  packetsRx: number | null;
}

/** Spektrum 52-subcarrier L-LTF — RLS: analis saja. */
export interface Spectrum {
  readingId: number;
  nodeId: string;
  recordedAt: string;
  amplitudes: number[];
  channel: number;
  freqMhz: number;
}

export interface SpectrumBaseline {
  amplitudes: number[];
  capturedAt: string;
  note: string | null;
}

export interface Alert {
  id: number;
  nodeId: string;
  readingId: number;
  peatClass: PeatClass;
  previousClass: PeatClass | null;
  recommendation: string[];
  recordedAt: string;
  acknowledgedAt: string | null;
}

export type Recommendations = Partial<Record<PeatClass, string[]>>;

/** Baris tabel paket mentah Lapis 2. */
export interface RawPacket extends Reading {
  pdrPct: number | null;
}
