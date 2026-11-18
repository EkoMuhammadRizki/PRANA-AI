"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IconSlope } from "@/components/ui/icons";
import { Card } from "@/components/ui/primitives";
import { EMPTY, fmt, formatClockWIB, formatWIB } from "@/lib/format";
import { breakGaps, DOT_MAX_POINTS } from "@/lib/series";
import { areaGradient, colors, fontMono } from "@/lib/tokens";
import type { Reading } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const tick = { fill: colors.ink.muted, fontSize: 12, fontFamily: fontMono };

/** Riwayat β_CSI dan ΔR terhadap waktu (24 jam) — DESIGN.md §5.2. */
export function SlopeHistoryChart({ history, now }: { history: Reading[]; now: number }) {
  const from = now - DAY_MS;
  type P = { t: number; beta: number | null; dr: number | null };
  const points: P[] = history
    .map((r) => ({
      t: Date.parse(r.recordedAt),
      beta: Number.isFinite(r.betaCsi) ? r.betaCsi : null,
      dr: Number.isFinite(r.deltaRdb) ? r.deltaRdb : null,
    }))
    .filter((p) => p.t >= from);
  const data = breakGaps<P>(points, (t) => ({ t, beta: null, dr: null }));

  return (
    <Card title="Riwayat β_CSI dan ΔR · 24 jam" icon={<IconSlope size={18} />} className="h-full">
      <div className="mb-3 flex flex-wrap gap-4 text-caption text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-series-primary" /> β_CSI (sumbu kiri)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-series-history" /> ΔR dB (sumbu kanan)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-5 border-t-2 border-dashed border-series-threshold" /> Ambang inversi β = 0
        </span>
      </div>
      {points.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-panel bg-surface-muted">
          <span className="num text-kpi font-bold text-ink-disabled">{EMPTY}</span>
          <span className="text-caption text-ink-muted">Menunggu paket</span>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="betaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={areaGradient.from} />
                  <stop offset="100%" stopColor={areaGradient.to} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={colors.line} vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={[from, now]}
                tickFormatter={formatClockWIB}
                tick={tick}
                axisLine={{ stroke: colors.line }}
                tickLine={false}
                minTickGap={32}
              />
              <YAxis
                yAxisId="beta"
                tickFormatter={(v: number) => fmt.betaCsi(v)}
                tick={tick}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <YAxis
                yAxisId="dr"
                orientation="right"
                tickFormatter={(v: number) => fmt.deltaRdb(v)}
                tick={tick}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <ReferenceLine yAxisId="beta" y={0} stroke={colors.series.threshold} strokeDasharray="4 4" />
              <Tooltip
                labelFormatter={(t) => formatWIB(new Date(Number(t)).toISOString())}
                formatter={(v, name) =>
                  name === "beta"
                    ? [fmt.betaCsi(v == null ? null : Number(v)), "β_CSI"]
                    : [`${fmt.deltaRdb(v == null ? null : Number(v))} dB`, "ΔR"]
                }
                contentStyle={{ borderRadius: 12, border: `1px solid ${colors.line}`, fontSize: 12 }}
              />
              <Area
                yAxisId="beta"
                type="linear"
                dataKey="beta"
                stroke={colors.series.primary}
                strokeWidth={2}
                fill="url(#betaFill)"
                dot={points.length <= DOT_MAX_POINTS ? { r: 2.5, fill: colors.series.primary, strokeWidth: 0 } : false}
                isAnimationActive={false}
                connectNulls={false}
              />
              <Line
                yAxisId="dr"
                type="linear"
                dataKey="dr"
                stroke={colors.series.history}
                strokeWidth={1.5}
                dot={points.length <= DOT_MAX_POINTS ? { r: 2, fill: colors.series.history, strokeWidth: 0 } : false}
                isAnimationActive={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
