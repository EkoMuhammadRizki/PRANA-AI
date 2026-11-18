import { IconDownload } from "@/components/ui/icons";
import { Button } from "@/components/ui/primitives";
import type { RangeKey } from "@/lib/domain";

/**
 * Tombol "Unduh Rekapan Mentah (.CSV 17 Kolom)" — AGENTS.md §7.
 * Dinonaktifkan sampai spesifikasi 17 kolom firmware tersedia (lib/csv.ts).
 */
export function CsvDownloadButton({
  ready,
  nodeId,
  range,
}: {
  ready: boolean;
  nodeId: string | null;
  range: RangeKey;
}) {
  const label = (
    <>
      <IconDownload size={18} />
      Unduh Rekapan Mentah (.CSV 17 Kolom)
    </>
  );

  if (!ready) {
    return (
      <div>
        <Button type="button" disabled className="w-full">
          {label}
        </Button>
        <p className="mt-2 text-caption text-ink-muted">
          Menunggu spesifikasi 17 kolom dari format store-and-forward perangkat.
        </p>
      </div>
    );
  }

  const qs = new URLSearchParams({ range });
  if (nodeId) qs.set("node", nodeId);
  return (
    <a
      href={`/api/export/csv?${qs.toString()}`}
      className="inline-flex w-full items-center justify-center gap-2 rounded-btn bg-brand-gradient px-5 py-3 text-body font-semibold text-white hover:bg-none hover:bg-brand-deep active:bg-brand-deep"
    >
      {label}
    </a>
  );
}
