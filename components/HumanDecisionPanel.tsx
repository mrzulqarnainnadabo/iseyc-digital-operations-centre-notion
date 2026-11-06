const actions = ["Accept", "Edit", "Return", "Reject"] as const;

export function HumanDecisionPanel({ disabledReason }: { disabledReason: string }) {
  return (
    <section className="rounded-card border border-line bg-white p-4" aria-labelledby="human-decision-heading">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Human approval</p>
      <h2 id="human-decision-heading" className="mt-1 text-sm font-semibold text-forest-950">Decision controls</h2>
      <p className="mt-1 text-sm leading-5 text-ink-600">{disabledReason}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {actions.map((action) => (
          <button key={action} type="button" disabled aria-disabled="true" className="min-h-[44px] cursor-not-allowed rounded-control border border-line bg-slate-50 px-3 text-sm font-semibold text-ink-600">
            {action}
          </button>
        ))}
      </div>
    </section>
  );
}
