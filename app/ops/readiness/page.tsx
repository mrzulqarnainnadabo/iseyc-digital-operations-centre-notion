import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import DepartmentArchitectureDiagram from "@/components/DepartmentArchitectureDiagram";

const modules = [
  {
    name: "Meeting intake & review",
    route: "/ops/queue",
    state: "Partial",
    detail: "Standard-sensitivity submissions only. Shared-key sessions can submit and move records to In review; they cannot approve or archive.",
    dependency: "Individual identity, officer appointments, decision authorization and audit events.",
  },
  {
    name: "Membership register",
    route: "/ops/access",
    state: "Not operational",
    detail: "No authoritative membership records or live member decisions are connected. The member register is Not connected.",
    dependency: "Approved restricted data store, verified identity and Presidential governance workflow.",
  },
  {
    name: "Officer access",
    route: "/ops/access",
    state: "Partial",
    detail: "Permission vocabulary and policy tests exist. Trusted appointment records and route enforcement do not.",
    dependency: "Verified appointments, explicit scope, trusted server-side adapter and object-level route guards.",
  },
  {
    name: "Digital Chamber",
    route: "/ops/chamber",
    state: "Partial",
    detail: "Live session list and scheduling of sessions with date and summary are connected. Attendance, minutes, formal decisions and authorised closure remain disabled under shared-key sessions.",
    dependency: "Verified individual identity, appointment authority, attendance records, minutes workflow and durable audit.",
  },
  {
    name: "Action register",
    route: "/ops/actions",
    state: "Partial",
    detail: "Live list and creation of Open actions with accountable role and due date are connected. Evidence attachment, review escalation and authorised closure remain disabled.",
    dependency: "Verified appointments, decision linkage, evidence storage and closure authority.",
  },
  {
    name: "Media & Content Command",
    route: "/ops/media",
    state: "Partial",
    detail: "Live editorial list and creation of Draft records with channel and notes are connected. Editorial approval, publication and dispatch remain disabled under shared-key sessions.",
    dependency: "Verified editorial roles, approval history, publication evidence and individual identity.",
  },
  {
    name: "External engagement",
    route: "/ops/partners",
    state: "Partial",
    detail: "Organisation and contact directories, invitation drafts linked to approved meetings, and partnership agreement register views are connected. Invitation dispatch, RSVP handling and agreement execution remain disabled.",
    dependency: "Verified organisations and contacts, approved meeting eligibility, individual dispatch authority and durable audit.",
  },
  {
    name: "Department programmes & work plans",
    route: "/ops/departments/education",
    state: "Not operational",
    detail: "Programme, work-plan and report APIs and department UI panels are implemented. Live persistence uses the existing IDCC — Programmes & Work Register for both programmes and operational work-plan items, plus the IDCC — Department Reports & Scorecards register. No programme instances are invented when disconnected.",
    dependency: "Share the two existing IDCC registers with the integration and configure NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID and NOTION_DEPARTMENT_REPORTS_DATABASE_ID. Work-plan items use Work Type = Operations in the shared Programmes & Work Register; do not create a duplicate work-plan database. Department-scoped access with verified appointments remains required.",
  },
  {
    name: "Audit & security operations",
    route: "/ops/access",
    state: "Not operational",
    detail: "Current regression tests are not a durable governance audit log. Stateless sessions do not support individual revocation.",
    dependency: "Append-only audit storage, individual sessions, revocation, rate limiting and monitoring.",
  },
] as const;

export default function ReadinessPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">Operational governance</p>
        <h2 className="font-serif text-3xl text-forest-950">Module readiness</h2>
        <p className="max-w-2xl text-sm leading-6 text-ink-700">
          A factual view of what the Digital Operations Centre can do today, what remains a policy foundation,
          and what is not yet implemented or connected. Modules marked Partial have live list/create paths but blocked authority steps. A configured database or visible page does not mean a workflow is operational.
        </p>
      </header>

      <section className="rounded-card border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">Release status: not approved for real restricted institutional records</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          The current sign-in is a transitional shared-key gate, not verified individual identity.
          Do not enter real membership, personnel, finance, safeguarding or disciplinary information.
        </p>
      </section>

      <div className="grid gap-3">
        {modules.map((module) => (
          <article key={module.name} className="rounded-card border border-line bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold text-forest-950">{module.name}</h3>
              <StatusBadge status={module.state} />
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-700">{module.detail}</p>
            <p className="mt-3 text-xs leading-5 text-ink-600">
              <span className="font-semibold text-ink-700">Required before operational use:</span> {module.dependency}
            </p>
            <Link href={module.route} className="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline">
              View module →
            </Link>
          </article>
        ))}
      </div>

      <DepartmentArchitectureDiagram />

      <section className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-700">Departments</p>
          <h2 className="font-serif text-2xl text-forest-950">Department workspaces</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-700">
            Each department workspace states its institutional responsibilities, links to shared operational
            registers and keeps authority boundaries explicit. Programme registers and appointed ownership
            remain unconnected until Notion env is configured.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { id: "education", name: "Education & Capacity Building" },
            { id: "health", name: "Health & Well-being" },
            { id: "digital-systems", name: "Digital Systems & Technology" },
            { id: "civic-affairs", name: "Civic Affairs & Public Accountability" },
          ].map((dept) => (
            <Link
              key={dept.id}
              href={`/ops/departments/${dept.id}`}
              className="rounded-card border border-line bg-white p-4 shadow-card transition-colors hover:border-forest-800"
            >
              <p className="font-semibold text-forest-950">{dept.name}</p>
              <p className="mt-1 text-sm text-ink-600">Open department workspace →</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="rounded-card border border-line bg-cream-50 p-4">
        <p className="text-sm font-semibold text-ink-950">Institutional rule</p>
        <p className="mt-1 text-sm leading-6 text-ink-700">
          Membership, appointment, permission and decision authority are separate records.
          Only the National President or a person holding a valid, recorded delegation may exercise
          membership decision authority. Administrative access alone never grants that authority.
        </p>
      </footer>
    </div>
  );
}
