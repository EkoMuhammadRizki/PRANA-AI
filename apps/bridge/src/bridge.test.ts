import assert from "node:assert/strict";
import { test } from "node:test";
import { BacklogTracker } from "./backlog.js";
import { MessageMerger } from "./merge.js";
import { readingSchema, type ReadingPayload } from "./schema.js";

const base = {
  node_id: "PRANA_NODE_01",
  recorded_at: "2026-05-12T07:14:03Z",
  seq: 10482,
  class: "KELAS_3",
  confidence: 96.4,
  latency_ms: 12,
  temp_edge_c: 30.75,
  adc_fc28: 2389,
  moisture_pct: 55.1,
  beta_csi: 0.0817,
  delta_r_db: 7.53,
  rssi_dbm: -19.07,
  rssi_sd: 0.24,
  pdr_pct: 98.3,
  link: {
    cellular: { connected: true, band: "900MHz", mqtt_ok: true },
    buffer: { rows: 0, last_sync_at: "2026-05-12T07:12:40Z" },
    apsta: { active: true, ssid: "PRANA_NODE_01" },
  },
};
const spectrum = Array.from({ length: 52 }, (_, i) => i / 10);

test("payload kontrak §4.2 lolos & tanda β_CSI dipertahankan", () => {
  const r = readingSchema.parse({ ...base, spectrum });
  assert.equal(r.beta_csi, 0.0817);
  assert.equal(readingSchema.parse({ ...base, beta_csi: -0.0123 }).beta_csi, -0.0123);
});

test("kelas di luar kontrak ditolak", () => {
  assert.equal(readingSchema.safeParse({ ...base, class: "KELAS_4" }).success, false);
});

test("spectrum harus tepat 52 nilai", () => {
  assert.equal(readingSchema.safeParse({ ...base, spectrum: spectrum.slice(0, 46) }).success, false);
});

test("merger: potongan telemetry + spectrum digabung lalu langsung di-ingest", async () => {
  const done: ReadingPayload[] = [];
  const m = new MessageMerger(10_000, async (p) => void done.push(p), () => assert.fail("tidak boleh kedaluwarsa"));
  const { link, ...withoutLink } = base;
  await m.add(withoutLink);
  assert.equal(done.length, 0);
  await m.add({ node_id: base.node_id, seq: base.seq, spectrum, link });
  assert.equal(done.length, 1);
  assert.equal(done[0].spectrum?.length, 52);
  assert.equal(m.size, 0);
});

test("merger: potongan tak lengkap dibuang saat jendela habis", async () => {
  let expired = false;
  const m = new MessageMerger(10, async () => assert.fail("tidak boleh ingest"), () => (expired = true));
  await m.add({ node_id: "PRANA_NODE_01", seq: 1, class: "KELAS_1" });
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(expired, true);
});

test("backlog: naik terus ditandai, turun sekali mereset", () => {
  const t = new BacklogTracker(3);
  for (const rows of [1, 2, 3]) assert.equal(t.observe("n", rows).growing, false);
  assert.equal(t.observe("n", 4).growing, true);
  assert.equal(t.observe("n", 4).growing, true); // datar tidak mereset
  assert.equal(t.observe("n", 2).growing, false);
});
