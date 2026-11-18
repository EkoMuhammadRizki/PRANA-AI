"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { createClient } from "./supabase/client";

export type RealtimeState = "connecting" | "live" | "error";

type Row = Record<string, unknown>;

interface Handlers {
  onReading?: (row: Row) => void;
  onNode?: (row: Row) => void;
  onAlert?: (row: Row) => void;
}

/**
 * SATU subscription Supabase Realtime per halaman (AGENTS.md §6).
 * Mendengarkan INSERT readings, INSERT/UPDATE nodes, dan INSERT alerts.
 * Dibersihkan di cleanup. Tidak ada polling. RLS tetap berlaku pada payload.
 *
 * @param nodeId  null = semua node (dipakai Lapis 2 untuk tabel lintas node)
 */
export function usePranaRealtime(pageKey: string, nodeId: string | null, handlers: Handlers): RealtimeState {
  const [state, setState] = useState<RealtimeState>("connecting");
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;
    setState("connecting");

    (async () => {
      // Pastikan token pengguna terpasang agar RLS dievaluasi atas nama pengguna.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;

      const readingFilter = nodeId ? { filter: `node_id=eq.${nodeId}` } : {};
      const nodeFilter = nodeId ? { filter: `id=eq.${nodeId}` } : {};

      channel = supabase
        .channel(`prana:${pageKey}:${nodeId ?? "all"}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "readings", ...readingFilter }, (p) =>
          ref.current.onReading?.(p.new as Row),
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "nodes", ...nodeFilter }, (p) => {
          if (p.eventType !== "DELETE") ref.current.onNode?.(p.new as Row);
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", ...readingFilter }, (p) =>
          ref.current.onAlert?.(p.new as Row),
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setState("live");
          else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setState("error");
        });
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [pageKey, nodeId]);

  return state;
}
