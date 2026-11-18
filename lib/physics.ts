import { NULL_ZONE, SUBCARRIER_COUNT } from "./domain";

/**
 * CSI Spectral Slope — Proposal PKM-KC PRANA-AI, persamaan (2):
 *   β_CSI = Σ[(k − k̄)(|H_k| − |H̄|)] / Σ(k − k̄)²,  k ∈ [1..21] ∪ [28..52]
 *
 * Dihitung ulang di web HANYA untuk verifikasi visual oleh analis
 * (garis fit pada grafik spektral). Nilai resmi tetap β_CSI dari Edge-Gateway.
 */
export function spectralFit(amplitudes: number[]): { slope: number; intercept: number; n: number } | null {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let k = 1; k <= SUBCARRIER_COUNT; k++) {
    if (k >= NULL_ZONE[0] && k <= NULL_ZONE[1]) continue;
    const v = amplitudes[k - 1];
    if (v === undefined || !Number.isFinite(v)) continue;
    xs.push(k);
    ys.push(v);
  }
  if (xs.length < 2) return null;
  const n = xs.length;
  const kMean = xs.reduce((a, b) => a + b, 0) / n;
  const hMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - kMean) * (ys[i] - hMean);
    den += (xs[i] - kMean) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  return { slope, intercept: hMean - slope * kMean, n };
}
