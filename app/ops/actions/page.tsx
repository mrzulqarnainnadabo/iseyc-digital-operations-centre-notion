import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Module slot · Institutional follow-through</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-2xl text-forest-950 sm:text-3xl">Action register</h1>
          <StatusBadge status="Not operational" />
        </div>
        
      </header>
      <section className="rounded-card border border-amber-200 bg-amber-50 p-4" role="status">
        <p className="text-sm font-semibold text-amber-950">No action workflow is connected</p>
        <p className="mt-1 text-sm leading-5 text-amber-900">This shell does not create assignments, notify owners, track deadlines, collect evidence or approve closure. Do not rely on it as an institutional task register.</p>
      </section>
      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="text-sm font-semibold text-forest-950">Required workflow before activation</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-700">
          <li>Link each action to an approved decision and its meeting record.</li>
          <li>Record one accountable owner, due date, priority and responsible department.</li>
          <li>Allow owners to submit progress and documentary evidence.</li>
          <li>Require authorised review before an action is marked complete.</li>
          <li>Retain a dated history of assignment, changes, review and closure.</li>
        </ol>
      </section>
      <Link href="/ops/readiness" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">Readiness</Link>
    </div>
  );
}
