import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata = { title: "Konfigurasi" };

/** Tampil hanya bila env Supabase belum diisi. Tidak ada data contoh. */
export default function SetupPage() {
  if (hasSupabaseEnv()) redirect("/dashboard");
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12">
      <div className="card space-y-4">
        <h1 className="text-page-title font-semibold">Supabase belum dikonfigurasi</h1>
        <p className="text-body text-ink-muted">
          Dashboard PRANA-AI hanya membaca data dari Supabase. Isi variabel berikut di <code>.env.local</code>{" "}
          (lokal) atau di Environment Variables Vercel, lalu jalankan ulang server.
        </p>
        <pre className="num overflow-x-auto rounded-panel bg-surface-muted p-4 text-caption">
          {`NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>`}
        </pre>
        <p className="text-caption text-ink-muted">Lihat README.md untuk migrasi database dan bridge MQTT.</p>
      </div>
    </main>
  );
}
