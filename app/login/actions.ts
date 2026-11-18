"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  flagCookieOptions,
  LAST_EMAIL_COOKIE,
  REMEMBER_COOKIE,
  REMEMBER_MAX_AGE,
} from "@/lib/supabase/cookies";
import { createClient } from "@/lib/supabase/server";

/** Hanya izinkan redirect ke path internal (cegah open redirect). */
function safeNext(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  const next = safeNext(formData.get("next"));

  // `remember` diteruskan eksplisit: cookie penanda belum ada saat cookie sesi ditulis.
  const supabase = await createClient({ remember });
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  // Disimpan hanya setelah kredensial terbukti benar.
  const cookieStore = await cookies();
  if (remember) {
    cookieStore.set(REMEMBER_COOKIE, "1", flagCookieOptions(REMEMBER_MAX_AGE));
    cookieStore.set(LAST_EMAIL_COOKIE, email, flagCookieOptions(REMEMBER_MAX_AGE));
  } else {
    cookieStore.delete(REMEMBER_COOKIE);
    cookieStore.delete(LAST_EMAIL_COOKIE);
  }

  redirect(next);
}
