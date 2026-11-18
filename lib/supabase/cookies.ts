/**
 * Dukungan "Ingat saya" pada halaman masuk.
 *
 * Dicentang   → cookie sesi Supabase persisten (bertahan setelah browser ditutup)
 *               dan email terakhir diisikan otomatis.
 * Tidak       → cookie sesi biasa: hilang begitu browser ditutup. Ini default,
 *               karena tablet patroli bisa dipakai bergantian antar petugas.
 */
export const REMEMBER_COOKIE = "prana-remember";
export const LAST_EMAIL_COOKIE = "prana-last-email";
export const REMEMBER_MAX_AGE = 60 * 60 * 24 * 400; // 400 hari (batas atas cookie Chrome)

/** Atribut cookie penanda — httpOnly agar tidak bisa diubah dari skrip halaman. */
export function flagCookieOptions(maxAge?: number) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

/**
 * Tanpa "ingat saya", buang `maxAge`/`expires` dari cookie auth Supabase
 * sehingga browser memperlakukannya sebagai cookie sesi.
 */
export function applyRemember<T extends { maxAge?: number; expires?: Date }>(options: T, remember: boolean): T {
  if (remember) return options;
  const { maxAge: _maxAge, expires: _expires, ...rest } = options;
  return rest as T;
}
