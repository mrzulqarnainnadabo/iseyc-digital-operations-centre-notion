import Link from "next/link";

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Communications / planned module</p>
        <h2 className="font-serif text-3xl text-slate-950">Media &amp; Content Command</h2>
        <p className="text-sm leading-6 text-slate-600">
          The intended editorial workflow for institutional statements, notices, reports and approved public materials.
        </p>
      </header>
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4" role="status">
        <p className="text-sm font-semibold text-amber-950">Not operational — no editorial or publishing workflow is connected.</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          This screen does not store drafts, assign editors, collect approvals, schedule publication or verify what was published.
          Do not treat it as authorization to issue an ISEYC statement.
        </p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Required workflow before launch</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
          <li>Create a draft with owner, audience, channel and source references.</li>
          <li>Route the draft to an authorized editor for factual and institutional review.</li>
          <li>Require designated human approval before external use.</li>
          <li>Record the final approved version and publication evidence.</li>
          <li>Preserve corrections and withdrawal history without silently overwriting prior approvals.</li>
        </ol>
      </section>
      <Link href="/ops/readiness" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-emerald-800 hover:underline">
        Review module dependencies →
      </Link>
    </div>
  );
}
