import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { applyRemember, REMEMBER_COOKIE } from "./cookies";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Klien server (Server Component / Route Handler / Server Action) atas nama pengguna.
 *
 * @param opts.remember  Dipakai saat proses masuk, ketika cookie penanda belum ada.
 *                       Di luar itu nilainya dibaca dari cookie.
 */
export async function createClient(opts?: { remember?: boolean }) {
  const cookieStore = await cookies();
  const remember = opts?.remember ?? cookieStore.get(REMEMBER_COOKIE)?.value === "1";

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, applyRemember(options, remember));
          }
        } catch {
          // Dipanggil dari Server Component: cookie diperbarui oleh proxy.ts.
        }
      },
    },
  });
}
