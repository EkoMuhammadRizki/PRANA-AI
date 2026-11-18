"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IconSpectrum } from "@/components/ui/icons";
import { cx, StaleBadge } from "@/components/ui/primitives";
import { LOWER_BAND, NULL_ZONE, SUBCARRIER_COUNT, UPPER_BAND } from "@/lib/domain";
import { spectralFit } from "@/lib/physics";
import { EMPTY, fmt, formatAge, formatWIB } from "@/lib/format";
import { colors, fontMono, nullZoneFill } from "@/lib/tokens";
import type { Spectrum, SpectrumBaseline } from "@/lib/types";

const inNull = (sc: number) => sc >= NULL_ZONE[0] && sc <= NULL_ZONE[1];

function at(arr: number[] | undefined, sc: number): number | null {
  const v = arr?.[sc - 1];
  return v !== undefined && Number.isFinite(v) ? v : null;
}

const BAND_TICKS = [
  (LOWER_BAND[0] + LOWER_BAND[1]) / 2,
  (NULL_ZONE[0] + NULL_ZONE[1]) / 2,
  (UPPER_BAND[0] + UPPER_BAND[1]) / 2,
];
const BAND_LABEL: Record<number, string> = {
  [BAND_TICKS[0]]: `Pita Bawah (${LOWER_BAND[0]}–${LOWER_BAND[1]})`,
  [BAND_TICKS[1]]: "",
  [BAND_TICKS[2]]: `Pita Atas (${UPPER_BAND[0]}–${UPPER_BAND[1]})`,
};

const axisTick = { fill: colors.spectral.axis, fontSize: 11, fontFamily: fontMono };

/**
 * Kurva Amplitudo 52-Subcarrier L-LTF — DESIGN.md §3 & §5.2.
 * Garis fit = regresi linier 46 subcarrier aktif (persamaan 2 proposal) untuk
 * membandingkan β hasil hitung web dengan β_CSI yang dilaporkan Edge-Gateway.
 */
export function SpectrumChart({
  spectrum,
  baseline,
  deviceBeta,
  stale,
  now,
}: {
  spectrum: Spectrum | null;
  baseline: SpectrumBaseline | null;
  /** β_CSI dari perangkat untuk reading yang sama dengan spektrum ini (bila ada). */
  deviceBeta: number | null;
  stale: boolean;
  now: number;
}) {
  const fit = spectrum ? spectralFit(spectrum.amplitudes) : null;
  // Nilai mentah ditampilkan apa adanya, termasuk zona null (≈0) — sesuai Figure 2 tim.
  const data = Array.from({ length: SUBCARRIER_COUNT }, (_, i) => {
    const sc = i + 1;
    return {
      sc,
      amp: at(spectrum?.amplitudes, sc),
      base: baseline ? at(baseline.amplitudes, sc) : null,
      fit: fit ? fit.intercept + fit.slope * sc : null,
    };
  });

  const channel = spectrum?.channel ?? 6;
  const freq = spectrum?.freqMhz ?? 2437;

  return (
    <section className="card h-full">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-card-title font-semibold text-ink">
            <span className="text-ink-muted">
              <IconSpectrum size={18} />
            </span>
            Kurva Amplitudo 52-Subcarrier L-LTF
          </h2>
          <p className="text-caption text-ink-muted">
            Kanal <span className="num">{channel}</span> — <span className="num">{fmt.int(freq)}</span> MHz ·{" "}
            {spectrum ? `${formatWIB(spectrum.recordedAt)} (${formatAge(spectrum.recordedAt, now)})` : "Menunggu paket"}
          </p>
        </div>
        <div className="flex items-center gap-4 text-caption text-ink-muted">
          {spectrum && stale && <StaleBadge />}
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 bg-series-primary" /> Amplitudo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-5 border-t-2 border-dashed border-series-baseline" />
            {baseline ? "Baseline kalibrasi" : "Baseline belum ditetapkan"}
          </span>
          {fit && (
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-5 border-t-2 border-dotted border-series-history" /> Fit linier
            </span>
          )}
        </div>
      </header>

      {fit && (
        <dl className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-caption">
          <div className="flex gap-2">
            <dt className="text-ink-muted">β_CSI perangkat</dt>
            <dd className="num font-semibold text-ink">{fmt.betaCsi(deviceBeta)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink-muted">β fit web ({fit.n} subcarrier aktif)</dt>
            <dd className="num font-semibold text-ink">{fmt.betaCsi(fit.slope)}</dd>
          </div>
        </dl>
      )}

      <div className={cx("rounded-panel bg-spectral-bg p-3", stale && spectrum && "stale")}>
        {spectrum ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 16, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid stroke={colors.spectral.grid} />
                <ReferenceArea
                  xAxisId="sc"
                  x1={NULL_ZONE[0] - 0.5}
                  x2={NULL_ZONE[1] + 0.5}
                  fill={nullZoneFill}
                  fillOpacity={1}
                  stroke="none"
                  label={{
                    value: `Null (${NULL_ZONE[0]}–${NULL_ZONE[1]})`,
                    position: "insideTop",
                    fill: colors.spectral.axis,
                    fontSize: 11,
                  }}
                />
                <XAxis
                  xAxisId="band"
                  dataKey="sc"
                  type="number"
                  domain={[0.5, SUBCARRIER_COUNT + 0.5]}
                  ticks={BAND_TICKS}
                  tickFormatter={(v: number) => BAND_LABEL[v] ?? ""}
                  tick={{ ...axisTick, fontFamily: "var(--font-inter)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  height={24}
                />
                <XAxis
                  xAxisId="sc"
                  dataKey="sc"
                  type="number"
                  domain={[0.5, SUBCARRIER_COUNT + 0.5]}
                  ticks={[1, 6, 11, 16, 21, 28, 34, 40, 46, 52]}
                  tick={axisTick}
                  axisLine={{ stroke: colors.spectral.grid }}
                  tickLine={{ stroke: colors.spectral.grid }}
                />
                <YAxis
                  tick={axisTick}
                  tickFormatter={(v: number) => fmt.amplitude(v)}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  cursor={{ stroke: colors.spectral.axis, strokeOpacity: 0.3 }}
                  contentStyle={{
                    background: colors.spectral.bg,
                    border: `1px solid ${colors.spectral.grid}`,
                    borderRadius: 12,
                    color: colors.spectral.axis,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: colors.spectral.axis }}
                  labelFormatter={(sc) =>
                    inNull(Number(sc)) ? `Subcarrier ${sc} — null (tidak dipakai)` : `Subcarrier ${sc}`
                  }
                  formatter={(v, name) => [
                    v == null ? EMPTY : fmt.amplitude(Number(v)),
                    name === "amp" ? "Amplitudo |H_k|" : name === "fit" ? "Fit linier" : "Baseline",
                  ]}
                />
                {baseline && (
                  <Line
                    xAxisId="sc"
                    dataKey="base"
                    stroke={colors.series.baseline}
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                )}
                {fit && (
                  <Line
                    xAxisId="sc"
                    dataKey="fit"
                    type="linear"
                    stroke={colors.series.history}
                    strokeWidth={1.5}
                    strokeDasharray="2 3"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                )}
                <Line
                  xAxisId="sc"
                  dataKey="amp"
                  type="linear"
                  stroke={colors.series.primary}
                  strokeWidth={2}
                  dot={{ r: 1.5, fill: colors.series.primary, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-80 flex-col items-center justify-center">
            <span className="num text-kpi font-bold text-ink-muted">{EMPTY}</span>
            <span className="text-caption text-spectral-axis">Menunggu paket</span>
          </div>
        )}
      </div>
    </section>
  );
}
