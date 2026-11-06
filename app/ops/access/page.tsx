import Link from "next/link";

const controls = [
  {
    title: "Individual identity",
    state: "Not implemented",
    description: "Personal Google sign-in and verified identity linking are not yet available.",
  },
  {
    title: "Membership register",
    state: "Not connected",
    description: "No authoritative member records are loaded into this workspace.",
  },
  {
    title: "Officer appointments",
    state: "Not connected",
    description: "Department and officer permissions are not yet sourced from trusted appointment records.",
  },
  {
    title: "Delegated decisions",
    state: "Not enabled",
    description: "Membership decisions remain reserved to the National President unless a specific written delegation is recorded.",
  },
];

const departments = [
  "Education & Capacity Building",
  "Health & Well-being",
  "Software & Technology",
  "Civic Department",
];

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
            Governance · Access control
          </p>
          <h2 className="mt-1 font-serif text-2xl text-slate-950">Officer access</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This page describes the current access-control readiness. It does not appoint officers,
            create membership records or grant permissions.
          </p>
        </div>
        <Link href="/ops" className="text-sm font-semibold text-emerald-800 hover:underline">
          ← Command Brief
        </Link>
      </div>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5" aria-labelledby="access-warning">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Transitional access</p>
        <h3 id="access-warning" className="mt-1 text-lg font-semibold text-slate-950">
          Current sign-in is not proof of membership or office
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          The workspace still uses a shared institutional staff-key session. It is a temporary
          operational gate, not individual identity verification, membership approval or officer
          authorisation. Do not use it to process restricted membership, personnel, finance or
          safeguarding records.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="control-readiness">
        <div>
          <h3 id="control-readiness" className="font-semibold text-slate-950">Control readiness</h3>
          <p className="text-sm text-slate-500">Implementation status, not user-specific access grants.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {controls.map((control) => (
            <article key={control.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-slate-900">{control.title}</h4>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {control.state}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{control.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="governance-rule">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Governance rule</p>
        <h3 id="governance-rule" className="mt-1 font-semibold text-slate-950">
          Administration and decision authority remain separate
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The National President retains final membership authority. A Membership Administrator
          may be appointed to receive applications, verify information and maintain records.
          Administrative access does not itself confer the right to approve, reject, suspend or
          reinstate membership. Any delegated decision power must be explicit, recorded, scoped
          and time-bound.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="department-structure">
        <div>
          <h3 id="department-structure" className="font-semibold text-slate-950">Department structure</h3>
          <p className="text-sm text-slate-500">Institutional structure only; no appointments are implied.</p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {departments.map((department) => (
            <li key={department} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800">
              {department}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Individual Google identity, trusted membership records, appointment-based permissions,
        delegation records and durable access audit are release gates. This page will only display
        personal access status after those trusted services are implemented and independently tested.
      </p>
    </div>
  );
}
