import "server-only";

import { RANGES, type RangeKey } from "./domain";
import {
  toAlert,
  toBaseline,
  toDiagnostics,
  toNode,
  toRawPacket,
  toReading,
  toSpectrum,
} from "./normalize";
import { createClient } from "./supabase/server";
import type {
  Alert,
  Diagnostics,
  NodeInfo,
  PeatClass,
  RawPacket,
  Reading,
  Recommendations,
  Spectrum,
  SpectrumBaseline,
} from "./types";

/** Hasil query: data + flag error jaringan (untuk banner non-blocking). */
export interface Result<T> {
  data: T;
  error: boolean;
}

const READING_COLS =
  "id, node_id, seq, recorded_at, received_at, source, class, confidence, latency_ms, temp_edge_c, adc_fc28, moisture_pct, beta_csi, delta_r_db, rssi_dbm";

// ── Lapis 1 (semua peran) ─────────────────────────────────────────

export async function listNodes(): Promise<Result<NodeInfo[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("nodes").select("*").order("id");
  return { data: (data ?? []).map(toNode), error: !!error };
}

export async function getLatestReading(nodeId: string): Promise<Result<Reading | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("readings")
    .select(READING_COLS)
    .eq("node_id", nodeId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data: data ? toReading(data) : null, error: !!error };
}

/** Riwayat terurut naik menurut recorded_at. */
export async function getReadingHistory(nodeId: string, sinceMs: number): Promise<Result<Reading[]>> {
  const supabase = await createClient();
  const since = new Date(Date.now() - sinceMs).toISOString();
  const { data, error } = await supabase
    .from("readings")
    .select(READING_COLS)
    .eq("node_id", nodeId)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true })
    .limit(2000);
  return { data: (data ?? []).map(toReading), error: !!error };
}

export async function getRecommendations(): Promise<Result<Recommendations>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("class_recommendations").select("class, items");
  const out: Recommendations = {};
  for (const row of data ?? []) out[row.class as PeatClass] = row.items as string[];
  return { data: out, error: !!error };
}

export async function getLatestAlert(nodeId: string): Promise<Result<Alert | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("node_id", nodeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data: data ? toAlert(data) : null, error: !!error };
}

// ── Lapis 2 (RLS: analis saja — peran User mendapat hasil kosong) ──

export async function getLatestSpectrum(nodeId: string): Promise<Result<Spectrum | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spectra")
    .select("reading_id, node_id, recorded_at, amplitudes, channel, freq_mhz")
    .eq("node_id", nodeId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data: data ? toSpectrum(data) : null, error: !!error };
}

export async function getBaseline(nodeId: string): Promise<Result<SpectrumBaseline | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spectrum_baselines")
    .select("amplitudes, captured_at, note")
    .eq("node_id", nodeId)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data: data ? toBaseline(data) : null, error: !!error };
}

export async function getLatestDiagnostics(nodeId: string): Promise<Result<Diagnostics | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_diagnostics")
    .select("reading_id, recorded_at, rssi_sd, pdr_pct, packets_tx, packets_rx")
    .eq("node_id", nodeId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data: data ? toDiagnostics(data) : null, error: !!error };
}

export const RAW_TABLE_LIMIT = 200;

export async function getRawPackets(opts: {
  nodeId: string | null;
  range: RangeKey;
}): Promise<Result<RawPacket[]>> {
  const supabase = await createClient();
  const since = new Date(Date.now() - RANGES[opts.range].ms).toISOString();
  let q = supabase
    .from("readings")
    .select(`${READING_COLS}, reading_diagnostics(pdr_pct)`)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: false })
    .limit(RAW_TABLE_LIMIT);
  if (opts.nodeId) q = q.eq("node_id", opts.nodeId);
  const { data, error } = await q;
  return { data: (data ?? []).map((r) => toRawPacket(r as Record<string, unknown>)), error: !!error };
}
