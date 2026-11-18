"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { NodeOption } from "@/components/shell/TopBar";
import { ClassBadge } from "@/components/ui/primitives";
import { RANGES, type RangeKey } from "@/lib/domain";
import { EMPTY, fmt, formatWIB } from "@/lib/format";
import type { RawPacket } from "@/lib/types";

/** Tabel paket mentah terbaru — DESIGN.md §3 (Tabel) & §5.2 baris 3. */
export function RawPacketTable({
  rows,
  nodes,
  tableNode,
  range,
  limit,
}: {
  rows: RawPacket[];
  nodes: NodeOption[];
  tableNode: string | null;
  range: RangeKey;
  limit: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const th = "px-3 py-2 text-caption font-medium uppercase tracking-label text-ink-muted whitespace-nowrap";
  const tdNum = "num px-3 py-2 text-right text-body whitespace-nowrap";

  return (
    <section className="card">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-card-title font-semibold text-ink">Paket Mentah Terbaru</h2>
          <p className="text-caption text-ink-muted">
            Diurutkan menurut waktu perangkat (recorded_at) · maks {limit} baris
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2">
            <span className="label">Rentang</span>
            <select
              value={range}
              onChange={(e) => setParam("range", e.target.value)}
              className="rounded-btn border border-line bg-surface px-3 py-2 text-body focus:border-brand focus:outline-none"
            >
              {(Object.keys(RANGES) as RangeKey[]).map((k) => (
                <option key={k} value={k}>
                  {RANGES[k].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="label">Node</span>
            <select
              value={tableNode ?? ""}
              onChange={(e) => setParam("tnode", e.target.value || null)}
              className="rounded-btn border border-line bg-surface px-3 py-2 text-body focus:border-brand focus:outline-none"
            >
              <option value="">Semua node</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.id}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="-mx-card-pad overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse">
          <thead className="bg-surface-muted">
            <tr>
              <th className={`${th} text-left`}>Waktu (WIB)</th>
              <th className={`${th} text-left`}>Node</th>
              <th className={`${th} text-right`}>RSSI <span className="normal-case">(dBm)</span></th>
              <th className={`${th} text-right`}>PDR (%)</th>
              <th className={`${th} text-right`}><span className="normal-case">β_CSI</span></th>
              <th className={`${th} text-right`}><span className="normal-case">ΔR (dB)</span></th>
              <th className={`${th} text-right`}>ADC FC-28</th>
              <th className={`${th} text-right`}>Suhu <span className="normal-case">(°C)</span></th>
              <th className={`${th} text-left`}>Kelas prediksi</th>
              <th className={`${th} text-right`}>Confidence (%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-body text-ink-muted">
                  <span className="num mr-2 text-ink-disabled">{EMPTY}</span>Menunggu paket
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-line hover:bg-brand-tint">
                  <td className="num whitespace-nowrap px-3 py-2 text-body">
                    {formatWIB(r.recordedAt)}
                    {r.source === "backfill" && (
                      <span className="ml-2 font-sans text-caption text-ink-muted" title="Kiriman susulan store-and-forward">
                        backfill
                      </span>
                    )}
                  </td>
                  <td className="num whitespace-nowrap px-3 py-2 text-body">{r.nodeId}</td>
                  <td className={tdNum}>{fmt.rssiDbm(r.rssiDbm)}</td>
                  <td className={tdNum}>{fmt.pdrPct(r.pdrPct)}</td>
                  <td className={tdNum}>{fmt.betaCsi(r.betaCsi)}</td>
                  <td className={tdNum}>{fmt.deltaRdb(r.deltaRdb)}</td>
                  <td className={tdNum}>{fmt.adcFc28(r.adcFc28)}</td>
                  <td className={tdNum}>{fmt.tempEdgeC(r.tempEdgeC)}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <ClassBadge peatClass={r.peatClass} />
                  </td>
                  <td className={tdNum}>{fmt.confidence(r.confidence)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
