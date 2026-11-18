/**
 * PRANA-AI MQTT → Supabase bridge (AGENTS.md §4, pola A).
 *
 * Proses Node.js yang SELALU HIDUP (VPS / Railway / Fly.io). Jangan pernah
 * dijalankan sebagai fungsi serverless Vercel.
 *
 *   prana/{node_id}/telemetry  ┐
 *   prana/{node_id}/inference  ├─ digabung per (node_id, seq) → ingest_reading(live)
 *   prana/{node_id}/spectrum   ┘  (spectrum terlambat → attach_spectrum)
 *   prana/{node_id}/backfill   ─→ ingest_reading(backfill)
 *   prana/{node_id}/status     ─→ ingest_status (retain)
 *
 * Ack QoS 1 baru dikirim SETELAH pesan diproses (handleMessage). Kegagalan DB
 * permanen ditulis ke file dead-letter (JSONL) untuk diputar ulang — target 0% data loss.
 */
import { appendFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";
import mqtt, { type IPublishPacket } from "mqtt";
import { BacklogTracker } from "./backlog.js";
import { MessageMerger } from "./merge.js";
import {
  describeIssues,
  partSchema,
  readingSchema,
  spectrumOnlySchema,
  statusSchema,
  type ReadingPayload,
} from "./schema.js";

// ── Konfigurasi (hanya dari env server; tidak pernah ke client) ──
function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`[bridge] env ${name} wajib diisi`);
    process.exit(1);
  }
  return v;
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? required("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = required("SUPABASE_SERVICE_ROLE_KEY");
const MQTT_URL = required("MQTT_URL");
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID ?? "prana-bridge-01";
const MERGE_WINDOW_MS = Number(process.env.MERGE_WINDOW_MS ?? 5000);
const DEADLETTER_PATH = process.env.DEADLETTER_PATH ?? "./deadletter.jsonl";
const HEALTH_PORT = Number(process.env.HEALTH_PORT ?? 8080);
const BRIDGE_SHARED_SECRET = process.env.BRIDGE_SHARED_SECRET;
const FUTURE_SKEW_MS = 5 * 60 * 1000;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const stats = { received: 0, inserted: 0, duplicate: 0, rejected: 0, deadletter: 0, startedAt: new Date().toISOString() };
const backlog = new BacklogTracker();

const log = {
  info: (msg: string, extra?: object) => console.log(JSON.stringify({ level: "info", msg, ...extra })),
  warn: (msg: string, extra?: object) => console.warn(JSON.stringify({ level: "warn", msg, ...extra })),
  error: (msg: string, extra?: object) => console.error(JSON.stringify({ level: "error", msg, ...extra })),
};

// ── Supabase RPC dengan retry + dead-letter ──────────────────────
async function rpcWithRetry(fn: string, args: Record<string, unknown>, attempts = 4): Promise<unknown> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await supabase.rpc(fn, args);
    if (!error) return data;
    lastErr = error;
    // Kesalahan data (kode Postgres kelas 22/23) tidak akan pulih dengan retry.
    if (error.code && /^2[23]/.test(error.code)) break;
    await new Promise((r) => setTimeout(r, 500 * 2 ** i));
  }
  throw lastErr;
}

async function deadLetter(topic: string, payload: unknown, reason: unknown) {
  stats.deadletter++;
  const line = JSON.stringify({ at: new Date().toISOString(), topic, reason: String((reason as Error)?.message ?? reason), payload });
  try {
    await appendFile(DEADLETTER_PATH, `${line}\n`, "utf8");
  } catch (e) {
    log.error("gagal menulis dead-letter", { error: String(e), line });
  }
}

function observeBacklog(nodeId: string, link: ReadingPayload["link"]) {
  const rows = link?.buffer?.rows;
  if (typeof rows !== "number") return;
  const { growing, changed } = backlog.observe(nodeId, rows);
  if (changed && growing) {
    log.warn("antrean store-and-forward terus naik tanpa turun", { node_id: nodeId, rows });
  } else if (changed && !growing) {
    log.info("antrean store-and-forward kembali turun", { node_id: nodeId, rows });
  }
}

function checkClock(nodeId: string, recordedAt: string) {
  if (Date.parse(recordedAt) - Date.now() > FUTURE_SKEW_MS) {
    log.warn("recorded_at di masa depan — periksa RTC/NTP perangkat", { node_id: nodeId, recorded_at: recordedAt });
  }
}

async function ingestReading(p: ReadingPayload, source: "live" | "backfill", topic: string) {
  checkClock(p.node_id, p.recorded_at);
  observeBacklog(p.node_id, p.link);
  try {
    const res = (await rpcWithRetry("ingest_reading", { p, p_source: source })) as { status?: string } | null;
    if (res?.status === "duplicate") stats.duplicate++;
    else stats.inserted++;
  } catch (e) {
    log.error("ingest_reading gagal", { node_id: p.node_id, seq: p.seq, error: String((e as Error)?.message ?? e) });
    await deadLetter(topic, p, e);
  }
}

const merger = new MessageMerger(
  MERGE_WINDOW_MS,
  (p) => ingestReading(p, "live", `prana/${p.node_id}/telemetry`),
  (key, data, reason) => {
    stats.rejected++;
    log.warn("potongan pesan tidak pernah lengkap — dibuang", { key, missing: reason });
    void deadLetter("merge-expired", data, `tidak lengkap: ${reason}`);
  },
);

