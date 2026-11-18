import type { ButtonHTMLAttributes, ReactNode } from "react";
import { CLASS_META } from "@/lib/domain";
import { EMPTY } from "@/lib/format";
import type { PeatClass } from "@/lib/types";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// ── Kartu ─────────────────────────────────────────────────────────
export function Card({
  title,
  icon,
  action,
  className,
  children,
}: {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx("card", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="flex items-center gap-2 text-card-title font-semibold text-ink">
              {icon && <span className="text-ink-muted">{icon}</span>}
              {title}
            </h2>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

// ── Badge kelas TinyML (DESIGN.md §3 Badge Status) ───────────────
export function ClassBadge({ peatClass }: { peatClass: PeatClass }) {
  const m = CLASS_META[peatClass];
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-caption font-semibold",
        m.text,
        m.bg,
        m.border,
      )}
    >
      {m.short}
    </span>
  );
}

// ── Badge data basi ──────────────────────────────────────────────
export function StaleBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-surface-muted px-3 py-1 text-caption font-semibold text-ink-muted">
      Data tertunda
    </span>
  );
}

export function SourceBadge() {
  return (
    <span
      className="inline-flex items-center rounded-full border border-line bg-surface-muted px-3 py-1 text-caption font-semibold text-ink-muted"
      title="Diterima lewat sinkronisasi ulang store-and-forward"
    >
      Backfill
    </span>
  );
}

// ── Nilai kosong: "—" + "Menunggu paket" ─────────────────────────
export function WaitingValue({ className }: { className?: string }) {
  return (
    <div className={className}>
      <span className="num text-kpi font-bold text-ink-disabled">{EMPTY}</span>
      <p className="mt-1 text-caption text-ink-muted">Menunggu paket</p>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-panel bg-surface-muted", className)} />;
}

// ── Tombol (DESIGN.md §3) ────────────────────────────────────────
export function Button({
  variant = "primary",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-btn px-5 py-3 text-body font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
  const styles =
    variant === "primary"
      ? "bg-brand-gradient text-white hover:bg-none hover:bg-brand-deep active:bg-brand-deep disabled:bg-none disabled:bg-line disabled:text-ink-disabled disabled:cursor-not-allowed"
      : "border border-brand bg-transparent text-brand-deep hover:bg-brand-tint disabled:border-line disabled:text-ink-disabled disabled:hover:bg-transparent disabled:cursor-not-allowed";
  return <button className={cx(base, styles, className)} {...rest} />;
}

// ── Banner non-blocking ──────────────────────────────────────────
export function NetworkBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-panel border border-line bg-surface-muted px-4 py-2 text-body text-ink"
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-offline-dot" />
      {children}
    </div>
  );
}

// ── Alert box (DESIGN.md §3) ─────────────────────────────────────
export function AlertBox({ title, children, icon }: { title: string; children?: ReactNode; icon: ReactNode }) {
  return (
    <div role="alert" className="flex gap-3 rounded-panel border-l-4 border-danger bg-k3-bg p-4 text-k3-text">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 text-body">{children}</div>}
      </div>
    </div>
  );
}
