import Link from "next/link";

export default function SeatBriefingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <Link href="/ops" className="inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline">← Command home</Link>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Governance · Seat briefing</p>
        <h1 className="font-serif text-2xl text-forest-950 sm:text-3xl">Day-1 seat packet</h1>
        
      </header>

      <section className="rounded-card border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">No active appointment record is linked to this session</p>
        
      </section>

      <section className="rounded-card border border-line bg-white p-5 shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-600">Institutional orientation</p>
        <h2 className="mt-1 text-lg font-semibold text-forest-950">What every seat must protect</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-700">
          <li>ISEYC's non-partisan identity and public-interest purpose.</li>
          <li>Clear separation between proposals, drafts, approved records and published outputs.</li>
          <li>Accountability for decisions, assigned responsibilities and documented follow-up.</li>
          <li>Privacy and least-privilege access to membership, personnel and internal records.</li>
        </ul>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-card border border-line bg-white p-5">
          <h2 className="text-sm font-semibold text-forest-950">First actions · template</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-5 text-ink-700">
            <li>Confirm appointment instrument and scope.</li>
            <li>Read the institutional charter and current operating policies.</li>
            <li>Review only records authorised for the seat.</li>
            <li>Agree reporting cadence with the documented supervisor.</li>
            <li>Record initial priorities for human review.</li>
          </ol>
        </section>
        <section className="rounded-card border border-line bg-white p-5">
          <h2 className="text-sm font-semibold text-forest-950">Human-only responsibilities</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-5 text-ink-700">
            <li>Accepting or rejecting institutional decisions.</li>
            <li>Appointments, delegation and membership authority.</li>
            <li>External statements and commitments on behalf of ISEYC.</li>
            <li>Approval of restricted records and access grants.</li>
          </ul>
        </section>
      </div>

      <section className="rounded-card border border-forest-900 bg-forest-950 p-5 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#d7c18f]">AI assistance boundary</p>
        <h2 className="mt-1 text-base font-semibold">AI is staff to the seat, never the seat-holder</h2>
        
      </section>
    </div>
  );
}
