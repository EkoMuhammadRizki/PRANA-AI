/**
 * Menyisipkan titik null pada celah waktu agar grafik TIDAK menyambung garis
 * melewati periode tanpa paket. Menyambung = interpolasi visual, dilarang
 * (AGENTS.md §8: jangan mengisi kekosongan data dengan nilai dugaan).
 */
// Periode adaptive burst firmware: 15 mnt (Kelas 1), 3 mnt (Kelas 2), 1 mnt (Kelas 3).
// Celah dianggap "data hilang" bila > ~2 siklus Kelas 1 terlewat.
export const GAP_BREAK_MS = 35 * 60 * 1000;

/** Titik digambar sebagai dot bila datanya jarang, agar titik terisolasi tetap terlihat. */
export const DOT_MAX_POINTS = 150;

export function breakGaps<T extends { t: number }>(
  points: T[],
  makeGap: (t: number) => T,
  maxGapMs = GAP_BREAK_MS,
): T[] {
  const out: T[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i > 0 && points[i].t - points[i - 1].t > maxGapMs) {
      out.push(makeGap(points[i - 1].t + 1));
    }
    out.push(points[i]);
  }
  return out;
}
