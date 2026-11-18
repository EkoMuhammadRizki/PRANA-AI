import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { getProfile } from "@/lib/auth";
import { LAST_EMAIL_COOKIE, REMEMBER_COOKIE } from "@/lib/supabase/cookies";
import { signIn } from "./actions";

export const metadata = { title: "Masuk" };

const field =
  "mt-1 w-full rounded-btn border border-line px-3 py-2.5 text-body focus:border-brand focus:outline-none";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  if (await getProfile()) redirect("/dashboard");
  const { error, next } = await searchParams;

  const cookieStore = await cookies();
  const remembered = cookieStore.get(REMEMBER_COOKIE)?.value === "1";
  const lastEmail = cookieStore.get(LAST_EMAIL_COOKIE)?.value ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center gap-3">
          <Image
            src="/prana-ai-mark.png"
            alt=""
            width={48}
            height={48}
            priority
            className="h-12 w-12 object-contain"
          />
          <div>
            <p className="text-page-title font-bold leading-tight">PRANA-AI</p>
            <p className="text-caption text-ink-muted">Sentinel deteksi dini kebakaran gambut</p>
          </div>
        </Link>

        <form action={signIn} className="card space-y-4">
          <input type="hidden" name="next" value={next ?? "/dashboard"} />
          <label className="block">
            <span className="label">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={lastEmail}
              autoFocus={lastEmail === ""}
              className={field}
            />
          </label>
          <label className="block">
            <span className="label">Kata sandi</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              autoFocus={lastEmail !== ""}
              className={field}
            />
          </label>

          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              name="remember"
              defaultChecked={remembered}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand"
            />
            <span>
              <span className="text-body font-medium text-ink">Ingat saya</span>
              <span className="block text-caption text-ink-muted">
                Tetap masuk di perangkat ini. Jangan centang pada tablet patroli yang dipakai bergantian.
              </span>
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-panel bg-k3-bg px-3 py-2 text-caption font-medium text-k3-text">
              Email atau kata sandi salah.
            </p>
          )}
          <Button type="submit" className="w-full">
            Masuk
          </Button>
          <p className="text-caption text-ink-muted">
            Akun dibuat oleh administrator. Peran (Petugas Patroli / Analis) ditetapkan di server.
          </p>
        </form>

        <p className="mt-4 text-center text-caption">
          <Link href="/" className="font-medium text-brand-deep hover:underline">
            ← Kembali ke profil sistem
          </Link>
        </p>
      </div>
    </main>
  );
}
