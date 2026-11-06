export function AIDraftBanner() {
  return (
    <aside className="rounded-control border border-violet-200 bg-violet-50 p-3" aria-label="AI draft notice">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-900">AI draft — not an institutional decision</p>
      <p className="mt-1 text-sm leading-5 text-violet-900">
        This content was generated with AI assistance. A named, authorised human must review and approve it before institutional use.
      </p>
    </aside>
  );
}
