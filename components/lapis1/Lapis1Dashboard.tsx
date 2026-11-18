"use client";

import { useMemo, useState } from "react";
import { TopBar, type NodeOption } from "@/components/shell/TopBar";
import { TelemetryStrip } from "@/components/telemetry/TelemetryStatus";
import { IconDroplet, IconSignal, IconSlope, IconThermometer } from "@/components/ui/icons";
import { NetworkBanner } from "@/components/ui/primitives";
import { fmt, isStale } from "@/lib/format";
import { useNow, useOnline } from "@/lib/hooks";
import { mergeByRecordedAt, newer, toAlert, toNode, toReading } from "@/lib/normalize";
import { usePranaRealtime } from "@/lib/realtime";
import { deriveTelemetry } from "@/lib/telemetry";
import type { Alert, NodeInfo, Profile, Reading, Recommendations } from "@/lib/types";
import { KpiCard } from "./KpiCard";
import { RecommendationCard } from "./RecommendationCard";
import { StatusAICard } from "./StatusAICard";
import { TrendChart } from "./TrendChart";

export interface Lapis1Props {
  profile: Pick<Profile, "role" | "fullName" | "email">;
  nodes: NodeOption[];
  node: NodeInfo | null;
  initialReading: Reading | null;
  initialHistory: Reading[];
  initialAlert: Alert | null;
  recommendations: Recommendations;
  initialError: boolean;
}

/** Lapis 1 — Status Operasional (peran User & Analis). Tanpa data spektral/PDR. */
export function Lapis1Dashboard(props: Lapis1Props) {
  const { profile, nodes, recommendations, initialError } = props;
  const nodeId = props.node?.id ?? null;

  const [node, setNode] = useState<NodeInfo | null>(props.node);
  const [reading, setReading] = useState<Reading | null>(props.initialReading);
  const [history, setHistory] = useState<Reading[]>(props.initialHistory);
  const [alert, setAlert] = useState<Alert | null>(props.initialAlert);

  const now = useNow();
  const online = useOnline();

  const rt = usePranaRealtime("lapis1", nodeId, {
    onReading: (row) => {
      const r = toReading(row);
      // Data bisa datang terlambat (backfill): urutkan menurut recorded_at, idempoten per id.
      setReading((cur) => newer(cur, r));
      setHistory((h) => mergeByRecordedAt(h, r, "asc"));
    },
    onNode: (row) => setNode(toNode(row)),
    onAlert: (row) => setAlert(toAlert(row)),
  });

  const stale = isStale(reading?.recordedAt, now);
  const empty = reading === null;

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

  // Rekomendasi: dari alert transisi bila masih berlaku untuk kelas aktif, selain itu default kelas.
  const recItems = useMemo(() => {
    if (!reading) return [];
    if (
      alert &&
      !alert.acknowledgedAt &&
      alert.peatClass === reading.peatClass &&
      Date.parse(alert.recordedAt) <= Date.parse(reading.recordedAt) &&
      alert.recommendation.length > 0
    ) {
      return alert.recommendation;
    }
    return recommendations[reading.peatClass] ?? [];
  }, [alert, reading, recommendations]);

  const networkProblem = initialError || rt === "error" || !online;
  const live = rt === "live" && online && !stale;

  return (
    <>
      <TopBar
        nodes={nodes}
        nodeId={nodeId}
        role={profile.role}
        displayName={profile.fullName ?? profile.email ?? "Pengguna"}
        layer={1}
        live={live}
      />
      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-page-title font-semibold text-ink">Status Operasional</h1>
          <p className="text-caption text-ink-muted">Lapis 1 · {nodeId ?? "Belum ada node"}</p>
        </div>

        {networkProblem && (
          <NetworkBanner>Koneksi ke server terganggu — nilai terakhir tetap ditampilkan.</NetworkBanner>
        )}

        {/* Baris 1 — Kartu Status AI */}
        <StatusAICard reading={reading} node={node} stale={stale} now={now} />

        {/* Baris 2 — 4 KPI (xl: 4×3 kolom · md: 2×2 · mobile: 1 kolom) */}
        <div className="grid-12">
          <div className="md:col-span-6 xl:col-span-3">
            <KpiCard
              label="Suhu Tepi"
              sensor="MAX6675 Tipe-K · off-axis"
              icon={<IconThermometer />}
              value={fmt.tempEdgeC(reading?.tempEdgeC)}
              unit="°C"
              empty={empty || reading?.tempEdgeC == null}
              stale={stale}
            />
          </div>
          <div className="md:col-span-6 xl:col-span-3">
            <KpiCard
              label="Kelembapan Tepi"
              sensor="FC-28 · off-axis"
              icon={<IconDroplet />}
              value={fmt.moisturePct(reading?.moisturePct)}
              unit="%"
              empty={empty || reading?.moisturePct == null}
              stale={stale}
              caption={
                <span className="num">
                  ADC {fmt.adcFc28(reading?.adcFc28)} · {fmt.moisturePct(reading?.moisturePct)}%
                </span>
              }
            />
          </div>
          <div className="md:col-span-6 xl:col-span-3">
            <KpiCard
              label="CSI Spectral Slope"
              sensor="β_CSI · 46 subcarrier aktif"
              icon={<IconSlope />}
              value={fmt.betaCsi(reading?.betaCsi)}
              unit=""
              empty={empty}
              stale={stale}
              caption={
                reading && Number.isFinite(reading.betaCsi)
                  ? reading.betaCsi > 0
                    ? "Positif — inversi slope (indikasi hidrofobik)"
                    : "Negatif — pola hidrofilik"
                  : undefined
              }
            />
          </div>
          <div className="md:col-span-6 xl:col-span-3">
            <KpiCard
              label="Daya Terima RSSI"
              sensor="RSSI + residu dielektrik ΔR"
              icon={<IconSignal />}
              value={fmt.rssiDbm(reading?.rssiDbm)}
              unit="dBm"
              empty={empty}
              stale={stale}
              caption={
                <span>
                  Residu ΔR <span className="num font-semibold text-ink">{fmt.deltaRdb(reading?.deltaRdb)} dB</span>
                </span>
              }
            />
          </div>
        </div>

        {/* Baris 3 — Rekomendasi tindakan */}
        <RecommendationCard peatClass={reading?.peatClass ?? null} items={recItems} />

        {/* Baris 4 — Strip telemetri 3-lapis. Di tablet ke atas menempel di bawah
            viewport agar selalu terlihat tanpa scroll (AGENTS.md §2.1). */}
        <div className="md:sticky md:bottom-4 md:z-10">
          <TelemetryStrip view={telemetry} nodeId={nodeId} />
        </div>

        {/* Baris 5 — Tren 24 jam */}
        <TrendChart history={history} now={now} />
      </main>
    </>
  );
}
