import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Module slot · Council records</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-2xl text-forest-950 sm:text-3xl">Chamber</h1>
          <StatusBadge status="Not operational" />
        </div>
        <p className="text-sm leading-6 text-ink-600">The intended institutional record for Council sessions, attendance, minutes, resolutions and follow-up decisions.</p>
      </header>
      <section className="rounded-card border border-amber-200 bg-amber-50 p-4" role="status">
        <p className="text-sm font-semibold text-amber-950">No Chamber workflow is connected</p>
        <p className="mt-1 text-sm leading-5 text-amber-900">This shell does not schedule sessions, register attendance, store approved minutes, record votes or issue resolutions. It is not the official record of a Council meeting.</p>
      </section>
      <section className="rounded-card border border-line bg-white p-5">
        <h2 className="text-sm font-semibold text-forest-950">Required workflow before activation</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-700">
          <li>Issue a meeting notice with convening authority, date, agenda and participants.</li>
          <li>Record attendance and quorum where applicable.</li>
          <li>Prepare minutes and capture proposed resolutions.</li>
          <li>Require authorised human confirmation before minutes or resolutions become official.</li>
          <li>Link approved decisions to the Action Register and retain an immutable event history.</li>
        </ol>
      </section>
      <Link href="/ops/readiness" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-forest-800 hover:underline">Review module dependencies →</Link>
    </div>
  );
}
