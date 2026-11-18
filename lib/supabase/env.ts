/**
 * Hanya variabel NEXT_PUBLIC_* yang boleh dibaca dari sini.
 * SUPABASE_SERVICE_ROLE_KEY & kredensial MQTT TIDAK pernah dipakai di app Next.js —
 * hanya oleh apps/bridge (AGENTS.md §4, §8).
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function hasSupabaseEnv(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}
