"use client";

import { useEffect, type ReactNode } from "react";
import { IconCellular, IconStorage, IconWifi } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";
import { fmt, formatAge } from "@/lib/format";
import {
  BACKLOG_ANOMALY_NOTE,
  DEGRADED_NOTE,
  type LayerState,
  type LayerView,
  type TelemetryView,
} from "@/lib/telemetry";

/** Warna dot — DESIGN.md §3 "Indikator Telemetri 3-Lapis". */
const DOT: Record<LayerState, string> = {
  ok: "bg-live-dot",
  idle: "bg-offline-dot",
  unknown: "bg-offline-dot",
  backfill: "bg-backfill-dot",
  down: "bg-danger",
};

const STATE_LABEL: Record<LayerState, string> = {
  ok: "sehat",
  idle: "tidak aktif",
  unknown: "belum ada data",
  backfill: "antrean backfill",
  down: "tidak terjangkau",
};

const ICON: Record<LayerView["key"], ReactNode> = {
  cellular: <IconCellular size={16} />,
  buffer: <IconStorage size={16} />,
  apsta: <IconWifi size={16} />,
};

function Dot({ state }: { state: LayerState }) {
  return (
    <span
      className={cx("inline-block h-2.5 w-2.5 shrink-0 rounded-full", DOT[state])}
      role="img"
      aria-label={`Status: ${STATE_LABEL[state]}`}
    />
  );
}

/** Mencatat anomali antrean ke log (AGENTS.md §2.1: jangan disembunyikan). */
function useBacklogLog(view: TelemetryView, nodeId: string | null) {
  useEffect(() => {
    if (view.backlogAnomaly) {
      console.warn(`[PRANA-AI] ${nodeId ?? "node"}: ${BACKLOG_ANOMALY_NOTE}`);
    }
  }, [view.backlogAnomaly, nodeId]);
}

/** Catatan informatif (bukan alarm) — nada netral, ikon tidak merah. */
function Notes({ view }: { view: TelemetryView }) {
  if (!view.degraded && !view.backlogAnomaly && !view.unreachable) return null;
  return (
    <div className="space-y-1">
      {view.unreachable && (
        <p className="text-caption font-medium text-ink">
          Ketiga lapis telemetri tidak menjawab — node tidak terjangkau dari cloud.
        </p>
      )}
      {view.degraded && <p className="text-caption font-medium text-ink">{DEGRADED_NOTE}</p>}
      {view.backlogAnomaly && <p className="text-caption font-medium text-k2-text">{BACKLOG_ANOMALY_NOTE}</p>}
    </div>
  );
}

// ── Lapis 1: strip ringkas (maks 96px, selalu terlihat di tablet) ─
export function TelemetryStrip({ view, nodeId }: { view: TelemetryView; nodeId: string | null }) {
  useBacklogLog(view, nodeId);
  return (
    <section
      aria-label="Status telemetri hibrida 3-lapis"
      className="rounded-card border border-line bg-surface px-4 py-3 shadow-card md:max-h-telemetry-strip"
    >
      <ul className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-3">
        {view.layers.map((l) => (
          <li key={l.key} className="min-w-0 text-caption leading-snug">
            <p className="flex items-center gap-2">
              <Dot state={l.state} />
              <span className="truncate font-semibold text-ink">{l.title}</span>
            </p>
            <p className="truncate pl-[18px]" title={[l.status, ...l.details].join(" · ")}>
              <span className="font-medium text-ink">{l.status}</span>
              {l.details.length > 0 && <span className="text-ink-muted"> · {l.details.join(" · ")}</span>}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-1">
        <Notes view={view} />
      </div>
    </section>
  );
}

// ── Lapis 2: panel penuh ─────────────────────────────────────────
export function TelemetryPanel({
  view,
  nodeId,
  linkRecordedAt,
  batteryV,
  now,
  footer,
}: {
  view: TelemetryView;
  nodeId: string | null;
  linkRecordedAt: string | null;
  batteryV: number | null;
  now: number;
  footer?: ReactNode;
}) {
  useBacklogLog(view, nodeId);
  return (
    <section className="card flex h-full flex-col" aria-label="Status telemetri hibrida 3-lapis">
      <header className="mb-4">
        <h2 className="text-card-title font-semibold text-ink">Telemetri Hibrida 3-Lapis</h2>
        <p className="text-caption text-ink-muted">
          Status dilaporkan {formatAge(linkRecordedAt, now)}
          {batteryV !== null && (
            <>
              {" · "}baterai <span className="num">{fmt.batteryV(batteryV)} V</span>
            </>
          )}
        </p>
      </header>
      <ol className="flex flex-col divide-y divide-line">
        {view.layers.map((l, i) => (
          <li key={l.key} className="flex gap-3 py-3 first:pt-0">
            <span className="mt-1.5">
              <Dot state={l.state} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-ink-muted">{ICON[l.key]}</span>
                <span className="text-caption font-medium text-ink-muted">Lapis {i + 1}</span>
              </div>
              <p className="font-semibold text-ink">{l.title}</p>
              <p className="text-body text-ink">{l.status}</p>
              {l.details.length > 0 && <p className="text-caption text-ink-muted">{l.details.join(" · ")}</p>}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-2">
        <Notes view={view} />
      </div>
      {footer && <div className="mt-auto pt-4">{footer}</div>}
    </section>
  );
}
