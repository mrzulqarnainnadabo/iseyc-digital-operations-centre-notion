export function AIDraftBanner() {
  return (
    <aside className="rounded-control border border-gold-600 bg-cream-50 p-3" aria-label="AI draft notice">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-forest-950">AI draft — not an institutional decision</p>
      <p className="mt-1 text-sm leading-5 text-forest-950">
        This content was generated with AI assistance. A named, authorised human must review and approve it before institutional use.
      </p>
    </aside>
  );
}
