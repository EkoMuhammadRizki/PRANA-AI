"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EMPTY, fmt, formatClockWIB, formatWIB } from "@/lib/format";
import { breakGaps, DOT_MAX_POINTS } from "@/lib/series";
import { areaGradient, colors, fontMono } from "@/lib/tokens";
import type { Reading } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Tren ringkas 24 jam — satu seri saja (β_CSI), grafik area (DESIGN.md §5.1).
 * Garis 0 = batas inversi tanda (negatif hidrofilik → positif degradasi).
 */
export function TrendChart({ history, now }: { history: Reading[]; now: number }) {
  const from = now - DAY_MS;
  const points = history
    .map((r) => ({ t: Date.parse(r.recordedAt), v: r.betaCsi as number | null }))
    .filter((d) => d.t >= from && Number.isFinite(d.v));
  const data = breakGaps(points, (t) => ({ t, v: null }));

  return (
    <section className="card">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-card-title font-semibold text-ink">Tren β_CSI 24 jam</h2>
        <p className="text-caption text-ink-muted">
          Garis putus-putus merah = ambang inversi (0). Di atas 0 → indikasi degradasi hidrofobik.
        </p>
      </header>
      {data.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-panel bg-surface-muted">
          <span className="num text-kpi font-bold text-ink-disabled">{EMPTY}</span>
          <span className="text-caption text-ink-muted">Menunggu paket</span>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
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
                tick={{ fill: colors.ink.muted, fontSize: 12, fontFamily: fontMono }}
                axisLine={{ stroke: colors.line }}
                tickLine={false}
                minTickGap={32}
              />
              <YAxis
                dataKey="v"
                tickFormatter={(v: number) => fmt.betaCsi(v)}
                tick={{ fill: colors.ink.muted, fontSize: 12, fontFamily: fontMono }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <ReferenceLine y={0} stroke={colors.series.threshold} strokeDasharray="4 4" />
              <Tooltip
                labelFormatter={(t) => formatWIB(new Date(Number(t)).toISOString())}
                formatter={(v) => [fmt.betaCsi(Number(v)), "β_CSI"]}
                contentStyle={{ borderRadius: 12, border: `1px solid ${colors.line}`, fontSize: 12 }}
              />
              <Area
                type="linear"
                dataKey="v"
                stroke={colors.series.primary}
                strokeWidth={2}
                fill="url(#trendFill)"
                isAnimationActive={false}
                dot={points.length <= DOT_MAX_POINTS ? { r: 2.5, fill: colors.series.primary, strokeWidth: 0 } : false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
