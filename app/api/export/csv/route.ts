import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { CSV_COLUMN_COUNT, CSV_SPEC, isCsvReady, toCsv, type CsvRow } from "@/lib/csv";
import { parseRange, RANGES } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Unduh Rekapan Mentah (.CSV 17 kolom) — Lapis 2, analis saja.
 * Ditolak di route handler (di sini) DAN di RLS (reading_diagnostics/spectra).
 */
export async function GET(request: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (profile.role !== "analis") return NextResponse.json({ error: "Khusus peran Analis" }, { status: 403 });

  if (!isCsvReady() || !CSV_SPEC) {
    return NextResponse.json(
      {
        error: `Spesifikasi ${CSV_COLUMN_COUNT} kolom format store-and-forward belum tersedia. Kolom tidak dikarang — isi CSV_SPEC di lib/csv.ts sesuai firmware.`,
      },
      { status: 501 },
    );
  }

  const params = request.nextUrl.searchParams;
  const range = parseRange(params.get("range"));
  const nodeId = params.get("node");
  const since = new Date(Date.now() - RANGES[range].ms).toISOString();

  const supabase = await createClient();
  let q = supabase
    .from("readings")
    .select("*, reading_diagnostics(*)")
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true })
    .limit(50_000);
  if (nodeId) q = q.eq("node_id", nodeId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "Gagal membaca data" }, { status: 502 });

  const rows = (data ?? []).map((r) => {
    const row = r as CsvRow;
    const d = row.reading_diagnostics;
    return { ...row, reading_diagnostics: Array.isArray(d) ? (d[0] ?? null) : (d ?? null) } as CsvRow;
  });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return new NextResponse(toCsv(rows, CSV_SPEC), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prana-ai_${nodeId ?? "semua"}_${range}_${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
