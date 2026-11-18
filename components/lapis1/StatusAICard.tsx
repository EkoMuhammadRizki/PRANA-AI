import { IconAntenna, IconClock } from "@/components/ui/icons";
import { cx, SourceBadge, StaleBadge } from "@/components/ui/primitives";
import { CLASS_META } from "@/lib/domain";
import { EMPTY, fmt, formatAge, formatWIB } from "@/lib/format";
import type { NodeInfo, Reading } from "@/lib/types";

/**
 * Kartu Status AI — hero Lapis 1 (DESIGN.md §3).
 * Ukuran TETAP apa pun kelasnya; hanya warna yang berubah.
 */
export function StatusAICard({
  reading,
  node,
  stale,
  now,
}: {
  reading: Reading | null;
  node: NodeInfo | null;
  stale: boolean;
  now: number;
}) {
  const meta = reading ? CLASS_META[reading.peatClass] : null;

  return (
    <section
      aria-live="polite"
      aria-label="Status AI"
      className={cx(
        "rounded-card border border-l-[6px] p-6 shadow-card md:min-h-[200px]",
        meta ? cx(meta.bg, meta.border, meta.borderLeft) : "border-line border-l-line bg-surface",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="label">Status AI · TinyML INT8</span>
        {reading && (
          <span className={cx("num rounded-full border px-3 py-1 text-caption font-semibold", meta!.text, meta!.border)}>
            {reading.peatClass}
          </span>
        )}
        {reading && stale && <StaleBadge />}
        {reading?.source === "backfill" && <SourceBadge />}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Kelas aktif */}
        <div className={cx("xl:col-span-6", stale && "stale")}>
          {reading && meta ? (
            <>
              <h1 className={cx("text-class-title font-bold", meta.text)}>{meta.label}</h1>
              <p className="mt-1 text-body text-ink">{meta.meaning}</p>
            </>
          ) : (
            <>
              <h1 className="text-class-title font-bold text-ink-disabled">{EMPTY}</h1>
              <p className="mt-1 text-body text-ink-muted">Menunggu paket</p>
            </>
          )}
        </div>

        {/* Metrik inferensi & lokasi */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 xl:col-span-6 xl:grid-cols-2">
          <Metric
            label="Kepercayaan model"
            value={fmt.confidence(reading?.confidence)}
            unit="%"
            dim={stale}
          />
          <Metric label="Latensi inferensi" value={fmt.latencyMs(reading?.latencyMs)} unit="ms" dim={stale} />
          <div>
            <dt className="label flex items-center gap-1">
              <IconAntenna size={14} /> Lokasi node
            </dt>
            <dd className="mt-1 text-body font-semibold text-ink">{node?.lokasi ?? node?.id ?? EMPTY}</dd>
            <dd className="text-caption text-ink-muted">
              Kedalaman antena{" "}
              <span className="num">{node?.depthCm != null ? `${fmt.int(node.depthCm)} cm` : EMPTY}</span>
            </dd>
          </div>
          <div>
            <dt className="label flex items-center gap-1">
              <IconClock size={14} /> Paket terakhir
            </dt>
            <dd className="num mt-1 text-body font-semibold text-ink">{formatAge(reading?.recordedAt, now)}</dd>
            <dd className="text-caption text-ink-muted">{formatWIB(reading?.recordedAt)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function Metric({ label, value, unit, dim }: { label: string; value: string; unit: string; dim: boolean }) {
  return (
    <div className={cx(dim && "stale")}>
      <dt className="label">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-1">
        <span className="num text-[24px] font-bold text-ink">{value}</span>
        <span className="text-body text-ink-muted">{unit}</span>
      </dd>
    </div>
  );
}
