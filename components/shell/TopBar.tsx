"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cx } from "@/components/ui/primitives";
import type { UserRole } from "@/lib/types";

export interface NodeOption {
  id: string;
  name: string;
  lokasi: string | null;
}

interface TopBarProps {
  nodes: NodeOption[];
  nodeId: string | null;
  role: UserRole;
  displayName: string;
  layer: 1 | 2;
  live: boolean;
}

/** Top bar 64px — DESIGN.md §5. */
export function TopBar({ nodes, nodeId, role, displayName, layer, live }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <div className="mx-auto flex h-topbar max-w-[1440px] items-center gap-4 px-4 md:px-6">
        <Logo />
        <div className="hidden flex-1 justify-center md:flex">
          <NodeSelector nodes={nodes} nodeId={nodeId} />
        </div>
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          {role === "analis" && <LayerSwitch layer={layer} nodeId={nodeId} />}
          <LiveIndicator live={live} />
          <AccountMenu displayName={displayName} role={role} />
        </div>
      </div>
      <div className="border-t border-line px-4 py-2 md:hidden">
        <NodeSelector nodes={nodes} nodeId={nodeId} />
      </div>
    </header>
  );
}

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2" aria-label="PRANA-AI beranda">
      <Image src="/prana-ai-mark.png" alt="" width={36} height={36} priority className="h-9 w-9 object-contain" />
      <span className="hidden flex-col whitespace-nowrap leading-tight sm:flex">
        <span className="text-card-title font-bold tracking-tight text-ink">PRANA-AI</span>
        <span className="hidden text-[11px] font-medium text-ink-muted lg:inline">Sentinel Gambut</span>
      </span>
    </Link>
  );
}

function NodeSelector({ nodes, nodeId }: { nodes: NodeOption[]; nodeId: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (nodes.length === 0) {
    return <span className="text-caption text-ink-muted">Belum ada node terdaftar</span>;
  }

  return (
    <label className="flex w-full items-center gap-2 md:w-auto">
      <span className="label shrink-0">Node</span>
      <select
        value={nodeId ?? ""}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("node", e.target.value);
          router.push(`${pathname}?${next.toString()}`);
        }}
        className="w-full min-w-0 rounded-btn border border-line bg-surface px-3 py-2 text-body text-ink focus:border-brand focus:outline-none md:w-56 xl:w-80"
      >
        {nodes.map((n) => (
          <option key={n.id} value={n.id}>
            {n.lokasi ? `${n.lokasi} · ${n.id}` : n.id}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Segmented control Lapis 1 ⇄ Lapis 2 — hanya dirender untuk peran Analis. */
function LayerSwitch({ layer, nodeId }: { layer: 1 | 2; nodeId: string | null }) {
  const q = nodeId ? `?node=${encodeURIComponent(nodeId)}` : "";
  const item = (active: boolean) =>
    cx(
      "whitespace-nowrap rounded-[8px] px-3 py-1.5 text-caption font-semibold transition-colors",
      active ? "bg-surface text-brand-deep shadow-card" : "text-ink-muted hover:text-ink",
    );
  return (
    <nav aria-label="Lapis antarmuka" className="flex rounded-btn border border-line bg-surface-muted p-1">
      <Link href={`/dashboard${q}`} className={item(layer === 1)} aria-current={layer === 1 ? "page" : undefined}>
        Lapis 1<span className="hidden lg:inline"> · Operasional</span>
      </Link>
      <Link href={`/analis${q}`} className={item(layer === 2)} aria-current={layer === 2 ? "page" : undefined}>
        Lapis 2<span className="hidden lg:inline"> · Spektral</span>
      </Link>
    </nav>
  );
}

function LiveIndicator({ live }: { live: boolean }) {
  return (
    <span
      className={cx("flex items-center gap-2 text-caption font-semibold", live ? "text-live-text" : "text-offline-text")}
      title={live ? "Realtime tersambung & paket terbaru < 10 menit" : "Realtime terputus atau paket terakhir > 10 menit"}
    >
      <span className={cx("h-2.5 w-2.5 rounded-full", live ? "animate-live-pulse bg-live-dot" : "bg-offline-dot")} />
      <span className="hidden sm:inline">{live ? "Live" : "Offline"}</span>
    </span>
  );
}

function AccountMenu({ displayName, role }: { displayName: string; role: UserRole }) {
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-btn px-2 py-1.5 hover:bg-surface-muted">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-caption font-semibold text-ink">
          {displayName.slice(0, 1).toUpperCase()}
        </span>
      </summary>
      <div className="absolute right-0 mt-2 w-56 rounded-panel border border-line bg-surface p-3 shadow-card">
        <p className="truncate text-body font-semibold text-ink">{displayName}</p>
        <p className="text-caption text-ink-muted">{role === "analis" ? "Analis" : "Petugas Patroli"}</p>
        <form action="/auth/signout" method="post" className="mt-3 border-t border-line pt-3">
          <button type="submit" className="w-full rounded-btn px-2 py-1.5 text-left text-body text-ink hover:bg-brand-tint">
            Keluar
          </button>
        </form>
      </div>
    </details>
  );
}
