import { Lapis1Dashboard } from "@/components/lapis1/Lapis1Dashboard";
import { requireProfile } from "@/lib/auth";
import { resolveNode, toOptions } from "@/lib/nodes";
import { getLatestAlert, getLatestReading, getReadingHistory, getRecommendations, listNodes } from "@/lib/queries";

export const metadata = { title: "Status Operasional" };
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Lapis 1 — Status Operasional. Dapat diakses peran User & Analis. */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ node?: string | string[] }>;
}) {
  const profile = await requireProfile();
  const sp = await searchParams;

  const nodes = await listNodes();
  const node = resolveNode(nodes.data, sp.node);

  const [reading, history, alert, recs] = node
    ? await Promise.all([
        getLatestReading(node.id),
        getReadingHistory(node.id, DAY_MS),
        getLatestAlert(node.id),
        getRecommendations(),
      ])
    : [
        { data: null, error: false },
        { data: [], error: false },
        { data: null, error: false },
        await getRecommendations(),
      ];

  return (
    <Lapis1Dashboard
      key={node?.id ?? "none"}
      profile={{ role: profile.role, fullName: profile.fullName, email: profile.email }}
      nodes={toOptions(nodes.data)}
      node={node}
      initialReading={reading.data}
      initialHistory={history.data}
      initialAlert={alert.data}
      recommendations={recs.data}
      initialError={nodes.error || reading.error || history.error || alert.error || recs.error}
    />
  );
}
