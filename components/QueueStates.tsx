"use client";

import Link from "next/link";

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-5" role="status" aria-live="polite" aria-busy="true">
      <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-slate-100" />
      <p className="sr-only">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-card border border-dashed border-line bg-white px-5 py-10 text-center">
      <p className="font-semibold text-ink-950">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-5 text-ink-600">{description}</p> : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="mt-4 inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white">{actionLabel}</Link>
      ) : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-card border border-amber-200 bg-amber-50 p-4" role="alert">
      <p className="text-sm text-amber-950">{message}</p>
      <button type="button" onClick={onRetry} className="mt-3 min-h-[44px] font-semibold text-amber-950 underline">Retry</button>
    </div>
  );
}
