import Link from "next/link";

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Executive / planned module</p>
        <h2 className="font-serif text-3xl text-slate-950">Digital Chamber</h2>
        <p className="text-sm leading-6 text-slate-600">
          The intended institutional record for Council sessions, attendance, minutes, resolutions and follow-up decisions.
        </p>
      </header>
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4" role="status">
        <p className="text-sm font-semibold text-amber-950">Not operational — no Chamber sessions or resolutions are recorded here.</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          This screen does not schedule meetings, register attendance, store approved minutes, record votes or issue resolutions.
          It must not be used as the official record of a Council meeting.
        </p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Required workflow before launch</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
          <li>Issue a meeting notice with convening authority, date, agenda and participants.</li>
          <li>Record attendance and quorum where applicable.</li>
          <li>Prepare minutes and capture proposed resolutions.</li>
          <li>Require authorized human confirmation before minutes or resolutions become official.</li>
          <li>Link approved decisions to the Action Register and retain an immutable event history.</li>
        </ol>
      </section>
      <Link href="/ops/readiness" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-emerald-800 hover:underline">
        Review module dependencies →
      </Link>
    </div>
  );
}