// ── Router topik ─────────────────────────────────────────────────
const TOPIC_RE = /^prana\/([^/]+)\/(telemetry|inference|spectrum|status|backfill)$/;

async function handle(topic: string, raw: Buffer): Promise<void> {
  stats.received++;
  const m = TOPIC_RE.exec(topic);
  if (!m) return;
  const [, topicNode, kind] = m;

  let body: unknown;
  try {
    body = JSON.parse(raw.toString("utf8"));
  } catch {
    stats.rejected++;
    log.warn("payload bukan JSON", { topic });
    return;
  }

  // node_id di payload wajib sama dengan segmen topik (cegah salah alamat).
  if ((body as { node_id?: unknown })?.node_id !== topicNode) {
    stats.rejected++;
    log.warn("node_id payload tidak cocok dengan topik", { topic });
    return;
  }

  switch (kind) {
    case "status": {
      const r = statusSchema.safeParse(body);
      if (!r.success) {
        stats.rejected++;
        log.warn("status ditolak", { topic, issues: describeIssues(r.error) });
        return;
      }
      checkClock(r.data.node_id, r.data.recorded_at);
      observeBacklog(r.data.node_id, r.data.link);
      try {
        await rpcWithRetry("ingest_status", { p: r.data, p_backlog_growing: backlog.isGrowing(r.data.node_id) });
      } catch (e) {
        log.error("ingest_status gagal", { topic, error: String((e as Error)?.message ?? e) });
        await deadLetter(topic, r.data, e);
      }
      return;
    }

    case "backfill": {
      const r = readingSchema.safeParse(body);
      if (!r.success) {
        stats.rejected++;
        log.warn("backfill ditolak", { topic, issues: describeIssues(r.error) });
        await deadLetter(topic, body, describeIssues(r.error));
        return;
      }
      await ingestReading(r.data, "backfill", topic);
      return;
    }

    case "spectrum": {
      const s = spectrumOnlySchema.safeParse(body);
      if (!s.success) {
        // Mungkin payload lengkap yang dikirim di topik spectrum.
        const full = readingSchema.safeParse(body);
        if (full.success) return merger.add(full.data);
        stats.rejected++;
        log.warn("spectrum ditolak", { topic, issues: describeIssues(s.error) });
        return;
      }
      if (merger.has(s.data.node_id, s.data.seq)) return merger.add(s.data);
      // Reading-nya mungkin sudah tersimpan → tempelkan; bila belum, tunggu di merger.
      try {
        const res = (await rpcWithRetry("attach_spectrum", { p: s.data })) as { status?: string } | null;
        if (res?.status !== "inserted") await merger.add(s.data);
      } catch (e) {
        log.error("attach_spectrum gagal", { topic, error: String((e as Error)?.message ?? e) });
        await deadLetter(topic, s.data, e);
      }
      return;
    }

    case "telemetry":
    case "inference": {
      const part = partSchema.safeParse(body);
      if (!part.success) {
        stats.rejected++;
        log.warn(`${kind} ditolak`, { topic, issues: describeIssues(part.error) });
        return;
      }
      await merger.add(part.data);
      return;
    }
  }
}

// ── MQTT ─────────────────────────────────────────────────────────
const client = mqtt.connect(MQTT_URL, {
  clientId: MQTT_CLIENT_ID,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  clean: false, // sesi persisten: pesan QoS 1 selama bridge mati tetap diantre broker
  reconnectPeriod: 5000,
  connectTimeout: 30_000,
});

// Proses satu per satu; PUBACK dikirim setelah callback dipanggil.
client.handleMessage = (packet, callback) => {
  const p = packet as IPublishPacket;
  const payload = Buffer.isBuffer(p.payload) ? p.payload : Buffer.from(p.payload);
  handle(p.topic, payload)
    .catch((e) => log.error("handler error", { topic: p.topic, error: String(e) }))
    .finally(() => callback());
};

client.on("connect", (ack) => {
  log.info("terhubung ke broker", { session_present: ack.sessionPresent });
  client.subscribe("prana/+/+", { qos: 1 }, (err) => {
    if (err) log.error("subscribe gagal", { error: String(err) });
    else log.info("berlangganan prana/+/+ (QoS 1)");
  });
});
client.on("reconnect", () => log.warn("menyambung ulang ke broker"));
client.on("error", (e) => log.error("mqtt error", { error: String(e) }));

// ── Health check (opsional dilindungi BRIDGE_SHARED_SECRET) ──────
const health = createServer((req, res) => {
  if (req.url !== "/health") {
    res.writeHead(404).end();
    return;
  }
  if (BRIDGE_SHARED_SECRET && req.headers.authorization !== `Bearer ${BRIDGE_SHARED_SECRET}`) {
    res.writeHead(401).end();
    return;
  }
  res.writeHead(client.connected ? 200 : 503, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ mqtt_connected: client.connected, pending_merge: merger.size, ...stats }));
});
health.listen(HEALTH_PORT, () => log.info("health check aktif", { port: HEALTH_PORT }));

// ── Shutdown rapi ────────────────────────────────────────────────
async function shutdown(signal: string) {
  log.info("berhenti", { signal });
  await merger.drain();
  client.end(false, {}, () => {
    health.close();
    process.exit(0);
  });
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
