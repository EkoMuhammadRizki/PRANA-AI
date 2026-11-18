import { requireAnalis } from "@/lib/auth";

/** Penjaga route group Lapis 2: peran User dialihkan ke Lapis 1. */
export default async function AnalisLayout({ children }: { children: React.ReactNode }) {
  await requireAnalis();
  return children;
}
