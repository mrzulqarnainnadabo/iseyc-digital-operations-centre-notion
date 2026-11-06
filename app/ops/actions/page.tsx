import Link from "next/link";

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Operating records / planned module</p>
        <h2 className="font-serif text-3xl text-slate-950">Action register</h2>
        <p className="text-sm leading-6 text-slate-600">
          A future register for tracking actions arising from approved Council and institutional decisions.
        </p>
      </header>
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4" role="status">
        <p className="text-sm font-semibold text-amber-950">Not operational — no action records are being managed here.</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          This screen does not currently create assignments, notify owners, track deadlines, collect evidence or approve closure.
          Do not rely on it as an institutional task register.
        </p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Required workflow before launch</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
          <li>Link each action to an approved decision and its meeting record.</li>
          <li>Record one accountable owner, due date, priority and responsible department.</li>
          <li>Allow owners to submit progress and documentary evidence.</li>
          <li>Require authorized review before an action is marked complete.</li>
          <li>Retain a dated history of assignment, changes, review and closure.</li>
        </ol>
      </section>
      <Link href="/ops/readiness" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-emerald-800 hover:underline">
        Review module dependencies →
      </Link>
    </div>
  );
}
