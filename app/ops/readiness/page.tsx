import Link from "next/link";

const modules = [
  {
    name: "Meeting intake & review",
    route: "/ops/queue",
    state: "Limited workflow",
    detail: "Standard-sensitivity submissions only. Shared-key sessions can submit and move records to In review; they cannot approve or archive.",
    dependency: "Individual identity, officer appointments, decision authorization and audit events.",
  },
  {
    name: "Membership register",
    route: "/ops/access",
    state: "Not connected",
    detail: "No authoritative membership records or live member decisions are connected.",
    dependency: "Approved restricted data store, verified identity and Presidential governance workflow.",
  },
  {
    name: "Officer access",
    route: "/ops/access",
    state: "Policy foundation only",
    detail: "Permission vocabulary and policy tests exist. Trusted appointment records and route enforcement do not.",
    dependency: "Verified appointments, explicit scope, trusted server-side adapter and object-level route guards.",
  },
  {
    name: "Digital Chamber",
    route: "/ops/chamber",
    state: "Placeholder",
    detail: "The page describes the intended module; meeting sessions, attendance, minutes and decisions are not implemented.",
    dependency: "Chamber records, workflow transitions, authorized actors and audit trail.",
  },
  {
    name: "Action register",
    route: "/ops/actions",
    state: "Placeholder",
    detail: "No operational action ownership, due dates, evidence or closure workflow is connected.",
    dependency: "Approved decision linkage, responsible owners, review and closure evidence.",
  },
  {
    name: "Media & Content Command",
    route: "/ops/media",
    state: "Placeholder",
    detail: "No editorial queue, approval workflow or publication evidence is connected.",
    dependency: "Draft records, editorial permissions, human approval and publication history.",
  },
  {
    name: "Audit & security operations",
    route: "/ops/access",
    state: "Not implemented",
    detail: "Current regression tests are not a durable governance audit log. Stateless sessions do not support individual revocation.",
    dependency: "Append-only audit storage, individual sessions, revocation, rate limiting and monitoring.",
  },
] as const;

export default function ReadinessPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Operational governance</p>
        <h2 className="font-serif text-3xl text-slate-950">Module readiness</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          A factual view of what the Digital Operations Centre can do today, what remains a policy foundation,
          and what is still a placeholder. A configured database or visible page does not mean a workflow is operational.
        </p>
      </header>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">Release status: not approved for real restricted institutional records</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          The current sign-in is a transitional shared-key gate, not verified individual identity.
          Do not enter real membership, personnel, finance, safeguarding or disciplinary information.
        </p>
      </section>

      <div className="grid gap-3">
        {modules.map((module) => (
          <article key={module.name} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-950">{module.name}</h3>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {module.state}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{module.detail}</p>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              <span className="font-semibold text-slate-700">Required before operational use:</span> {module.dependency}
            </p>
            <Link href={module.route} className="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-emerald-800 hover:underline">
              View module →
            </Link>
          </article>
        ))}
      </div>

      <footer className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Institutional rule</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Membership, appointment, permission and decision authority are separate records.
          Only the National President or a person holding a valid, recorded delegation may exercise
          membership decision authority. Administrative access alone never grants that authority.
        </p>
      </footer>
    </div>
  );
}
