export default function OpsLoading() {
  return (
    <main aria-busy="true" aria-live="polite" className="mx-auto max-w-4xl space-y-5">
      <span className="sr-only">Loading operations view</span>
      <div className="h-3 w-36 animate-pulse rounded bg-slate-200" />
      <div className="h-8 w-64 max-w-full animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </main>
  );
}
