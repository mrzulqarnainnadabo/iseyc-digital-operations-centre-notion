import Link from "next/link";

const controls = [
  {
    title: "Google identity verification",
    state: "Implemented · not configured",
    description: "The feature branch includes Google OIDC verification. Provider credentials are not configured, and verified identity does not grant membership or officer access.",
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
  {
    title: "Individual DOC PIN",
    state: "Crypto primitive only",
    description: "Scrypt hashing and verification are implemented in code. Enrollment, restricted storage, distributed lockout, recovery, audit and step-up routes are not connected.",
  },
];

const departments = [
  "Education & Capacity Building",
  "Health & Well-being",
  "Digital Systems & Technology",
  "Civic Affairs",
];

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-600">
            Governance · Access control
          </p>
          <h2 className="mt-1 font-serif text-2xl text-forest-950">Officer access</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">
            This page describes the current access-control readiness. It does not appoint officers,
            create membership records or grant permissions.
          </p>
        </div>
        <Link href="/ops" className="text-sm font-semibold text-forest-800 hover:underline">
          ← Command Brief
        </Link>
      </div>

      <section className="rounded-card border border-amber-200 bg-amber-50 p-4 sm:p-5" aria-labelledby="access-warning">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Transitional access</p>
        <h3 id="access-warning" className="mt-1 text-lg font-semibold text-forest-950">
          Current sign-in is not proof of membership or office
        </h3>
        <p className="mt-2 text-sm leading-6 text-ink-700">
          The workspace still uses a shared institutional staff-key session. It is a temporary
          operational gate, not individual identity verification, membership approval or officer
          authorisation. Do not use it to process restricted membership, personnel, finance or
          safeguarding records.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="control-readiness">
        <div>
          <h3 id="control-readiness" className="font-semibold text-forest-950">Control readiness</h3>
          <p className="text-sm text-ink-600">Implementation status, not user-specific access grants.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {controls.map((control) => (
            <article key={control.title} className="rounded-card border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-ink-950">{control.title}</h4>
                <span className="rounded-full bg-cream-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
                  {control.state}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-700">{control.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-line bg-white p-4 sm:p-5" aria-labelledby="governance-rule">
        <p className="text-xs font-bold uppercase tracking-wide text-gold-600">Governance rule</p>
        <h3 id="governance-rule" className="mt-1 font-semibold text-forest-950">
          Administration and decision authority remain separate
        </h3>
        <p className="mt-2 text-sm leading-6 text-ink-700">
          The National President retains final membership authority. A Membership Administrator
          may be appointed to receive applications, verify information and maintain records.
          Administrative access does not itself confer the right to approve, reject, suspend or
          reinstate membership. Any delegated decision power must be explicit, recorded, scoped
          and time-bound.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="department-structure">
        <div>
          <h3 id="department-structure" className="font-semibold text-forest-950">Department structure</h3>
          <p className="text-sm text-ink-600">Institutional structure only; no appointments are implied.</p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {departments.map((department) => (
            <li key={department} className="rounded-card border border-line bg-white px-4 py-3 text-sm font-medium text-ink-950">
              {department}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs leading-5 text-ink-600">
        Individual Google identity, trusted membership records, appointment-based permissions,
        delegation records and durable access audit are release gates. This page will only display
        personal access status after those trusted services are implemented and independently tested.
      </p>
    </div>
  );
}
