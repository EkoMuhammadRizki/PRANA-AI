import { Skeleton } from "./primitives";

/** Skeleton saat memuat (AGENTS.md §6) — tidak menampilkan angka apa pun. */
export function DashboardSkeleton({ layer }: { layer: 1 | 2 }) {
  return (
    <div aria-busy="true" aria-label="Memuat">
      <div className="h-topbar border-b border-line bg-surface" />
      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-6">
        <Skeleton className="h-8 w-64" />
        {layer === 1 ? (
          <>
            <Skeleton className="h-[200px] rounded-card" />
            <div className="grid-12">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-card md:col-span-6 xl:col-span-3" />
              ))}
            </div>
            <Skeleton className="h-28 rounded-card" />
            <Skeleton className="h-16 rounded-card" />
            <Skeleton className="h-72 rounded-card" />
          </>
        ) : (
          <>
            <div className="grid-12">
              <Skeleton className="h-[420px] rounded-card md:col-span-12 xl:col-span-8" />
              <Skeleton className="h-[420px] rounded-card md:col-span-12 xl:col-span-4" />
            </div>
            <div className="grid-12">
              <Skeleton className="h-72 rounded-card md:col-span-6" />
              <Skeleton className="h-72 rounded-card md:col-span-6" />
            </div>
            <Skeleton className="h-96 rounded-card" />
          </>
        )}
      </main>
    </div>
  );
}
