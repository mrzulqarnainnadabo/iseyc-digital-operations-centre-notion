import Link from "next/link";

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Shared function · Chief of Staff</p>
        <h1 className="font-serif text-2xl text-forest-950 sm:text-3xl">Communications</h1>
        <p className="text-xs text-ink-600">Shared function · Chief of Staff</p>
      </header>
      <section className="rounded-card border border-amber-200 bg-amber-50 p-4" role="status">
        <p className="text-sm font-semibold text-amber-950">Not operational — no editorial or publishing workflow is connected.</p>
        <p className="mt-1 text-sm leading-5 text-amber-900">This screen does not store drafts, assign editors, collect approvals, schedule publication or verify what was published. Do not treat it as authorisation to issue an ISEYC statement.</p>
      </section>
      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="text-sm font-semibold text-forest-950">Required workflow before launch</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-700">
          <li>Create a draft with owner, audience, channel and source references.</li>
          <li>Route the draft to an authorised editor for factual and institutional review.</li>
          <li>Require designated human approval before external use.</li>
          <li>Record the final approved version and publication evidence.</li>
          <li>Preserve corrections and withdrawal history without silently overwriting prior approvals.</li>
        </ol>
      </section>
      <Link href="/ops/readiness" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">Readiness</Link>
    </div>
  );
}
