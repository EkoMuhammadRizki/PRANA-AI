/**
 * Validasi payload — kontrak AGENTS.md §4.2.
 * Payload yang tidak lolos validasi DITOLAK (dicatat), tidak "diperbaiki"
 * atau diisi nilai dugaan.
 */
import { z } from "zod";

export const PEAT_CLASSES = ["KELAS_1", "KELAS_2", "KELAS_3"] as const;
export const SUBCARRIERS = 52;

const nodeId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "node_id tidak valid");
const isoTime = z.iso.datetime({ offset: true });
const finite = z.number().refine(Number.isFinite, "harus angka berhingga");

export const linkSchema = z.object({
  cellular: z
    .object({ connected: z.boolean(), band: z.string().nullish(), mqtt_ok: z.boolean().nullish() })
    .nullish(),
  buffer: z.object({ rows: z.number().int().nonnegative(), last_sync_at: isoTime.nullish() }).nullish(),
  apsta: z.object({ active: z.boolean(), ssid: z.string().nullish() }).nullish(),
});

export const spectrumArray = z.array(finite).length(SUBCARRIERS, `spectrum wajib ${SUBCARRIERS} nilai`);

export const readingSchema = z.object({
  node_id: nodeId,
  recorded_at: isoTime,
  seq: z.number().int().nonnegative(),
  class: z.enum(PEAT_CLASSES),
  confidence: finite.min(0).max(100),
  latency_ms: z.number().int().nonnegative(),
  temp_edge_c: finite.nullable(), // MAX6675 bisa melaporkan termokopel terbuka → null
  adc_fc28: z.number().int().min(0).max(4095).nullable(),
  moisture_pct: finite.min(0).max(100).nullable(),
  beta_csi: finite, // tanda +/− dipertahankan apa adanya
  delta_r_db: finite,
  rssi_dbm: finite,
  rssi_sd: finite.nonnegative().nullish(),
  pdr_pct: finite.min(0).max(100).nullish(),
  packets_tx: z.number().int().nonnegative().nullish(),
  packets_rx: z.number().int().nonnegative().nullish(),
  spectrum: spectrumArray.optional(),
  channel: z.number().int().min(1).max(14).optional(),
  freq_mhz: z.number().int().optional(),
  link: linkSchema.optional(),
});
export type ReadingPayload = z.infer<typeof readingSchema>;

/** Potongan pesan (telemetry/inference/spectrum terpisah) — minimal kunci idempotensi. */
export const partSchema = z.looseObject({ node_id: nodeId, seq: z.number().int().nonnegative() });

export const spectrumOnlySchema = z.object({
  node_id: nodeId,
  seq: z.number().int().nonnegative(),
  spectrum: spectrumArray,
  channel: z.number().int().min(1).max(14).optional(),
  freq_mhz: z.number().int().optional(),
});

export const statusSchema = z.object({
  node_id: nodeId,
  recorded_at: isoTime,
  link: linkSchema.optional(),
  battery_v: finite.nonnegative().nullish(),
});
export type StatusPayload = z.infer<typeof statusSchema>;

export function describeIssues(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
}
