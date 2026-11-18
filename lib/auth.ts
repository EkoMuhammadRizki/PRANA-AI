import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** Profil pengguna saat ini (sekali per request). null bila tidak login. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    // Tanpa baris profil → perlakukan sebagai peran paling terbatas.
    role: data?.role === "analis" ? "analis" : "user",
    fullName: (data?.full_name as string | null) ?? null,
    email: user.email ?? null,
  };
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Penjaga Lapis 2. Peran User dialihkan ke Lapis 1 (RLS tetap menolak di lapisan data). */
export async function requireAnalis(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "analis") redirect("/dashboard");
  return profile;
}
