/**
 * Penggabung pesan per (node_id, seq).
 *
 * Kontrak §4.2 mengirim payload lengkap dalam satu pesan, tetapi topik §4.1
 * memisahkan telemetry / inference / spectrum. Bridge menerima keduanya:
 *  - Payload lengkap + spectrum → langsung di-ingest.
 *  - Payload lengkap tanpa spectrum → ditunggu `windowMs` agar spectrum sempat
 *    bergabung; setelah itu di-ingest tanpa spectrum.
 *  - Potongan yang tidak pernah lengkap → dibuang dengan log (tidak ditebak).
 */
import { readingSchema, type ReadingPayload } from "./schema.js";

type Part = Record<string, unknown> & { node_id: string; seq: number };

interface Pending {
  data: Record<string, unknown>;
  timer: NodeJS.Timeout;
}

export class MessageMerger {
  private readonly pending = new Map<string, Pending>();

  constructor(
    private readonly windowMs: number,
    private readonly onComplete: (payload: ReadingPayload) => Promise<void>,
    private readonly onExpired: (key: string, data: Record<string, unknown>, reason: string) => void,
  ) {}

  static key(nodeId: string, seq: number): string {
    return `${nodeId}#${seq}`;
  }

  has(nodeId: string, seq: number): boolean {
    return this.pending.has(MessageMerger.key(nodeId, seq));
  }

  async add(part: Part): Promise<void> {
    const key = MessageMerger.key(part.node_id, part.seq);
    const existing = this.pending.get(key);
    const data = { ...(existing?.data ?? {}), ...part };

    const parsed = readingSchema.safeParse(data);
    if (parsed.success && parsed.data.spectrum) {
      if (existing) clearTimeout(existing.timer);
      this.pending.delete(key);
      await this.onComplete(parsed.data);
      return;
    }

    if (existing) {
      existing.data = data;
      return; // jendela waktu dihitung dari potongan pertama
    }

    const timer = setTimeout(() => void this.flush(key), this.windowMs);
    this.pending.set(key, { data, timer });
  }

  private async flush(key: string): Promise<void> {
    const entry = this.pending.get(key);
    if (!entry) return;
    this.pending.delete(key);
    const parsed = readingSchema.safeParse(entry.data);
    if (parsed.success) {
      await this.onComplete(parsed.data);
    } else {
      this.onExpired(key, entry.data, parsed.error.issues.map((i) => i.path.join(".")).join(", "));
    }
  }

  /** Dipanggil saat shutdown: tuntaskan semua yang tertunda. */
  async drain(): Promise<void> {
    const keys = [...this.pending.keys()];
    for (const k of keys) {
      clearTimeout(this.pending.get(k)!.timer);
      await this.flush(k);
    }
  }

  get size(): number {
    return this.pending.size;
  }
}
