"use client";

import { useMemo, useState } from "react";
import { TopBar, type NodeOption } from "@/components/shell/TopBar";
import { TelemetryPanel } from "@/components/telemetry/TelemetryStatus";
import { NetworkBanner } from "@/components/ui/primitives";
import { RANGES, type RangeKey } from "@/lib/domain";
import { isStale } from "@/lib/format";
import { useNow, useOnline } from "@/lib/hooks";
import {
  mergeByRecordedAt,
  newer,
  num,
  oneEmbed,
  toDiagnostics,
  toNode,
  toReading,
  toSpectrum,
} from "@/lib/normalize";
import { usePranaRealtime } from "@/lib/realtime";
import { createClient } from "@/lib/supabase/client";
import { deriveTelemetry } from "@/lib/telemetry";
import type {
  Diagnostics,
  NodeInfo,
  Profile,
  RawPacket,
  Reading,
  Spectrum,
  SpectrumBaseline,
} from "@/lib/types";
import { CsvDownloadButton } from "./CsvDownloadButton";
import { RawPacketTable } from "./RawPacketTable";
import { RfQualityCard } from "./RfQualityCard";
import { SlopeHistoryChart } from "./SlopeHistoryChart";
import { SpectrumChart } from "./SpectrumChart";

export interface Lapis2Props {
  profile: Pick<Profile, "role" | "fullName" | "email">;
  nodes: NodeOption[];
  node: NodeInfo | null;
  initialReading: Reading | null;
  initialSpectrum: Spectrum | null;
  baseline: SpectrumBaseline | null;
  initialDiagnostics: Diagnostics | null;
  initialHistory: Reading[];
  initialPackets: RawPacket[];
  tableNode: string | null;
  range: RangeKey;
  tableLimit: number;
  csvReady: boolean;
  initialError: boolean;
}

/** Lapis 2 — Diagnostik Spektral CSI (peran Analis saja; RLS menegakkan di lapisan data). */
export function Lapis2Dashboard(props: Lapis2Props) {
  const { profile, nodes, baseline, tableNode, range, tableLimit, csvReady, initialError } = props;
  const nodeId = props.node?.id ?? null;

  const [node, setNode] = useState<NodeInfo | null>(props.node);
  const [reading, setReading] = useState<Reading | null>(props.initialReading);
  const [spectrum, setSpectrum] = useState<Spectrum | null>(props.initialSpectrum);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(props.initialDiagnostics);
  const [history, setHistory] = useState<Reading[]>(props.initialHistory);
  const [packets, setPackets] = useState<RawPacket[]>(props.initialPackets);
  const [fetchError, setFetchError] = useState(false);

  const now = useNow();
  const online = useOnline();

  // Satu channel untuk semua node: tabel bisa menampilkan lintas node.
  const rt = usePranaRealtime("lapis2", null, {
    onReading: async (row) => {
      const r = toReading(row);
      const forNode = r.nodeId === nodeId;
      const forTable =
        (tableNode === null || r.nodeId === tableNode) &&
        Date.parse(r.recordedAt) >= Date.now() - RANGES[range].ms;
      if (!forNode && !forTable) return;

      if (forNode) {
        setReading((cur) => newer(cur, r));
        setHistory((h) => mergeByRecordedAt(h, r, "asc"));
      }

      // ingest_reading menulis readings + diagnostics + spectra dalam satu transaksi,
      // jadi baris terkait sudah ada saat event INSERT diterima.
      const { data, error } = await createClient()
        .from("readings")
        .select("id, reading_diagnostics(*), spectra(*)")
        .eq("id", r.id)
        .maybeSingle();
      if (error) {
        setFetchError(true);
        return;
      }
      setFetchError(false);
      const diagRow = oneEmbed(data?.reading_diagnostics);
      const specRow = oneEmbed(data?.spectra);

      if (forNode) {
        if (diagRow) setDiagnostics((cur) => newer(cur, toDiagnostics(diagRow)));
        if (specRow) setSpectrum((cur) => newer(cur, toSpectrum(specRow)));
      }
      if (forTable) {
        const packet: RawPacket = { ...r, pdrPct: diagRow ? num(diagRow.pdr_pct) : null };
        setPackets((p) => mergeByRecordedAt(p, packet, "desc").slice(0, tableLimit));
      }
    },
    onNode: (row) => {
      if (row.id === nodeId) setNode(toNode(row));
    },
  });

  const telemetry = useMemo(
    () =>
      deriveTelemetry({
        link: node?.link ?? null,
        lastSeenAt: node?.lastSeenAt ?? null,
        backlogGrowing: node?.bufferBacklogGrowing ?? false,
        now,
      }),
    [node, now],
  );

  const readingStale = isStale(reading?.recordedAt, now);
  const spectrumStale = isStale(spectrum?.recordedAt, now);
  const networkProblem = initialError || fetchError || rt === "error" || !online;
  const live = rt === "live" && online && !readingStale;

  return (
    <>
      <TopBar
        nodes={nodes}
        nodeId={nodeId}
        role={profile.role}
        displayName={profile.fullName ?? profile.email ?? "Analis"}
        layer={2}
        live={live}
      />
      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-page-title font-semibold text-ink">Diagnostik Spektral CSI</h1>
          <p className="text-caption text-ink-muted">
            Lapis 2 · {node?.lokasi ? `${node.lokasi} · ` : ""}
            {nodeId ?? "Belum ada node"}
          </p>
        </div>

        {networkProblem && (
          <NetworkBanner>Koneksi ke server terganggu — nilai terakhir tetap ditampilkan.</NetworkBanner>
        )}

        {/* Baris 1 — Spektral (8) + Telemetri (4). md: keduanya 12 kolom. */}
        <div className="grid-12">
          <div className="md:col-span-12 xl:col-span-8">
            <SpectrumChart
              spectrum={spectrum}
              baseline={baseline}
              deviceBeta={spectrum && reading && reading.id === spectrum.readingId ? reading.betaCsi : null}
              stale={spectrumStale}
              now={now}
            />
          </div>
          <div className="md:col-span-12 xl:col-span-4">
            <TelemetryPanel
              view={telemetry}
              nodeId={nodeId}
              linkRecordedAt={node?.linkRecordedAt ?? null}
              batteryV={node?.batteryV ?? null}
              now={now}
              footer={<CsvDownloadButton ready={csvReady} nodeId={tableNode} range={range} />}
            />
          </div>
        </div>

        {/* Baris 2 — RF (6) + Riwayat β/ΔR (6) */}
        <div className="grid-12">
          <div className="md:col-span-6">
            <RfQualityCard reading={reading} diagnostics={diagnostics} stale={readingStale} />
          </div>
          <div className="md:col-span-6">
            <SlopeHistoryChart history={history} now={now} />
          </div>
        </div>

        {/* Baris 3 — Tabel paket mentah */}
        <RawPacketTable rows={packets} nodes={nodes} tableNode={tableNode} range={range} limit={tableLimit} />
      </main>
    </>
  );
}
