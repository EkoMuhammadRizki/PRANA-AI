import { IconClipboard } from "@/components/ui/icons";
import { ClassBadge } from "@/components/ui/primitives";
import { EMPTY } from "@/lib/format";
import type { PeatClass } from "@/lib/types";

/** Kartu Rekomendasi Tindakan — DESIGN.md §3 (maks 4 butir, kalimat imperatif). */
export function RecommendationCard({ peatClass, items }: { peatClass: PeatClass | null; items: string[] }) {
  return (
    <section className="rounded-card border border-l-4 border-k2-border bg-k2-bg p-card-pad shadow-card">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-card-title font-semibold text-ink">
          <IconClipboard size={18} />
          Rekomendasi Tindakan Petugas Patroli
        </h2>
        {peatClass && <ClassBadge peatClass={peatClass} />}
      </header>
      {items.length === 0 ? (
        <p className="text-body text-ink-muted">
          <span className="num mr-2 text-ink-disabled">{EMPTY}</span>Menunggu paket
        </p>
      ) : (
        <ul className="grid gap-x-8 gap-y-1.5 md:grid-cols-2">
          {items.slice(0, 4).map((t) => (
            <li key={t} className="flex gap-2 text-body font-medium text-ink">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-k2-text" />
              {t}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
