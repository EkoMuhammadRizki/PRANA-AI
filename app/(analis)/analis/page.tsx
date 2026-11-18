import { Lapis2Dashboard } from "@/components/lapis2/Lapis2Dashboard";
import { requireAnalis } from "@/lib/auth";
import { isCsvReady } from "@/lib/csv";
import { parseRange } from "@/lib/domain";
import { resolveNode, toOptions } from "@/lib/nodes";
import {
  getBaseline,
  getLatestDiagnostics,
  getLatestReading,
  getLatestSpectrum,
  getRawPackets,
  getReadingHistory,
  listNodes,
  RAW_TABLE_LIMIT,
} from "@/lib/queries";

export const metadata = { title: "Diagnostik Spektral" };
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Lapis 2 — Diagnostik Spektral CSI. Hanya peran Analis. */
export default async function AnalisPage({
  searchParams,
}: {
  searchParams: Promise<{ node?: string | string[]; tnode?: string | string[]; range?: string | string[] }>;
}) {
  // Diperiksa ulang di page (layout tidak selalu dirender ulang saat navigasi client).
  const profile = await requireAnalis();
  const sp = await searchParams;

  const nodes = await listNodes();
  const node = resolveNode(nodes.data, sp.node);
  const range = parseRange(Array.isArray(sp.range) ? sp.range[0] : sp.range);
  const tnodeRaw = Array.isArray(sp.tnode) ? sp.tnode[0] : sp.tnode;
  const tableNode = nodes.data.some((n) => n.id === tnodeRaw) ? (tnodeRaw as string) : null;

  const empty = { data: null, error: false } as const;
  const [reading, spectrum, baseline, diagnostics, history, packets] = await Promise.all([
    node ? getLatestReading(node.id) : empty,
    node ? getLatestSpectrum(node.id) : empty,
    node ? getBaseline(node.id) : empty,
    node ? getLatestDiagnostics(node.id) : empty,
    node ? getReadingHistory(node.id, DAY_MS) : { data: [], error: false },
    getRawPackets({ nodeId: tableNode, range }),
  ]);

  return (
    <Lapis2Dashboard
      key={`${node?.id ?? "none"}|${tableNode ?? "all"}|${range}`}
      profile={{ role: profile.role, fullName: profile.fullName, email: profile.email }}
      nodes={toOptions(nodes.data)}
      node={node}
      initialReading={reading.data}
      initialSpectrum={spectrum.data}
      baseline={baseline.data}
      initialDiagnostics={diagnostics.data}
      initialHistory={history.data}
      initialPackets={packets.data}
      tableNode={tableNode}
      range={range}
      tableLimit={RAW_TABLE_LIMIT}
      csvReady={isCsvReady()}
      initialError={
        nodes.error ||
        reading.error ||
        spectrum.error ||
        baseline.error ||
        diagnostics.error ||
        history.error ||
        packets.error
      }
    />
  );
}
