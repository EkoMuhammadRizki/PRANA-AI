/**
 * Deteksi antrean store-and-forward yang terus naik tanpa pernah turun.
 * Target sistem 0% data loss → pertumbuhan monoton adalah anomali (AGENTS.md §2.1).
 */
export const GROWTH_STREAK_THRESHOLD = 5;

interface State {
  last: number;
  streak: number;
  flagged: boolean;
}

export class BacklogTracker {
  private readonly nodes = new Map<string, State>();

  constructor(private readonly threshold = GROWTH_STREAK_THRESHOLD) {}

  /**
   * Catat jumlah baris antrean terbaru. Mengembalikan true bila antrean dianggap
   * terus naik (≥ `threshold` kenaikan berturut-turut tanpa satu pun penurunan).
   */
  observe(nodeId: string, rows: number): { growing: boolean; changed: boolean } {
    const s = this.nodes.get(nodeId);
    if (!s) {
      this.nodes.set(nodeId, { last: rows, streak: 0, flagged: false });
      return { growing: false, changed: false };
    }
    if (rows < s.last || rows === 0) s.streak = 0;
    else if (rows > s.last) s.streak += 1;
    s.last = rows;

    const growing = s.streak >= this.threshold;
    const changed = growing !== s.flagged;
    s.flagged = growing;
    return { growing, changed };
  }

  isGrowing(nodeId: string): boolean {
    return this.nodes.get(nodeId)?.flagged ?? false;
  }
}
