import type { ReactNode } from "react";
import { cx, StaleBadge, WaitingValue } from "@/components/ui/primitives";

/** Kartu KPI — DESIGN.md §3. */
export function KpiCard({
  label,
  sensor,
  icon,
  value,
  unit,
  caption,
  empty,
  stale,
}: {
  label: string;
  sensor: string;
  icon: ReactNode;
  value: string;
  unit: string;
  caption?: ReactNode;
  empty: boolean;
  stale: boolean;
}) {
  return (
    <section className="card flex h-full flex-col">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="label">{label}</h3>
          <p className="text-caption text-ink-muted">{sensor}</p>
        </div>
        <span className="text-ink-muted">{icon}</span>
      </header>
      {empty ? (
        <WaitingValue className="mt-4" />
      ) : (
        <div className={cx("mt-4", stale && "stale")}>
          <p className="flex items-baseline gap-1.5">
            <span className="num text-kpi font-bold text-ink">{value}</span>
            {unit && <span className="text-card-title text-ink-muted">{unit}</span>}
          </p>
          {caption && <div className="mt-1 text-caption text-ink-muted">{caption}</div>}
        </div>
      )}
      {!empty && stale && (
        <div className="mt-auto pt-3">
          <StaleBadge />
        </div>
      )}
    </section>
  );
}
