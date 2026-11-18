import { IconAntenna } from "@/components/ui/icons";
import { Card, cx, StaleBadge } from "@/components/ui/primitives";
import { EMPTY, fmt } from "@/lib/format";
import type { Diagnostics, Reading } from "@/lib/types";

/** Kualitas Tautan RF — RSSI mean ± SD, PDR %, paket UDP (DESIGN.md §5.2). */
export function RfQualityCard({
  reading,
  diagnostics,
  stale,
}: {
  reading: Reading | null;
  diagnostics: Diagnostics | null;
  stale: boolean;
}) {
  const sameReading = diagnostics && reading && diagnostics.readingId === reading.id;
  const d = sameReading ? diagnostics : null;

  return (
    <Card
      title="Kualitas Tautan RF"
      icon={<IconAntenna size={18} />}
      className="h-full"
      action={reading && stale ? <StaleBadge /> : undefined}
    >
      <dl className={cx("grid grid-cols-1 gap-6 sm:grid-cols-3", stale && "stale")}>
        <div>
          <dt className="label">RSSI mean ± SD</dt>
          <dd className="mt-2 flex flex-wrap items-baseline gap-1">
            <span className="num text-kpi font-bold text-ink">{fmt.rssiDbm(reading?.rssiDbm)}</span>
            <span className="num text-card-title text-ink-muted">± {fmt.rssiSd(d?.rssiSd)}</span>
            <span className="text-card-title text-ink-muted">dBm</span>
          </dd>
        </div>
        <div>
          <dt className="label">Packet Delivery Ratio</dt>
          <dd className="mt-2 flex items-baseline gap-1">
            <span className="num text-kpi font-bold text-ink">{fmt.pdrPct(d?.pdrPct)}</span>
            <span className="text-card-title text-ink-muted">%</span>
          </dd>
        </div>
        <div>
          <dt className="label">Paket UDP diterima / terkirim</dt>
          <dd className="mt-2 flex items-baseline gap-1">
            <span className="num text-kpi font-bold text-ink">{fmt.int(d?.packetsRx)}</span>
            <span className="num text-card-title text-ink-muted">/ {fmt.int(d?.packetsTx)}</span>
          </dd>
          {d && d.packetsTx == null && (
            <dd className="mt-1 text-caption text-ink-muted">Jumlah paket tidak dilaporkan perangkat</dd>
          )}
        </div>
      </dl>
      {!reading && <p className="mt-3 text-caption text-ink-muted">{EMPTY} Menunggu paket</p>}
    </Card>
  );
}
