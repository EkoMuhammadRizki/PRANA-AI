import type { NodeOption } from "@/components/shell/TopBar";
import type { NodeInfo } from "./types";

/** Node aktif dari ?node=…, jatuh ke node pertama bila kosong/tidak dikenal. */
export function resolveNode(nodes: NodeInfo[], param: string | string[] | undefined): NodeInfo | null {
  const id = Array.isArray(param) ? param[0] : param;
  return nodes.find((n) => n.id === id) ?? nodes[0] ?? null;
}

export function toOptions(nodes: NodeInfo[]): NodeOption[] {
  return nodes.map((n) => ({ id: n.id, name: n.name, lokasi: n.lokasi }));
}
