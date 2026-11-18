import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { applyRemember, REMEMBER_COOKIE } from "./cookies";
import { hasSupabaseEnv, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/** "/" = landing page publik (profil sistem untuk penjurian PKM-KC). */
const PUBLIC_PATHS = ["/", "/login", "/auth"];

/** Menyegarkan sesi Supabase & mengalihkan pengguna tanpa sesi ke /login. */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)));

  if (!hasSupabaseEnv()) {
    // Belum dikonfigurasi: landing tetap bisa dibuka, sisanya diarahkan ke /setup.
    if (pathname === "/setup" || pathname === "/") return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/setup";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const remember = request.cookies.get(REMEMBER_COOKIE)?.value === "1";
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, applyRemember(options, remember));
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
