import Link from "next/link";
import { notFound } from "next/navigation";
import { configFlags, listMeetings } from "@/lib/notion";
import { filterLegacyVisibleMeetings } from "@/lib/legacy-session-boundary";
import { getDepartment } from "@/lib/departments";
import {
  departmentProgrammeRegisterConfigured,
  departmentReportRegisterConfigured,
  departmentWorkPlanRegisterConfigured,
  getDepartmentOperatingProfile,
  isOpsDepartmentId,
  type OpsDepartmentId,
} from "@/lib/department-operations";

export const dynamic = "force-dynamic";

const ALL_DEPARTMENTS: { id: OpsDepartmentId; name: string }[] = [
  { id: "education", name: "Education & Capacity Building" },
  { id: "health", name: "Health & Well-being" },
  { id: "digital-systems", name: "Digital Systems & Technology" },
  { id: "civic-affairs", name: "Civic Affairs" },
];

export default async function DepartmentDeskPage({
  params,
}: {
  params: Promise<{ department: string }>;
}) {
  const { department } = await params;
  if (!isOpsDepartmentId(department)) notFound();

  const profile = getDepartmentOperatingProfile(department);
  if (!profile) notFound();

  const publicDef = getDepartment(profile.publicSlug);
  const flags = configFlags();
  const programmesConfigured = departmentProgrammeRegisterConfigured();
  const workPlansConfigured = departmentWorkPlanRegisterConfigured();
  const reportsConfigured = departmentReportRegisterConfigured();

  let meetings: Awaited<ReturnType<typeof listMeetings>>["meetings"] = [];
  let sourceMessage =
    "The approved Meetings register is not configured. No meeting records are shown.";
  if (flags.token && flags.meetings) {
    try {
      const result = await listMeetings({ pageSize: 50 });
      const visible = filterLegacyVisibleMeetings(result.meetings);
      meetings = visible.filter((meeting) => {
        const haystack = `${meeting.conveningBody} ${meeting.title}`.toLowerCase();
        return profile.meetingTerms.some((term) => haystack.includes(term));
      });
      sourceMessage =
        "Filtered from the connected internal Meetings register · Standard-sensitivity records only.";
    } catch {
      sourceMessage =
        "The Meetings register could not be reached. No cached or estimated records are displayed.";
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = meetings
    .filter((meeting) => meeting.meetingDate && meeting.meetingDate >= today)
    .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
  const recent = [...meetings]
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="overflow-hidden rounded-card border border-forest-900 bg-forest-950 p-5 text-white shadow-card sm:p-7">
        <Link
          href="/ops/readiness"
          className="inline-flex min-h-[36px] items-center text-sm text-white/75 hover:text-white"
        >
          ← Department overview
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-400">
              Department operating workspace
            </p>
            <h1 className="mt-1 font-serif text-2xl leading-tight sm:text-3xl">{profile.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">{profile.mandate}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-[32px] items-center rounded-full border border-white/20 px-3 text-xs font-medium text-white/85">
              Institutional
            </span>
            <span className="inline-flex min-h-[32px] items-center rounded-full border border-amber-300/40 bg-amber-950/30 px-3 text-xs font-medium text-amber-100">
              Shared-key limits apply
            </span>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-5 text-white/65">{profile.missionLink}</p>
      </header>

      <nav
        aria-label="Department sections"
        className="flex gap-2 overflow-x-auto pb-1 text-sm font-semibold"
      >
        {[
          ["#mandate", "Mandate"],
          ["#functions", "Functions"],
          ["#programmes", "Programmes"],
          ["#work-plans", "Work plans"],
          ["#reports", "Reports"],
          ["#meetings", "Meetings"],
          ["#tools", "Tools"],
          ["#coordination", "Coordination"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="inline-flex min-h-[40px] shrink-0 items-center rounded-full border border-line bg-white px-3 text-forest-900 hover:border-forest-800"
          >
            {label}
          </a>
        ))}
      </nav>

      <section className="rounded-card border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <p className="text-sm font-semibold text-amber-950">Authority boundary</p>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          This workspace supports coordination and record-keeping. A staff login does not prove individual
          identity, appointment or decision authority. Formal approval, publication, official dispatch,
          decision authorisation and action closure remain disabled until verified appointments and
          scoped permissions are in place.
        </p>
      </section>

      <section id="mandate" className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
            Department identity
          </p>
          <h2 className="mt-1 font-serif text-xl text-forest-950">Mandate & responsibilities</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">{profile.mandate}</p>
          {publicDef ? (
            <p className="mt-3 text-sm leading-6 text-ink-600">{publicDef.introduction}</p>
          ) : null}
          <ul className="mt-4 space-y-2">
            {profile.strategicPriorities.map((item) => (
              <li
                key={item}
                className="rounded-control border border-line bg-cream-50 px-3 py-2 text-sm text-ink-800"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
            Functional boundaries
          </p>
          <h2 className="mt-1 font-serif text-xl text-forest-950">What this department does not do</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-700">
            {profile.boundaries.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {publicDef ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                Public evidence priorities
              </p>
              <ul className="mt-2 space-y-2">
                {publicDef.priorities.map((item) => (
                  <li key={item.title} className="rounded-control border border-line p-3">
                    <p className="text-sm font-semibold text-forest-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-600">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      </section>

      <section id="functions" className="space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
            Operating structure
          </p>
          <h2 className="font-serif text-xl text-forest-950 sm:text-2xl">Functional areas</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-600">
            Each function defines responsibility, typical activities, expected outputs and how work is
            documented. Functions are institutional structure — not evidence that staff are assigned.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {profile.functions.map((fn) => (
            <article key={fn.id} className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
              <h3 className="font-semibold text-forest-950">{fn.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-700">{fn.responsibility}</p>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Activities</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-ink-700">
                    {fn.activities.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Outputs</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-ink-700">
                    {fn.outputs.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-ink-600">
                <span className="font-semibold text-ink-700">Documentation:</span> {fn.documentation}
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-600">
                <span className="font-semibold text-ink-700">Coordinates with:</span>{" "}
                {fn.coordinatesWith.join(" · ")}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="programmes" className="rounded-card border border-line bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
              Programme management
            </p>
            <h2 className="mt-1 font-serif text-xl text-forest-950">Programmes & initiatives</h2>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
            {programmesConfigured ? "Configured · not live-verified" : "Not connected"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-ink-700">
          Programme records require title, objectives, department ownership, target community, geography,
          activities, deliverables, dates, accountable role (role title only until appointments exist),
          status and evidence notes. A dedicated department programme register is also not connected. Do
          not invent programme IDs, officer names or progress figures.
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-600">
          Required environment: <code className="text-xs">NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID</code>{" "}
          plus Notion integration share. Until then, use the shared Actions register for accountable
          follow-ups and the Meetings register for formal coordination.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/ops/actions"
            className="inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Open Actions register
          </Link>
          <Link
            href="/ops/intake"
            className="inline-flex min-h-[44px] items-center rounded-control border border-line px-4 text-sm font-semibold text-forest-950 hover:bg-cream-50"
          >
            Schedule coordination meeting
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article id="work-plans" className="rounded-card border border-line bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
                Work planning
              </p>
              <h2 className="mt-1 font-serif text-xl text-forest-950">Work plans & deliverables</h2>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
              {workPlansConfigured ? "Configured · not live-verified" : "Not connected"}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            A department task register is not yet connected. Assignments, deadlines and completion status
            are intentionally withheld rather than simulated. Planned work, deliverables, dependencies,
            progress notes and evidence belong in an approved work-plan register when configured.
          </p>
          <p className="mt-2 text-xs leading-5 text-ink-600">
            Env: <code>NOTION_DEPARTMENT_WORKPLANS_DATABASE_ID</code>
          </p>
        </article>
        <article id="reports" className="rounded-card border border-line bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
                Accountability
              </p>
              <h2 className="mt-1 font-serif text-xl text-forest-950">Reports & documentation</h2>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
              {reportsConfigured ? "Configured · not live-verified" : "Not connected"}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Activity reports and evidence-backed progress require approved registers and verified staff
            roles. They are not inferred from login identity. Shared-key sessions may create draft
            records and actions, but cannot close actions or authorise official departmental reports.
            Submission for review is not the same as institutional approval.
          </p>
          <p className="mt-2 text-xs leading-5 text-ink-600">
            Env: <code>NOTION_DEPARTMENT_REPORTS_DATABASE_ID</code>
          </p>
        </article>
      </section>

      <section id="meetings" className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
                Meetings & coordination
              </p>
              <h2 className="mt-1 font-serif text-xl text-forest-950">Department-linked meetings</h2>
            </div>
            <p className="text-xs text-ink-600">{sourceMessage}</p>
          </div>

          {upcoming.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Upcoming</p>
              <ul className="mt-2 divide-y divide-line">
                {upcoming.map((meeting) => (
                  <li key={meeting.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-forest-950">{meeting.title}</p>
                      <span className="rounded-full border border-line bg-cream-50 px-2.5 py-1 text-xs text-ink-700">
                        {meeting.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-600">
                      {meeting.meetingDate || "Date not supplied"} · {meeting.conveningBody}
                    </p>
                    <Link
                      href={`/ops/review/${encodeURIComponent(meeting.id)}`}
                      className="mt-2 inline-flex min-h-[36px] items-center text-sm font-semibold text-forest-800 hover:underline"
                    >
                      Open meeting record →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
              Recent (from loaded page)
            </p>
            {recent.length ? (
              <ul className="mt-2 divide-y divide-line">
                {recent.map((meeting) => (
                  <li key={meeting.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-forest-950">{meeting.title}</p>
                      <span className="rounded-full border border-line bg-cream-50 px-2.5 py-1 text-xs text-ink-700">
                        {meeting.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-600">
                      {meeting.meetingDate || "Date not supplied"} · {meeting.conveningBody}
                    </p>
                    <Link
                      href={`/ops/review/${encodeURIComponent(meeting.id)}`}
                      className="mt-2 inline-flex min-h-[36px] items-center text-sm font-semibold text-forest-800 hover:underline"
                    >
                      Open meeting record →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-control bg-cream-50 p-4 text-sm text-ink-600">
                No matching department meetings were found in the loaded records. This is not evidence
                that no department activity exists.
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/ops/intake"
              className="inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800"
            >
              Schedule a department meeting
            </Link>
            <Link
              href="/ops/queue"
              className="inline-flex min-h-[44px] items-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-forest-950 hover:bg-cream-50"
            >
              Open full queue
            </Link>
          </div>
        </div>

        <aside className="space-y-4">
          <section id="tools" className="rounded-card border border-line bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold-700">
              Authorised tools
            </p>
            <h2 className="mt-1 font-serif text-xl text-forest-950">Shared registers</h2>
            <ul className="mt-3 space-y-2">
              {profile.sharedRegisters.map((reg) => (
                <li key={reg.href}>
                  <Link
                    href={reg.href}
                    className="flex min-h-[44px] flex-col justify-center rounded-control border border-line px-3 py-2 hover:border-forest-800"
                  >
                    <span className="text-sm font-semibold text-forest-950">{reg.label}</span>
                    <span className="text-xs text-ink-600">{reg.purpose}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-card border border-line bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold-700">
              Ownership & roles
            </p>
            <h2 className="mt-1 font-serif text-xl text-forest-950">Appointments</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Department ownership, appointed officers and delegated scopes are not yet bound to
              verified individual identity. Until appointment records are connected and enforced
              server-side, this workspace does not assert that any logged-in staff member holds
              departmental authority.
            </p>
            <Link
              href="/ops/access"
              className="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline"
            >
              Review access controls →
            </Link>
          </section>

          <section className="rounded-card border border-line bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold-700">Public face</p>
            <h2 className="mt-1 font-serif text-xl text-forest-950">Published department page</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              The public department page explains institutional purpose and evidence questions. It does
              not expose private operational registers.
            </p>
            <Link
              href={`/departments/${profile.publicSlug}`}
              className="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline"
            >
              View public department page →
            </Link>
          </section>
        </aside>
      </section>

      <section id="coordination" className="rounded-card border border-line bg-white p-5 shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-700">
          Institutional network
        </p>
        <h2 className="mt-1 font-serif text-xl text-forest-950">Interdepartmental coordination</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-700">
          Joint programmes, support requests, referrals and shared reporting use the shared Actions,
          Meetings, Communications and External engagement registers rather than siloed copies. Cross-
          department handovers should name the receiving department and accountable role without
          inventing officer appointments.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {ALL_DEPARTMENTS.filter((d) => d.id !== department).map((d) => (
            <li key={d.id}>
              <Link
                href={`/ops/departments/${d.id}`}
                className="inline-flex min-h-[44px] w-full items-center rounded-control border border-line px-3 text-sm font-semibold text-forest-800 hover:border-forest-800"
              >
                {d.name} →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
